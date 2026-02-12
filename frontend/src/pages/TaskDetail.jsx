import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tasksAPI, submissionsAPI } from '../utils/api';
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  Award,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';
import { 
  formatCurrency, 
  getTaskTypeIcon, 
  getTaskTypeDisplay,
  getDifficultyColor 
} from '../utils/helpers';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTaskById(id);
      setTask(response.data.task);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async () => {
    // In a real app, this would open a task-specific interface
    // For now, we'll simulate a submission
    if (!confirm('This is a demo. Start this task?')) return;

    setSubmitting(true);
    try {
      // Simulate task completion
      const mockResult = {
        taskId: task.id,
        resultData: {
          demo: true,
          completedAt: new Date().toISOString()
        },
        timeSpentSeconds: task.estimatedTimeMinutes * 60
      };

      await submissionsAPI.submitTask(mockResult);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Error submitting task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Task Not Found</h2>
        <p className="text-gray-600 mb-4">The task you're looking for doesn't exist.</p>
        <Link to="/tasks" className="btn-primary">
          Browse Tasks
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="card text-center py-12 max-w-2xl mx-auto">
        <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Task Submitted!</h2>
        <p className="text-gray-600 mb-6">
          Your work has been submitted for review. You'll be notified once it's approved.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            <strong>Pending Earnings:</strong> {formatCurrency(task.paymentPerTask)}
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link to="/tasks" className="btn-primary">
            Find More Tasks
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link to="/tasks" className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft size={20} className="mr-2" />
        Back to Tasks
      </Link>

      {/* Task Header */}
      <div className="card">
        <div className="flex items-start space-x-4 mb-6">
          <span className="text-5xl">{getTaskTypeIcon(task.taskType)}</span>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
                <p className="text-gray-600">{getTaskTypeDisplay(task.taskType)}</p>
              </div>
              <span className={`badge ${getDifficultyColor(task.difficulty)} text-base`}>
                {task.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(task.paymentPerTask)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Est. Time</p>
              <p className="text-xl font-bold text-gray-900">
                ~{task.estimatedTimeMinutes} min
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Award className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Required Accuracy</p>
              <p className="text-xl font-bold text-gray-900">
                {task.requiredAccuracy}%
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Task Progress</span>
            <span className="font-medium text-gray-900">
              {task.completedTasks} / {task.totalTasks} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${(task.completedTasks / task.totalTasks) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
        <p className="text-gray-700 leading-relaxed">{task.description}</p>
      </div>

      {/* Instructions */}
      {task.instructions && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {task.instructions}
            </p>
          </div>
        </div>
      )}

      {/* Your Stats */}
      {task.userStats && task.userStats.submissionCount > 0 && (
        <div className="card bg-primary-50 border-primary-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Performance</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Submissions</p>
              <p className="text-2xl font-bold text-primary-600">
                {task.userStats.submissionCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Accuracy</p>
              <p className="text-2xl font-bold text-primary-600">
                {task.userStats.averageAccuracy.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Client Info */}
      {task.clientName && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Posted By</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{task.clientName}</p>
              {task.clientRating && (
                <p className="text-sm text-gray-600">
                  Rating: ⭐ {task.clientRating.toFixed(1)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-semibold mb-2">Ready to start?</h3>
            <p className="text-primary-100">
              Complete this task and earn {formatCurrency(task.paymentPerTask)}
            </p>
          </div>
          <button
            onClick={handleStartTask}
            disabled={submitting || task.remainingTasks === 0}
            className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : task.remainingTasks === 0 ? 'No Tasks Available' : 'Start Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
