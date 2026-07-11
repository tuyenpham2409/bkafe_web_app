import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCookies } from './lib/cookies.js';
import { currentUser } from './middlewares/currentUser.js';
import { loadTopics } from './middlewares/loadTopics.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Set View Engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Static assets
app.use(express.static(path.join(__dirname, '../public')));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom manual cookie parser middleware
app.use((req, res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
});

// Load logged-in user profile on every request
app.use(currentUser);

// Load topics list for sidebar navigation
app.use(loadTopics);

const ERROR_TRANSLATIONS = {
  'login_required': 'Vui lòng đăng nhập để thực hiện hành động này.',
  'admin_required': 'Yêu cầu quyền quản trị viên để truy cập trang này.'
};

// Expose path and query globally to EJS templates
app.use((req, res, next) => {
  if (req.query.error && ERROR_TRANSLATIONS[req.query.error]) {
    req.query.error = ERROR_TRANSLATIONS[req.query.error];
  }
  res.locals.path = req.path;
  res.locals.query = req.query;
  next();
});

// Register routes
app.use(routes);

// 404 Error handler
app.use((req, res, next) => {
  res.status(404).render('errors/404');
});

// Global Error handler
app.use((err, req, res, next) => {
  console.error('[web error]', err);
  res.status(err.status || 500).render('errors/error', { error: err });
});

export default app;
