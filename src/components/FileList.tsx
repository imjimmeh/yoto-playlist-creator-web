import React from "react";
import type { FileInfo } from "../types";
import ProgressBar from "./ProgressBar";
import "./FileList.css";

interface FileListProps {
  files: FileInfo[];
  showProgress?: boolean;
}

const FileList: React.FC<FileListProps> = ({ files, showProgress = false }) => {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getTotalSize = () => {
    const totalBytes = files.reduce((sum, file) => sum + file.fileSize, 0);
    return formatBytes(totalBytes);
  };

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h3>{files.length} MP3 Files Selected</h3>
        <span className="total-size">Total: {getTotalSize()}</span>
      </div>
      <div className="file-list-wrapper">
        <ul className="file-list">
          {files.map((file, index) => (
            <li key={file.filePath || `file-${index}`} className="file-item">
              <div className="file-info">
                <span className="file-name" title={file.fileName}>
                  {file.fileName}
                </span>
                <span className="file-size">{formatBytes(file.fileSize)}</span>
              </div>
              {showProgress && (
                <div className="file-progress">
                  <ProgressBar
                    progress={0}
                    showText={false}
                    size="small"
                    variant="primary"
                  />
                  <span className="progress-text">Ready</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileList;