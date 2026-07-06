import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

// Reads the Bearer token, loads the user and attaches it to req.user.
// `required=false` lets a route work for both guests and logged-in users.
export function auth(required = true) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        if (required) return res.status(401).json({ message: 'Bạn cần đăng nhập.' });
        req.user = null;
        return next();
      }

      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.id);
      if (!user) {
        if (required) return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
        req.user = null;
        return next();
      }

      req.user = user;
      next();
    } catch (err) {
      if (required) return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' });
      req.user = null;
      next();
    }
  };
}

export function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ quản trị viên mới được thực hiện thao tác này.' });
  }
  next();
}
