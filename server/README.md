# React Node MongoDB Base App - Server

The backend server for the React Node MongoDB Base Application. Built with Node.js, Express, TypeScript, and MongoDB, it provides a complete API with authentication, role-based access control, and data management.

## Features

- **Node.js** with Express framework
- **TypeScript** for type safety and better developer experience
- **MongoDB** with Mongoose ODM
- **JWT Authentication** with refresh token mechanism
- **Role-based Authorization** with customizable permissions
- **Password Reset** functionality
- **Email Verification** system
- **Audit Logging** for security events
- **Error Handling** middleware
- **Centralized Logging** with Winston
- **API Rate Limiting**
- **Middleware-based Architecture**

## Project Structure

```
src/
│
├── controllers/            # Route controllers
│   ├── auth.controller.ts  # Authentication logic
│   ├── user.controller.ts  # User management
│   └── ...
│
├── middleware/             # Express middleware
│   ├── auth.middleware.ts  # JWT verification
│   ├── error.middleware.ts # Error handling
│   └── ...
│
├── models/                 # Mongoose models
│   ├── User.ts             # User model with authentication
│   ├── Role.ts             # Role model with permissions
│   └── ...
│
├── routes/                 # Express routes
│   ├── auth.routes.ts      # Authentication routes
│   ├── user.routes.ts      # User management routes
│   └── ...
│
├── utils/                  # Utility functions
│   ├── logger.ts           # Winston logger setup
│   ├── email.ts            # Email sending functionality
│   └── ...
│
├── config/                 # Configuration
│   ├── db.ts               # Database connection
│   └── ...
│
├── setupDatabase.ts        # Database initialization
├── index.ts                # Application entry point
└── types.ts                # TypeScript type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user and get tokens
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify-email/:token` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Users
- `GET /api/users/me` - Get current user info
- `PUT /api/users/me` - Update current user
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Role System

The application uses a role-based access control system with the following default roles:

1. **User Role** - Default for all new users
   - Permissions: `read:own`, `write:own`
   - Can read and modify only their own data

2. **Reader Role** - Enhanced reading permissions
   - Permissions: `read:all`, `write:own`
   - Can read all content but only modify their own

3. **Moderator Role** - Content management
   - Permissions: `read:all`, `write:own`, `moderate:content`
   - Can read all content, moderate content, but only modify their own data

4. **Admin Role** - Full system access
   - Permissions: `read:all`, `write:all`, `delete:all`, `admin:all`
   - Complete control over the application

### Permission System

The permission system uses the format `action:scope` where:
- **action**: The type of operation (read, write, delete, admin, etc.)
- **scope**: The scope of resources (own, all)

Common permissions include:
- `read:own` - Read only your own resources
- `read:all` - Read all resources
- `write:own` - Modify only your own resources
- `write:all` - Modify all resources
- `delete:all` - Delete any resources
- `admin:all` - Administrative operations
- `moderate:content` - Special permission for content moderation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the server directory with the following variables:
   ```
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://username:password@localhost:27017/datastore?authSource=admin&retryWrites=true&w=majority
   
   # JWT Configuration
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   
   # Logging Configuration
   LOG_LEVEL=debug
   LOG_FILE=logs/app.log
   
   # Email Configuration (for verification)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   ```

3. Initialize the database:
   ```bash
   npx ts-node src/setupDatabase.ts
   ```
   This creates default roles and an admin user if they don't exist.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The server will be running at http://localhost:3001

## Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build the TypeScript code to JavaScript
- `npm start`: Start the production server from built files
- `npm test`: Run tests
- `npm run lint`: Run ESLint to check for code quality issues

## Error Handling

The server uses a centralized error handling approach:
- Custom error classes with HTTP status codes
- Error middleware to format and log errors
- Detailed error responses for API consumers

## Logging

Logging is handled by Winston with the following features:
- Different log levels based on environment
- Console logging for development
- File logging for production
- Request logging with request IDs
- Error stack traces

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Email verification flow
- CORS protection
- Input validation
- Rate limiting
- Role-based access control
- Audit logging for security events 