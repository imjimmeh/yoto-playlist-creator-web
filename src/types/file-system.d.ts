// File System Access API types (for browsers that support it)
declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: unknown[];
    }) => Promise<FileSystemFileHandle[]>;
  }

  interface FileSystemHandle {
    kind: "file" | "directory";
    name: string;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    kind: "file";
    getFile(): Promise<File>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    kind: "directory";
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    keys(): AsyncIterableIterator<string>;
  }
}

export {};
