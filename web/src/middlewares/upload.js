import multer from 'multer';

const ALLOWED = /^(image\/(jpe?g|png|gif|webp)|video\/(mp4|webm|ogg|quicktime))$/;

function fileFilter(_req, file, cb) {
  if (ALLOWED.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận ảnh (jpg, png, gif, webp) hoặc video (mp4, webm, ogg).'));
  }
}

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});
