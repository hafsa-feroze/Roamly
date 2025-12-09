# Roamly Frontend

A modern React application built with Vite for the Roamly platform.

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Features

- **Intro Page**: Welcome page with black and green gradient background
- **Login Page**: User authentication interface
- **Signup Page**: User registration with support for Customer and Company accounts
- **Dashboard Page**: Demo dashboard shown after successful signup

## API Configuration

The frontend is configured to communicate with the backend API at `http://localhost:8000`. Make sure your backend server is running before testing the signup functionality.

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── IntroPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   └── DashboardPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```



