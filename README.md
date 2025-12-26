# MagnaAI AI Clone

A modern, responsive clone of the MagnaAI AI interface built with Vite, React, Tailwind CSS, and Firebase Authentication.

## Features

- 🎨 **Beautiful UI**: Modern, clean interface matching MagnaAI AI's design
- 🔐 **Firebase Authentication**: Email/password and Google sign-in
- 📱 **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile
- 🚀 **Fast**: Built with Vite for lightning-fast development and builds
- 🎯 **Protected Routes**: Secure dashboard access with authentication

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase** - Authentication and backend services
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd grok-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Authentication:
     - Go to Authentication > Sign-in method
     - Enable Email/Password
     - Enable Google sign-in
   - Get your Firebase config:
     - Go to Project Settings > General
     - Scroll down to "Your apps" section
     - Copy the Firebase configuration object

4. Configure Firebase:
   - Open `src/firebase/config.js`
   - Replace the placeholder values with your actual Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

5. Run the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
grok-ai/
├── src/
│   ├── components/          # Reusable components
│   │   └── ProtectedRoute.jsx
│   ├── context/             # React context providers
│   │   └── AuthContext.jsx
│   ├── firebase/            # Firebase configuration
│   │   └── config.js
│   ├── pages/               # Page components
│   │   ├── Landing.jsx      # Landing page
│   │   ├── SignUp.jsx       # Sign up page
│   │   ├── SignUpEmail.jsx  # Email sign up form
│   │   ├── Login.jsx        # Login page
│   │   └── Dashboard.jsx    # Main dashboard
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── vite.config.js          # Vite configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Landing Page
- Clean, minimalist design
- Prominent search bar
- "MagnaAI Imagine Upgrades" promotional banner
- Sign in/Sign up navigation

### Authentication
- Multiple sign-in options:
  - Email/Password
  - Google OAuth
  - X (Twitter) - UI ready (requires additional setup)
  - Apple - UI ready (requires additional setup)
- Form validation
- Error handling
- Protected routes

### Dashboard
- Sidebar navigation with:
  - Chat, Voice, Imagine, Projects, History
  - Search functionality
  - History by month
- Main content area with:
  - MagnaAI logo and search interface
  - Upgrade prompts
  - User profile section
- Fully responsive mobile menu

## Customization

### Styling
The app uses Tailwind CSS. You can customize colors, spacing, and other design tokens in `tailwind.config.js`.

### Firebase
All Firebase configuration is in `src/firebase/config.js`. Make sure to keep your Firebase credentials secure and never commit them to version control if they contain sensitive information.

## Deployment

### Build for Production
```bash
npm run build
```

The `dist` folder will contain your production-ready files.

### Deploy to Vercel/Netlify
1. Push your code to GitHub
2. Import the project to Vercel or Netlify
3. Add your Firebase environment variables
4. Deploy!

## Security Notes

- Never commit your Firebase config with real credentials to public repositories
- Use environment variables for sensitive configuration in production
- Ensure Firebase Authentication rules are properly configured
- Keep your Firebase API keys secure

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
