// Wrap async route handlers so thrown errors reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// 404 for unknown routes
export function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}` });
}

// Centralised error responder
export function errorHandler(err, _req, res, _next) {
  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'trường';
    return res.status(409).json({ message: `Giá trị '${field}' đã tồn tại.` });
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message: msg });
  }
  // Multer / upload errors
  if (err.name === 'MulterError' || /Chỉ chấp nhận/.test(err.message)) {
    return res.status(400).json({ message: err.message });
  }
  console.error('[error]', err);
  res.status(err.status || 500).json({ message: err.message || 'Lỗi máy chủ.' });
}
