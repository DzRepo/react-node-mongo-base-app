# React Node MongoDB Base Application

A modern full-stack application scaffold built with React, Node.js, and MongoDB. This application provides a complete foundation for building web applications with authentication, role-based access control, dark mode support, and more.

## Features

### Frontend
- **React 18** with TypeScript and Vite for fast development
- **React Router v6** for navigation and protected routes
- **React Query** for efficient data fetching and caching
- **Formik & Yup** for form validation
- **Tailwind CSS** for responsive design with dark mode support
- **Axios** for API communication with interceptors
- **Context API** for state management (Auth and Theme contexts)

### Backend
- **Node.js** with Express and TypeScript
- **MongoDB** with Mongoose for data modeling
- **JWT** authentication with refresh tokens
- **Role-based access control** with customizable permissions
- **Email verification** system
- **Password reset** functionality
- **Audit logging** for security events
- **Error handling** middleware
- **Logging** with configurable levels

### Authentication & Authorization
- User registration with email verification
- Login with JWT tokens
- Password reset flow
- Role-based access control:
  - **User**: Basic permissions (read/write own data)
  - **Reader**: Can read all content but only modify their own
  - **Moderator**: Content management permissions
  - **Admin**: Full system access

### UI Features
- Responsive design for all screen sizes
- Dark/light mode theme toggle with system preference detection
- Form validation with immediate feedback
- Loading states and error handling
- Protected routes based on authentication and roles

## Project Structure

```
.
├── client/                 # React frontend application
│   ├── src/                # Source files
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Theme)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions and API client
│   ├── public/             # Static files
│   └── package.json        # Frontend dependencies
├── server/                 # Node.js backend application
│   ├── src/                # Source files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Express routes
│   │   └── utils/          # Utility functions
│   └── package.json        # Backend dependencies
└── README.md               # Project documentation
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd react-node-mongo-base-app
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Set up MongoDB:
   - Create a MongoDB database
   - For local development with authentication:
     ```javascript
     use admin
     db.createUser({
       user: "admin",
       pwd: "password",
       roles: [{ role: "readWrite", db: "datastore" }]
     })
     ```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in both client and server directories
   - Update the variables with your configuration
   - Key settings to configure:
     - `MONGODB_URI` - Your MongoDB connection string
     - `JWT_SECRET` - Secret for signing JWT tokens
     - `SMTP_*` - Email server settings for verification emails

5. Setup database roles:
   ```bash
   # From the server directory
   npx ts-node src/setupDatabase.ts
   ```

6. Start the development servers:
   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend server (from client directory)
   npm run dev
   ```

7. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Available Pages

- **Home**: Public landing page
- **About**: Company information page with contact form
- **Register**: User registration form
- **Login**: Authentication form
- **Forgot Password**: Password reset request form
- **Reset Password**: New password form
- **Members**: Protected page for authenticated users
- **Unauthorized**: Access denied page

## User Roles

1. **User**: Basic permissions (read/write own data)
   - Default role assigned to all users
   - Permissions: `read:own`, `write:own`

2. **Reader**: Enhanced reading permissions
   - Can read all content but only modify their own
   - Permissions: `read:all`, `write:own`

3. **Moderator**: Content management permissions
   - Can moderate content across the platform
   - Permissions: `read:all`, `write:own`, `moderate:content`

4. **Admin**: Full system access
   - Complete control over the application
   - Permissions: `*` (all permissions)

## Available Scripts

### Backend (server directory)
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build the TypeScript code
- `npm start`: Start the production server
- `npm test`: Run tests

### Frontend (client directory)
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally
- `npm test`: Run tests

## Environment Variables

### Backend (.env)
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

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
