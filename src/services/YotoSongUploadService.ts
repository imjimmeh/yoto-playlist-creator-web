import { logger } from "./Logger";
import { YotoHttpClient } from "./YotoHttpClient";

export class YotoSongUploadService {
  private readonly httpClient: YotoHttpClient;

  constructor(httpClient: YotoHttpClient) {
    this.httpClient = httpClient;
  }

  private async calculateSHA256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

    // Convert to base64url format (like Node.js crypto.createHash().digest("base64url"))
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    // Convert base64 to base64url
    return hashBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  async getUploadUrl(file: File) {
    const fileName = file.name;
    const sha256Hash = await this.calculateSHA256(file);

    const path_with_params = `media/transcode/audio/uploadUrl?sha256=${encodeURIComponent(
      sha256Hash
    )}&filename=${encodeURIComponent(fileName)}`;

    logger.info(`Getting upload URL for: ${fileName}`);

    try {
      const result = await this.httpClient.get(path_with_params, {});

      if (!(result as any)?.upload?.uploadId) {
        throw new Error("API response missing upload ID");
      }

      if (!(result as any).upload.uploadUrl) {
        logger.info(`File already exists in Yoto system: ${fileName}`);
        return {
          uploadId: (result as any).upload.uploadId,
          uploadUrl: null,
          fileName,
          sha256Hash,
          alreadyExists: true,
        };
      }

      return {
        uploadId: (result as any).upload.uploadId,
        uploadUrl: (result as any).upload.uploadUrl,
        fileName,
        sha256Hash,
        alreadyExists: false,
      };
    } catch (error) {
      logger.error(`Error getting upload URL for ${fileName}:`, error);
      if (error instanceof Error) {
        throw new Error(`Failed to get upload URL: ${error.message}`);
      }
      throw new Error("Failed to get upload URL due to an unknown error.");
    }
  }

  async uploadFileToS3(file: File, uploadUrl: string) {
    if (!uploadUrl) {
      throw new Error("Upload URL is required but was null or undefined");
    }

    logger.info(`Uploading file to S3: ${file.name} (${file.size} bytes)`);

    try {
      // S3 uploads need special handling - use direct fetch since it's not Yoto API
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error uploading file ${file.name}:`, error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      throw new Error("Failed to upload file due to an unknown error.");
    }
  }

  async checkTranscodingStatus(uploadId: string, loudnorm = false) {
    logger.info(`Checking transcoding status for upload: ${uploadId}`);

    try {
      const result = await this.httpClient.get(
        `media/upload/${uploadId}/transcoded?loudnorm=${loudnorm}`,
        {}
      );
      const isComplete = (result as any).transcode?.transcodedAt !== undefined;

      return {
        isComplete,
        transcode: (result as any).transcode,
      };
    } catch (error) {
      logger.error(`Error checking transcoding status for ${uploadId}:`, error);
      if (error instanceof Error) {
        throw new Error(`Failed to check transcoding status: ${error.message}`);
      }
      throw new Error(
        "Failed to check transcoding status due to an unknown error."
      );
    }
  }

  async waitForTranscoding(
    uploadId: string,
    loudnorm = false,
    maxWaitTime = 300000,
    pollInterval = 5000
  ) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.checkTranscodingStatus(uploadId, loudnorm);

      if (status.isComplete) {
        logger.info(`Transcoding completed for upload: ${uploadId}`);
        return status.transcode;
      }

      logger.info(
        `Transcoding still in progress for ${uploadId}, waiting ${pollInterval}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(
      `Transcoding timeout after ${maxWaitTime}ms for upload: ${uploadId}`
    );
  }

  async uploadSong(file: File, loudnorm = false, waitForCompletion = true) {
    logger.info(`Starting complete song upload process for: ${file.name}`);

    try {
      const uploadDetails = await this.getUploadUrl(file);

      if (uploadDetails.alreadyExists) {
        logger.info(
          `Skipping file upload - file already exists in Yoto system`
        );
      } else {
        await this.uploadFileToS3(file, uploadDetails.uploadUrl);
      }

      let transcodeResult;
      if (waitForCompletion) {
        transcodeResult = await this.waitForTranscoding(
          uploadDetails.uploadId,
          loudnorm
        );
      } else {
        const status = await this.checkTranscodingStatus(
          uploadDetails.uploadId,
          loudnorm
        );
        transcodeResult = status.transcode;
      }

      return {
        success: true,
        uploadId: uploadDetails.uploadId,
        fileName: uploadDetails.fileName,
        sha256Hash: uploadDetails.sha256Hash,
        transcode: transcodeResult,
        isTranscodingComplete: transcodeResult?.transcodedAt !== undefined,
        alreadyExists: uploadDetails.alreadyExists,
        message: uploadDetails.alreadyExists
          ? "File already exists in Yoto system"
          : "File uploaded successfully",
      };
    } catch (error) {
      logger.error(`Error in complete upload process:`, error);
      throw error;
    }
  }
}
