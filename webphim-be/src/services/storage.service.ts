// UPLOAD LEARN 10: Tất cả file (raw video, HLS segments, thumbnails) lưu qua Storage layer.
// Hiện tại: LocalStorage (disk). Production: đổi sang R2/S3 (cloud) mà không sửa code khác
// nhờ Interface pattern.

import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

export interface StorageProvider {
  /** Save file and return the storage path */
  saveFile(filePath: string, destination: string): Promise<string>;
  /** Get readable URL/path for a stored file */
  getUrl(storagePath: string): string;
  /** Delete a file */
  deleteFile(storagePath: string): Promise<void>;
  /** Check if file exists */
  exists(storagePath: string): Promise<boolean>;
  /** Ensure directory exists */
  ensureDir(dirPath: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async saveFile(filePath: string, destination: string): Promise<string> {
    const fullDest = path.join(this.baseDir, destination);
    await this.ensureDir(path.dirname(fullDest));
    await fs.copyFile(filePath, fullDest);
    return destination;
  }

  getUrl(storagePath: string): string {
    return `/${storagePath}`;
  }

  async deleteFile(storagePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, storagePath);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      // Ignore ENOENT (file already deleted)
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, storagePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureDir(dirPath: string): Promise<void> {
    // If dirPath is relative, resolve against baseDir
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(this.baseDir, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  getFullPath(storagePath: string): string {
    return path.join(this.baseDir, storagePath);
  }

  getBaseDir(): string {
    return this.baseDir;
  }
}

// Singleton instance
const storageProvider = new LocalStorageProvider(config.storage.localDir);

export { storageProvider, LocalStorageProvider };
