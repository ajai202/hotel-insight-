# Hotel Income & Expense Prediction System

A professional, modern financial management dashboard for hotels, featuring AI-powered prediction and comprehensive reporting.

## Features
- **Admin Dashboard**: Real-time financial metrics and interactive trends.
- **Income & Expense Tracking**: Full CRUD management with search and filtering.
- **AI Prediction**: Linear Regression forecasting for next-month's financial performance.
- **Monthly Reports**: Generate and export professional PDF statements.
- **Secure Authentication**: Admin-only access via Google Login.
- **Modern UI**: Professional typography, dark/light mode friendly, and smooth animations.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Recharts, Framer Motion
- **Backend**: Node.js, Express
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Analytics/ML**: simple-statistics (Linear Regression)

## Installation & Setup
1. **Secrets**: Ensure `GEMINI_API_KEY` is set in your environment (required for advanced features, though basic prediction uses JS regression).
2. **Firebase**: The app is already configured with a Firestore instance.
3. **Admin Setup**: The system is bootstrapped to recognize `ajai25032003@gmail.com` as an administrator.

## Sample Data
To populate the system for testing:
1. Sign in as an administrator.
2. Go to the "Income" and "Expenses" tabs.
3. Add a few records spread across the last 3-4 months.
4. Navigate to "AI Prediction" to see the trend line and generated forecast.

## Development
- `npm run dev`: Starts the Express + Vite development server on port 3000.
- `npm run build`: Builds the production-ready assets.
