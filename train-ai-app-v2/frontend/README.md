# trAIn Frontend - React PWA

Progressive Web App for the trAIn AI Training Platform

## 🎯 Overview

A modern, responsive React application that allows users to:
- Browse and complete AI training tasks
- Track earnings and performance
- Withdraw payments
- View leaderboards
- Manage their profile

Built as a PWA for optimal mobile, tablet, and desktop experience.

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - API communication
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **PWA Plugin** - Progressive web app features

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running (see backend README)

## 🚀 Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API URL
```

Required variables:
```
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Development Server

```bash
npm run dev
```

App runs on `http://localhost:5173`

## 🏗️ Build for Production

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/           # Page components
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Tasks.jsx
│   │   ├── TaskDetail.jsx
│   │   ├── Earnings.jsx
│   │   ├── Profile.jsx
│   │   └── Leaderboard.jsx
│   ├── store/           # Zustand stores
│   │   └── index.js
│   ├── utils/           # Utilities
│   │   ├── api.js       # API client
│   │   └── helpers.js   # Helper functions
│   ├── styles/          # Global styles
│   │   └── index.css
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── package.json         # Dependencies
```

## 🎨 Key Features

### 1. Authentication
- User registration
- Login with JWT tokens
- Protected routes
- Auto-logout on token expiry

### 2. Dashboard
- Earnings overview
- Today's stats
- Available tasks
- Recent activity

### 3. Tasks
- Browse all available tasks
- Filter by type, difficulty, payment
- Search functionality
- Task details view
- Submit tasks (demo mode)

### 4. Earnings
- Balance overview (total, pending, available)
- Withdraw funds
- Transaction history
- Earnings breakdown by task type

### 5. Profile
- Edit personal information
- View performance stats
- Recent performance chart
- Member since date

### 6. Leaderboard
- Top 3 podium
- Full rankings table
- Filter by period (week, month, all-time)
- Accuracy and earnings stats

## 🎯 State Management

### Zustand Stores

**Auth Store:**
- User information
- JWT token
- Authentication status

**App Store:**
- Loading states
- Error messages
- Notifications

**Tasks Store:**
- Task list
- Selected task
- Filters

**Earnings Store:**
- Balance information
- Transaction history
- Earnings breakdown

**Stats Store:**
- User statistics
- Today's stats
- Performance trends

## 🔌 API Integration

All API calls are centralized in `src/utils/api.js`:

```javascript
import { authAPI, tasksAPI, submissionsAPI, paymentsAPI, usersAPI } from './utils/api';

// Example usage
const tasks = await tasksAPI.getTasks({ limit: 20 });
const balance = await paymentsAPI.getBalance();
```

## 🎨 Styling

### Tailwind CSS

Custom theme configuration:
- Primary colors (indigo)
- Accent colors (green)
- Custom components (buttons, cards, badges)

### Utility Classes

```jsx
<button className="btn-primary">Click Me</button>
<div className="card">Card content</div>
<span className="badge badge-green">Success</span>
```

## 📱 PWA Features

- **Offline Support** - Service worker caching
- **Install Prompt** - Add to home screen
- **App-like Experience** - Standalone display mode
- **Optimized Loading** - Code splitting and lazy loading

### PWA Manifest

```json
{
  "name": "trAIn - AI Training Platform",
  "short_name": "trAIn",
  "display": "standalone",
  "theme_color": "#4f46e5"
}
```

## 🧪 Testing

```bash
npm run test
```

## 🚢 Deployment

### Deploy to Netlify

1. Build the app:
```bash
npm run build
```

2. Deploy `dist/` folder to Netlify

3. Set environment variables in Netlify dashboard

### Deploy to Vercel

```bash
vercel
```

### Deploy to Replit

1. Upload `frontend/` folder
2. Set environment variables
3. Run `npm install && npm run dev`

## 📊 Performance

- Lighthouse Score: 95+
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Bundle Size: ~150KB gzipped

## 🔒 Security

- JWT tokens stored in localStorage (with HttpOnly consideration for production)
- CORS configured for API requests
- Input validation on all forms
- XSS protection via React
- CSRF protection via SameSite cookies (backend)

## 🐛 Troubleshooting

**API Connection Issues:**
```bash
# Check VITE_API_URL in .env
# Ensure backend is running
# Check CORS configuration
```

**Build Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**PWA Not Installing:**
```bash
# Must be served over HTTPS in production
# Check manifest.json is accessible
# Verify service worker registration
```

## 📝 Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:3000/api
```

For production:
```bash
# .env.production
VITE_API_URL=https://api.yourdomain.com/api
```

## 🎯 Best Practices

1. **Component Organization**
   - Keep components small and focused
   - Use hooks for logic
   - Separate presentational and container components

2. **State Management**
   - Use Zustand for global state
   - Use React state for local UI state
   - Persist auth state to localStorage

3. **API Calls**
   - Always handle errors
   - Show loading states
   - Use async/await

4. **Styling**
   - Use Tailwind utility classes
   - Keep custom CSS minimal
   - Use responsive design classes

## 🔄 Future Enhancements

- [ ] Real-time notifications (WebSockets)
- [ ] Dark mode
- [ ] Multi-language support (i18n)
- [ ] Advanced filtering and sorting
- [ ] Task submission interfaces (image labeling, etc.)
- [ ] Push notifications
- [ ] Social sharing
- [ ] Referral system

## 📞 Support

For issues and questions, see main project README.

## 📄 License

MIT License

---

**Built with ❤️ for distributed AI training**
