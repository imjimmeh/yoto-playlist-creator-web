import { logger } from "@/services/Logger";

// Web-compatible storage interface that mimics Electron store
export class AppStorage {
  private storagePrefix = "yoto-playlist-creator-";

  get(key: string): string | null {
    return localStorage.getItem(this.storagePrefix + key);
  }

  set(key: string, value: string): void {
    localStorage.setItem(this.storagePrefix + key, value);
  }

  delete(key: string): void {
    localStorage.removeItem(this.storagePrefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.storagePrefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Web file handling utilities
export interface FileOperations {
  selectFiles: (options?: {
    multiple?: boolean;
    accept?: string;
  }) => Promise<File[]>;
  selectDirectory: () => Promise<FileList | null>;
  readFile: (file: File) => Promise<ArrayBuffer>;
}

export class WebFileOperations implements FileOperations {
  async selectFiles(
    options: { multiple?: boolean; accept?: string } = {}
  ): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = options.multiple ?? false;
      input.accept = options.accept ?? "*/*";

      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (files) {
          resolve(Array.from(files));
        } else {
          resolve([]);
        }
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  async selectDirectory(): Promise<FileList | null> {
    // Modern browsers support directory selection
    if ("showDirectoryPicker" in window) {
      try {
        const directoryHandle = await window.showDirectoryPicker!();
        const files: File[] = [];

        async function processHandle(handle: FileSystemHandle, path = "") {
          if (handle.kind === "file") {
            const file = await (handle as FileSystemFileHandle).getFile();
            files.push(new File([file], path + file.name, { type: file.type }));
          } else if (handle.kind === "directory") {
            for await (const [name, subHandle] of (
              handle as FileSystemDirectoryHandle
            ).entries()) {
              await processHandle(subHandle, path + name + "/");
            }
          }
        }

        await processHandle(directoryHandle);
        return files as unknown as FileList; // Convert to FileList-like structure
      } catch (error) {
        logger.error("Directory selection failed:", error);
        return null;
      }
    } else {
      // Fallback for older browsers - use multiple file selection
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.webkitdirectory = true;

      return new Promise((resolve) => {
        input.onchange = (event) => {
          const target = event.target as HTMLInputElement;
          resolve(target.files);
        };
        input.oncancel = () => resolve(null);
        input.click();
      });
    }
  }

  async readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
}

// Web API interface that provides browser-compatible alternatives to Electron APIs
export interface WebAPI {
  appStorage: AppStorage;
  fileOperations: FileOperations;
  platform: string;
  isWeb: boolean;
}

export const createWebAPI = (): WebAPI => ({
  appStorage: new AppStorage(),
  fileOperations: new WebFileOperations(),
  platform: "web",
  isWeb: true,
});
