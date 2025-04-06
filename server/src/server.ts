import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import discussionRoutes from './routes/discussion.routes';
import { optionalAuth } from './middleware/auth';
import logger from './utils/logger';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/react-node-app';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get the absolute path to the uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
console.log('Server.ts - Uploads directory path:', uploadsDir);
console.log('Server.ts - Uploads directory exists:', fs.existsSync(uploadsDir));
if (fs.existsSync(uploadsDir)) {
  console.log('Server.ts - Uploads directory contents:', fs.readdirSync(uploadsDir));
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    console.log('Server.ts - Serving file:', path);
    // Add CORS headers for static files
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

// Apply optional authentication to attach user to requests if token provided
app.use(optionalAuth);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', discussionRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }); 