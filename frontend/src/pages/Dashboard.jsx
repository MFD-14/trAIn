import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useStatsStore, useEarningsStore } from '../store';
import { submissionsAPI, paymentsAPI, tasksAPI } from '../utils/api';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  DollarSign,
  Briefcase,
  ArrowRight 
} from 'lucide-react';
import { formatCurrency, formatDuration, getTaskTypeIcon, getTaskTypeDisplay } from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { todayStats, setTodayStats } = useStatsStore();
  const { balance, setBalance } = useEarningsStore();
  const [recentActivity, setRecentActivity] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch today's stats
      const statsResponse = await submissionsAPI.getSubmissionStats();
      setTodayStats(statsResponse.data.today);

      // Fetch balance
      const balanceResponse = await paymentsAPI.getBalance();
      setBalance(balanceResponse.data.balance);

      // Fetch recent activity
      const activityResponse = await submissionsAPI.getSubmissions({ limit: 5 });
      setRecentActivity(activityResponse.data.submissions);

      // Fetch available tasks
      const tasksResponse = await tasksAPI.getTasks({ limit: 3 });
      setAvailableTasks(tasksResponse.data.tasks);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Here's your earnings overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Earnings */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm">Total Earnings</div>
            <DollarSign className="text-green-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(balance.totalEarnings)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Available: {formatCurrency(balance.availableBalance)}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm">Tasks Today</div>
            <CheckCircle className="text-primary-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {todayStats.tasksCompleted}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(todayStats.earnings)} earned
          </div>
        </div>

        {/* Accuracy Rating */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm">Accuracy Rating</div>
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {user?.accuracyRating?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {user?.tasksCompleted || 0} tasks completed
          </div>
        </div>

        {/* Time Today */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm">Time Today</div>
            <Clock className="text-orange-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatDuration(todayStats.timeSpentSeconds)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Active training time
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Available Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Available Tasks</h2>
            <Link to="/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          {availableTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="mx-auto mb-2 opacity-50" size={48} />
              <p>No tasks available right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xl">{getTaskTypeIcon(task.taskType)}</span>
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {getTaskTypeDisplay(task.taskType)}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatCurrency(task.paymentPerTask)}/task</span>
                        <span>•</span>
                        <span>~{task.estimatedTimeMinutes} min</span>
                        <span>•</span>
                        <span>{task.remainingTasks} available</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/earnings" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto mb-2 opacity-50" size={48} />
              <p>No recent activity</p>
              <Link to="/tasks" className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block">
                Start your first task
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {activity.taskTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      +{formatCurrency(activity.paymentAmount)}
                    </div>
                    <div className={`text-xs badge ${
                      activity.status === 'approved' ? 'badge-green' : 'badge-yellow'
                    }`}>
                      {activity.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ready to earn more?</h3>
            <p className="text-primary-100">Browse available tasks and start training AI</p>
          </div>
          <Link
            to="/tasks"
            className="mt-4 md:mt-0 bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse Tasks
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
