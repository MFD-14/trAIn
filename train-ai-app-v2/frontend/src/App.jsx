import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';

// Pages
import Landing       from './pages/Landing';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Dashboard     from './pages/Dashboard';
import Tasks         from './pages/Tasks';
import TaskDetail    from './pages/TaskDetail';
import Earnings      from './pages/Earnings';
import Profile       from './pages/Profile';
import Leaderboard   from './pages/Leaderboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Components
import Layout         from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const { isAuthenticated } = useAuthStore();
  return (
    <Router>
      <Routes>
        <Route path="/"         element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login"    element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

        {/* Admin - standalone layout */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Protected user routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/tasks"        element={<Tasks />} />
          <Route path="/tasks/:id"    element={<TaskDetail />} />
          <Route path="/earnings"     element={<Earnings />} />
          <Route path="/profile"      element={<Profile />} />
          <Route path="/leaderboard"  element={<Leaderboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
