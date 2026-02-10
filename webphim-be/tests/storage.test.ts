import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { LocalStorageProvider } from '../src/services/storage.service';

const TEST_BASE_DIR = path.resolve('uploads_test');
const TEST_FIXTURES_DIR = path.resolve('tests/fixtures');

let storage: LocalStorageProvider;

beforeAll(async () => {
  storage = new LocalStorageProvider(TEST_BASE_DIR);
  await fs.mkdir(TEST_BASE_DIR, { recursive: true });
  await fs.mkdir(TEST_FIXTURES_DIR, { recursive: true });
});

beforeEach(async () => {
  // Clean test upload dir between tests
  try {
    await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    await fs.mkdir(TEST_BASE_DIR, { recursive: true });
  } catch {
    // ignore
  }
});

afterAll(async () => {
  await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
});

describe('LocalStorageProvider', () => {
  describe('ensureDir', () => {
    it('should create a nested directory', async () => {
      await storage.ensureDir('hls/test-video/1080p');

      const stat = await fs.stat(path.join(TEST_BASE_DIR, 'hls/test-video/1080p'));
      expect(stat.isDirectory()).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      await storage.ensureDir('existing');
      await expect(storage.ensureDir('existing')).resolves.not.toThrow();
    });
  });

  describe('saveFile', () => {
    it('should copy file to destination', async () => {
      // Create a source file
      const srcPath = path.join(TEST_FIXTURES_DIR, 'test-save.txt');
      await fs.writeFile(srcPath, 'test content');

      const storagePath = await storage.saveFile(srcPath, 'raw/test-save.txt');

      expect(storagePath).toBe('raw/test-save.txt');
      const content = await fs.readFile(path.join(TEST_BASE_DIR, storagePath), 'utf8');
      expect(content).toBe('test content');

      // Clean up fixture
      await fs.unlink(srcPath);
    });

    it('should create parent directories if missing', async () => {
      const srcPath = path.join(TEST_FIXTURES_DIR, 'test-nested.txt');
      await fs.writeFile(srcPath, 'nested content');

      const storagePath = await storage.saveFile(srcPath, 'deep/nested/dir/file.txt');

      expect(storagePath).toBe('deep/nested/dir/file.txt');
      const exists = await storage.exists(storagePath);
      expect(exists).toBe(true);

      await fs.unlink(srcPath);
    });
  });

  describe('getUrl', () => {
    it('should return path with leading slash', () => {
      const url = storage.getUrl('hls/video-id/master.m3u8');
      expect(url).toBe('/hls/video-id/master.m3u8');
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      // Create a file
      await storage.ensureDir('raw');
      await fs.writeFile(path.join(TEST_BASE_DIR, 'raw/delete-me.txt'), 'tmp');

      await storage.deleteFile('raw/delete-me.txt');

      const exists = await storage.exists('raw/delete-me.txt');
      expect(exists).toBe(false);
    });

    it('should not throw if file does not exist', async () => {
      await expect(storage.deleteFile('nonexistent.txt')).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await storage.ensureDir('raw');
      await fs.writeFile(path.join(TEST_BASE_DIR, 'raw/exists.txt'), 'data');

      const result = await storage.exists('raw/exists.txt');
      expect(result).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const result = await storage.exists('raw/no-such-file.txt');
      expect(result).toBe(false);
    });
  });

  describe('getFullPath', () => {
    it('should return the absolute path', () => {
      const fullPath = storage.getFullPath('hls/video/master.m3u8');
      expect(fullPath).toBe(path.join(TEST_BASE_DIR, 'hls/video/master.m3u8'));
    });
  });

  describe('getBaseDir', () => {
    it('should return the base directory', () => {
      expect(storage.getBaseDir()).toBe(TEST_BASE_DIR);
    });
  });
});
