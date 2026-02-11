// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format time duration
export const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// Format relative time
export const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return then.toLocaleDateString();
};

// Get difficulty badge color
export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: 'badge-green',
    medium: 'badge-yellow',
    hard: 'badge-red',
  };
  return colors[difficulty] || 'badge-blue';
};

// Get task type display name
export const getTaskTypeDisplay = (taskType) => {
  const names = {
    image_labeling: 'Image Labeling',
    text_classification: 'Text Classification',
    audio_transcription: 'Audio Transcription',
    data_validation: 'Data Validation',
    sentiment_analysis: 'Sentiment Analysis',
    entity_recognition: 'Entity Recognition',
    question_answering: 'Question Answering',
  };
  return names[taskType] || taskType;
};

// Get task type icon
export const getTaskTypeIcon = (taskType) => {
  const icons = {
    image_labeling: '🖼️',
    text_classification: '📝',
    audio_transcription: '🎧',
    data_validation: '✅',
    sentiment_analysis: '😊',
    entity_recognition: '🏷️',
    question_answering: '❓',
  };
  return icons[taskType] || '📋';
};

// Calculate accuracy color
export const getAccuracyColor = (accuracy) => {
  if (accuracy >= 95) return 'text-green-600';
  if (accuracy >= 90) return 'text-yellow-600';
  if (accuracy >= 80) return 'text-orange-600';
  return 'text-red-600';
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Calculate estimated earnings
export const calculateEstimatedEarnings = (paymentPerTask, tasksToComplete) => {
  return paymentPerTask * tasksToComplete;
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    pending_review: 'badge-yellow',
    approved: 'badge-green',
    rejected: 'badge-red',
    flagged: 'badge-red',
    active: 'badge-green',
    paused: 'badge-yellow',
    completed: 'badge-blue',
    cancelled: 'badge-red',
  };
  return colors[status] || 'badge-blue';
};

// Format percentage
export const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Storage helpers
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};
