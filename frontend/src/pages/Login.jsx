import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { authAPI } from '../utils/api';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setLoading, setError, error } = useAppStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { token, user } = response.data;
      
      setAuth(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <Link to="/" className="flex justify-center mb-8">
          <div className="text-4xl font-bold">
            <span className="text-gray-800">tr</span>
            <span className="text-primary-600">AI</span>
            <span className="text-gray-800">n</span>
          </div>
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-6">Sign in to continue earning</p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full btn-primary py-3 text-lg"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">Test Credentials:</p>
          <p className="text-sm text-blue-700">
            Email: john.doe@example.com<br />
            Password: password123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
