import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useEarningsStore } from '../store';
import { 
  Home, 
  Briefcase, 
  DollarSign, 
  User, 
  Trophy, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { balance } = useEarningsStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/tasks', icon: Briefcase, label: 'Tasks' },
    { path: '/earnings', icon: DollarSign, label: 'Earnings' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                <span className="text-gray-800">tr</span>
                <span className="text-primary-600">AI</span>
                <span className="text-gray-800">n</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Info & Balance */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Balance</div>
                <div className="font-bold text-primary-600">
                  {formatCurrency(balance.availableBalance)}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Balance */}
              <div className="px-3 py-2 bg-primary-50 rounded-lg mb-2">
                <div className="text-sm text-gray-600">Available Balance</div>
                <div className="text-xl font-bold text-primary-600">
                  {formatCurrency(balance.availableBalance)}
                </div>
              </div>

              {/* Nav Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
