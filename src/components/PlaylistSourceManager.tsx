import React, { useState } from "react";
import type { PlaylistSource, FileInfo } from "../types";
import "./PlaylistSourceManager.css";
import { logger } from "../services/Logger";

interface PlaylistSourceManagerProps {
  sources: PlaylistSource[];
  onSourcesChange: (sources: PlaylistSource[]) => void;
  onFilesChange: (files: FileInfo[]) => void;
}

const PlaylistSourceManager: React.FC<PlaylistSourceManagerProps> = ({
  sources,
  onSourcesChange,
  onFilesChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const generateSourceId = () =>
    `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addFiles = async () => {
    setIsLoading(true);
    try {
      // Create file input element for web
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".mp3";
      fileInput.multiple = true;

      fileInput.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const selectedFiles = target.files;

        if (selectedFiles && selectedFiles.length > 0) {
          const fileList: string[] = [];
          const fileInfos: FileInfo[] = [];

          for (const element of selectedFiles) {
            const file = element;
            fileList.push(file.name);
            fileInfos.push({
              fileName: file.name,
              filePath: URL.createObjectURL(file),
              fileSize: file.size,
              file: file,
            });
          }

          const newSource: PlaylistSource = {
            id: generateSourceId(),
            type: "files",
            path: `Selected Files (${fileList.length} files)`,
            files: fileList,
            fileCount: fileList.length,
          };

          const updatedSources = [...sources, newSource];
          onSourcesChange(updatedSources);
          onFilesChange([...getAllFiles(sources), ...fileInfos]);
        }
        setIsLoading(false);
      };

      fileInput.oncancel = () => {
        setIsLoading(false);
      };

      fileInput.click();
    } catch (error) {
      logger.error("Error adding files:", error);
      setIsLoading(false);
    }
  };

  const removeSource = (sourceId: string) => {
    const updatedSources = sources.filter((source) => source.id !== sourceId);
    onSourcesChange(updatedSources);
    updateFilesList(updatedSources);
  };

  const getAllFiles = (sourcesToProcess: PlaylistSource[]): FileInfo[] => {
    const allFiles: FileInfo[] = [];

    for (const source of sourcesToProcess) {
      if (source.type === "files" && source.files) {
        const fileInfos: FileInfo[] = source.files.map((fileName) => ({
          fileName: fileName,
          filePath: fileName, // For web, this might be different
          fileSize: 0, // We'll get the actual size when needed
        }));
        allFiles.push(...fileInfos);
      }
    }

    return allFiles.sort((a, b) => a.fileName.localeCompare(b.fileName));
  };

  const updateFilesList = (updatedSources: PlaylistSource[]) => {
    try {
      const allFiles = getAllFiles(updatedSources);
      onFilesChange(allFiles);
    } catch (error) {
      logger.error("Error updating files list:", error);
    }
  };

  const getSourceIcon = (type: PlaylistSource["type"]) => {
    return type === "directory" ? "📁" : "🎵";
  };

  const getDisplayPath = (source: PlaylistSource) => {
    if (source.type === "directory") {
      return source.path.split(/[/\\]/).pop() || source.path;
    }
    return source.path;
  };

  const totalFiles = sources.reduce((sum, source) => sum + source.fileCount, 0);

  return (
    <div className="playlist-source-manager">
      <div className="source-actions">
        <div className="action-group">
          <button
            className="add-source-btn primary-btn"
            onClick={addFiles}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Adding...
              </>
            ) : (
              <>🎵 Browse & Select MP3s</>
            )}
          </button>
          <p className="action-description">
            Browse your files and select specific MP3s
          </p>
        </div>
      </div>

      {sources.length > 0 && (
        <>
          <div className="sources-summary">
            <span className="summary-text">
              {sources.length} source{sources.length !== 1 ? "s" : ""} •{" "}
              {totalFiles} file{totalFiles !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="sources-list">
            {sources.map((source) => (
              <div key={source.id} className="source-item">
                <div className="source-info">
                  <span className="source-icon">
                    {getSourceIcon(source.type)}
                  </span>
                  <div className="source-details">
                    <span className="source-path" title={source.path}>
                      {getDisplayPath(source)}
                    </span>
                    <span
                      className={`source-meta ${
                        source.fileCount === 0 ? "no-files" : ""
                      }`}
                    >
                      {source.fileCount === 0
                        ? "⚠️ No MP3 files found"
                        : `${source.fileCount} file${
                            source.fileCount !== 1 ? "s" : ""
                          }`}
                    </span>
                  </div>
                </div>
                <button
                  className="remove-source-btn"
                  onClick={() => removeSource(source.id)}
                  title="Remove source"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {sources.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎼</div>
          <p>No music sources selected</p>
          <p className="empty-subtitle">
            Add individual MP3 files to create your playlist
          </p>
        </div>
      )}
    </div>
  );
};

export default PlaylistSourceManager;
