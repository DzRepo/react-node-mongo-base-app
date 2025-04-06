import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import setupDatabase from './setupDatabase';
import authRoutes from './routes/auth.routes';
import discussionRoutes from './routes/discussion.routes';
import userRoutes from './routes/user.routes';
import reportRoutes from './routes/report.routes';
import debugAuthRoutes from './routes/debug-auth';
import { optionalAuth } from './middleware/auth';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Apply optional authentication to all routes
// This will attach the user to the request if a valid token is provided
// but will still allow requests without authentication
app.use((req, res, next) => {
  logger.info(`Incoming request to: ${req.method} ${req.path}`);
  logger.info(`Authorization header: ${req.headers.authorization ? 'Present' : 'Not present'}`);
  next();
});

app.use(optionalAuth);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', debugAuthRoutes);
app.use('/api', discussionRoutes);
app.use('/api/reports', reportRoutes);

// Database connection
const connectToDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://datastoreReadWrite:goldfish@localhost:27017/datastore?authSource=admin&retryWrites=true&w=majority');
    logger.info('Connected to MongoDB');

    // Ensure default data exists (don't connect or disconnect since we're already connected)
    await setupDatabase();
    // logger.info('Database setup completed');

    // Start server after database is ready
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to React Node MongoDB Base App API' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
connectToDatabase(); 