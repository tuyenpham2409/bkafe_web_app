import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCookies } from './lib/cookies.js';
import { currentUser } from './middlewares/currentUser.js';
import { loadTopics } from './middlewares/loadTopics.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));


app.use(express.static(path.join(__dirname, '../public')));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
});


app.use(currentUser);


app.use(loadTopics);

const ERROR_TRANSLATIONS = {
  'login_required': 'Vui lòng đăng nhập để thực hiện hành động này.',
  'admin_required': 'Yêu cầu quyền quản trị viên để truy cập trang này.'
};


app.use((req, res, next) => {
  if (req.query.error && ERROR_TRANSLATIONS[req.query.error]) {
    req.query.error = ERROR_TRANSLATIONS[req.query.error];
  }
  res.locals.path = req.path;
  res.locals.query = req.query;
  next();
});


app.use(routes);


app.use((req, res, next) => {
  res.status(404).render('errors/404');
});


app.use((err, req, res, next) => {
  console.error('[web error]', err);
  res.status(err.status || 500).render('errors/error', { error: err });
});

export default app;
