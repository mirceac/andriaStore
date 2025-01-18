# Modern E-commerce Platform

A modern e-commerce platform built with React, Express, and PostgreSQL, featuring a responsive design, user authentication, and Stripe payment integration.

## Features

- 🛍️ Product browsing and shopping cart
- 🔐 User authentication (login/signup)
- 💳 Secure payments with Stripe
- 📱 Responsive mobile and desktop design
- 👤 User dashboard with order history
- 🔑 Admin dashboard for inventory management

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or higher
- PostgreSQL database
- Stripe account for payments

## Environment Variables

The following environment variables are required:

```env
DATABASE_URL=postgresql://user:password@host:port/database
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Push the database schema:
```bash
npm run db:push
```

## Running the Application

To start the development server:

```bash
npm run dev
```

This will start both the frontend and backend servers. The application will be available at `http://localhost:5000`.

## Building for Production

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and contexts
│   │   └── pages/        # Application pages
├── db/                    # Database schema and configuration
├── server/                # Backend Express application
│   ├── middleware/       # Express middleware
│   └── routes.ts         # API routes
└── package.json          # Project dependencies and scripts
```

## Development Guidelines

- Frontend uses shadcn + Tailwind CSS for styling
- Backend routes are prefixed with `/api`
- Database changes should be made through Drizzle ORM
- Use the provided React hooks for data fetching and state management

## Authentication

The platform includes a complete authentication system with:
- User registration and login
- Session management
- Protected routes for authenticated users
- Admin-only sections

## Admin Access

To access the admin dashboard:
1. Create a new account
2. Use the provided admin setup script to grant admin privileges
3. Access the admin dashboard at `/admin/dashboard`

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/products` - Product management
- `/api/orders` - Order management
- `/api/checkout` - Stripe payment processing

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request with a clear description of your changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.
