// UPLOAD LEARN 4: File từ FE tới đây đầu tiên.
// Multer middleware nhận multipart upload, validate video type (mp4/mov/avi/webm/mkv)
// + size max 2GB, lưu vào uploads/raw/ với UUID filename. Tiếp: xem LEARN 5.

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from './index';

const ALLOWED_MIMES = [
  'video/mp4',
  'video/quicktime',       // .mov
  'video/x-msvideo',       // .avi
  'video/webm',
  'video/x-matroska',      // .mkv
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(config.storage.localDir, 'raw'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: config.storage.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Accepted: mp4, mov, avi, webm, mkv'));
    }
  },
});

export { ALLOWED_MIMES };
