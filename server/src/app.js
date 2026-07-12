import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import api from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true, 
    })
  );
  app.use(express.json({ limit: '10mb' })); 
  app.use(express.urlencoded({ extended: true }));

  
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.get('/', (_req, res) => res.json({ service: 'BKafe API', docs: '/api/health' }));
  app.use('/api', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
