import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { corsOptions } from './config/cors';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';

const app = express();

// Serve HLS/thumbnail files BEFORE helmet so security headers don't block cross-origin loading
app.use('/uploads/hls', express.static(path.join(config.storage.localDir, 'hls'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  },
}));

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiting
app.use('/api', apiLimiter);

// API routes
app.use('/api', routes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
