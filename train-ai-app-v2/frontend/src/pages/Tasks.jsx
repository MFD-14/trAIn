import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../utils/api';
import { useTasksStore } from '../store';
import { Filter, Search, ChevronRight } from 'lucide-react';
import { 
  formatCurrency, 
  getTaskTypeIcon, 
  getTaskTypeDisplay,
  getDifficultyColor 
} from '../utils/helpers';

const Tasks = () => {
  const { tasks, setTasks, filters, setFilters } = useTasksStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        limit: 50,
      };
      
      // Remove null values
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
          delete params[key];
        }
      });

      const response = await tasksAPI.getTasks(params);
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value === '' ? null : value });
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Tasks</h1>
        <p className="text-gray-600 mt-1">Browse and select tasks to start earning</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid md:grid-cols-3 gap-4">
            {/* Task Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <select
                value={filters.taskType || ''}
                onChange={(e) => handleFilterChange('taskType', e.target.value)}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="image_labeling">Image Labeling</option>
                <option value="text_classification">Text Classification</option>
                <option value="audio_transcription">Audio Transcription</option>
                <option value="data_validation">Data Validation</option>
                <option value="sentiment_analysis">Sentiment Analysis</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty || ''}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="input-field"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Min Payment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Payment
              </label>
              <select
                value={filters.minPayment || ''}
                onChange={(e) => handleFilterChange('minPayment', e.target.value)}
                className="input-field"
              >
                <option value="">Any Amount</option>
                <option value="0.10">$0.10+</option>
                <option value="0.25">$0.25+</option>
                <option value="0.50">$0.50+</option>
                <option value="1.00">$1.00+</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tasks Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Tasks Grid */}
          {filteredTasks.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 text-lg">No tasks found matching your criteria</p>
              <button
                onClick={() => {
                  setFilters({ taskType: null, difficulty: null, minPayment: null });
                  setSearchQuery('');
                }}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="card hover:shadow-lg transition-shadow group"
                >
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl">{getTaskTypeIcon(task.taskType)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {task.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {getTaskTypeDisplay(task.taskType)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {task.description}
                  </p>

                  {/* Task Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payment</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(task.paymentPerTask)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Estimated Time</span>
                      <span className="font-medium text-gray-900">
                        ~{task.estimatedTimeMinutes} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Available</span>
                      <span className="font-medium text-gray-900">
                        {task.remainingTasks} tasks
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center justify-between">
                    <span className={`badge ${getDifficultyColor(task.difficulty)}`}>
                      {task.difficulty}
                    </span>
                    <ChevronRight className="text-gray-400 group-hover:text-primary-600 transition-colors" size={20} />
                  </div>

                  {/* Client Info */}
                  {task.clientName && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Posted by <span className="font-medium">{task.clientName}</span>
                      </p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Tasks;
