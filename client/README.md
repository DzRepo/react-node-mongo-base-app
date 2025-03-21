# React Node MongoDB Base App - Frontend

This is the frontend client for the React Node MongoDB Base Application. It's built with React 18, TypeScript, and Vite for a modern, responsive user experience.

## Features

- **React 18** with TypeScript and functional components
- **React Router v6** for navigation with protected routes
- **React Query** for efficient data fetching and caching
- **Formik & Yup** for robust form validation
- **Tailwind CSS** for responsive design with dark mode support
- **Axios** for API communication with interceptors
- **Context API** for state management (Auth and Theme contexts)
- **Component-based architecture** for reusability

## UI Features

- Responsive design for mobile, tablet, and desktop
- Dark/light mode theme toggle with system preference detection
- Form validation with immediate feedback
- Loading states and error handling
- Protected routes based on authentication status and user roles

## Project Structure

```
src/
│
├── components/          # Reusable UI components
│   ├── auth/            # Authentication-related components
│   ├── layout/          # Layout components (header, footer, etc.)
│   ├── ui/              # Basic UI components (buttons, inputs, etc.)
│   └── ...
│
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication state management
│   └── ThemeContext.tsx # Theme (dark/light mode) management
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useTheme.ts      # Theme hook
│   └── ...
│
├── pages/               # Page components
│   ├── About.tsx        # About page with contact form
│   ├── Home.tsx         # Public landing page
│   ├── Login.tsx        # Login page
│   ├── Members.tsx      # Protected members area
│   └── ...
│
├── types/               # TypeScript type definitions
│   ├── auth.types.ts    # Authentication-related types
│   ├── user.types.ts    # User-related types
│   └── ...
│
├── utils/               # Utility functions
│   ├── api.ts           # Axios instance and interceptors
│   ├── validation.ts    # Common validation schemas
│   └── ...
│
├── App.tsx              # Main app component with routing
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Available Pages

- **Home**: Public landing page accessible to all visitors
- **About**: Company information page with contact form
- **Register**: User registration form with email validation
- **Login**: Authentication form with error handling
- **Forgot Password**: Password reset request form
- **Reset Password**: New password form with validation
- **Members**: Protected page for authenticated users
- **Unauthorized**: Access denied page for unauthorized access attempts

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Create a `.env` file in the client directory:
   ```
   VITE_API_URL=http://localhost:3001
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application at http://localhost:5173

## Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally
- `npm run lint`: Run ESLint to check for code quality issues
- `npm run test`: Run tests (when implemented)

## Authentication Flow

The client implements a complete authentication flow with:
- User registration with email verification
- Login with JWT storage and refresh tokens
- Password reset via email
- Automatic token refresh
- Protected routes based on authentication status
- Role-based access to features

## Customization

### Styling

The application uses Tailwind CSS for styling. The main configuration file is `tailwind.config.js` where you can customize:
- Color schemes
- Fonts
- Breakpoints
- Other theme settings

### Adding New Pages

To add a new page:
1. Create a new component in the `pages` directory
2. Add the route in `App.tsx`
3. If the page requires authentication, wrap it with the `ProtectedRoute` component

## Connecting to Backend

The frontend connects to the backend API defined in the `VITE_API_URL` environment variable. API calls are handled through the Axios instance in `utils/api.ts`, which automatically:
- Adds authentication headers
- Handles token refreshing
- Manages error responses
- Provides type safety for requests and responses
