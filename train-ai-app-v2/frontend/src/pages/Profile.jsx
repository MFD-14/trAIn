import React, { useEffect, useState } from 'react';
import { useAuthStore, useStatsStore } from '../store';
import { usersAPI } from '../utils/api';
import { User, Mail, Award, TrendingUp, Edit2, Save, X } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/helpers';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const { userStats, setUserStats, performanceTrend, setPerformanceTrend } = useStatsStore();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const statsResponse = await usersAPI.getStats();
      setUserStats(statsResponse.data.overall);
      setPerformanceTrend(statsResponse.data.performanceTrend);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await usersAPI.updateProfile(formData);
      updateUser(formData);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and view your stats</p>
      </div>

      {/* Profile Info Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center">
              <User className="text-primary-600" size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="badge badge-blue text-xs">
                  {user?.role === 'user' ? 'Trainer' : 'Client'}
                </span>
              </div>
            </div>
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit2 size={16} />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center space-x-2"
              >
                <Save size={16} />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center space-x-2"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-gray-400" />
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
            {user?.phoneNumber && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-medium text-gray-900">{user.phoneNumber}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <Award className="mb-2" size={24} />
          <p className="text-green-100 text-sm mb-1">Accuracy Rating</p>
          <p className="text-3xl font-bold">{formatPercentage(userStats.accuracyRating)}</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <TrendingUp className="mb-2" size={24} />
          <p className="text-blue-100 text-sm mb-1">Tasks Completed</p>
          <p className="text-3xl font-bold">{userStats.tasksCompleted}</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <Award className="mb-2" size={24} />
          <p className="text-purple-100 text-sm mb-1">Total Earnings</p>
          <p className="text-3xl font-bold">{formatCurrency(userStats.totalEarnings)}</p>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Performance</h2>
        
        {performanceTrend.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No performance data yet. Complete some tasks to see your progress!
          </p>
        ) : (
          <div className="space-y-3">
            {performanceTrend.slice(0, 7).map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {day.tasksCompleted} tasks
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(day.earnings)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatPercentage(day.averageAccuracy)} accuracy
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Since */}
      <div className="card bg-gray-50">
        <p className="text-gray-600 text-center">
          Member since {new Date(userStats.memberSince).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
};

export default Profile;
