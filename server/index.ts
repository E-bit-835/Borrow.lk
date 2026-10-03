import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { verifyConnection } from './config/db';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, postman) or matching whitelist
      if (!origin || config.corsOrigins.includes(origin) || config.nodeEnv === 'development') {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Mount REST API
app.use('/api', apiRoutes);
app.use('/api', notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Start Server
async function startServer() {
  console.log('🔄 Initializing BorrowLK Backend Server...');
  
  // Verify NeonDB connection
  const dbOk = await verifyConnection();
  if (!dbOk) {
    console.warn('⚠️ Warning: Initial NeonDB connection check failed. Will retry on request.');
  }

  // Bind to all interfaces so localhost / 127.0.0.1 both work on Windows
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`🚀 BorrowLK Backend API running at http://localhost:${config.port}`);
    console.log(`📚 REST API Base: http://localhost:${config.port}/api`);
    console.log(`🗄️ Database: NeonDB PostgreSQL (${config.neonBranch} branch)`);
    console.log(`🤖 AI Engine: Free Open-Source AI (${config.openSourceAi.model})`);
    console.log(`🧠 ML Engine: Custom ML Model (${config.customMl.modelName} ${config.customMl.modelVersion})`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${config.port} is already in use. Stop the other process or change PORT in .env.`);
    } else {
      console.error('❌ HTTP server error:', err.message);
    }
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

export default app;
