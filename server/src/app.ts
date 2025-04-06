import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import discussionRoutes from './routes/discussion.routes';
import shareRoutes from './routes/share.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Get the absolute path to the uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
console.log('Uploads directory path:', uploadsDir);
console.log('Uploads directory exists:', fs.existsSync(uploadsDir));
if (fs.existsSync(uploadsDir)) {
  console.log('Uploads directory contents:', fs.readdirSync(uploadsDir));
}

// Add logging middleware before static file serving
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(uploadsDir, req.path);
  const fileExists = fs.existsSync(filePath);
  
  console.log('Static file request:', {
    path: req.path,
    uploadsDir,
    filePath,
    exists: fileExists,
    method: req.method,
    dirExists: fs.existsSync(uploadsDir),
    dirContents: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [],
    cwd: process.cwd(),
    __dirname: __dirname,
    headers: req.headers
  });

  if (!fileExists) {
    console.error('File not found:', {
      requestedPath: req.path,
      fullPath: filePath,
      directoryContents: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
    });
  }

  next();
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    console.log('Serving file:', path);
    // Add CORS headers for static files
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/community-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

export default app; 