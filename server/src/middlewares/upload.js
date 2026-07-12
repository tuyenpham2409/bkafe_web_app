import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const ALLOWED = /^(image\/(jpe?g|png|gif|webp)|video\/(mp4|webm|ogg|quicktime))$/;

function fileFilter(_req, file, cb) {
  if (ALLOWED.test(file.mimetype)) cb(null, true);
  else cb(new Error('Chỉ chấp nhận ảnh (jpg, png, gif, webp) hoặc video (mp4, webm, ogg).'));
}


export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});

export { uploadDir };
