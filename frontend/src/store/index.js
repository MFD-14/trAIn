import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),
      
      updateUser: (userData) => set({ 
        user: { ...get().user, ...userData } 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// App Store (for UI state)
export const useAppStore = create((set) => ({
  isLoading: false,
  error: null,
  notification: null,
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  setNotification: (notification) => set({ notification }),
  
  clearNotification: () => set({ notification: null }),
}));

// Tasks Store
export const useTasksStore = create((set) => ({
  tasks: [],
  selectedTask: null,
  filters: {
    taskType: null,
    difficulty: null,
    minPayment: null,
  },
  
  setTasks: (tasks) => set({ tasks }),
  
  setSelectedTask: (task) => set({ selectedTask: task }),
  
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  
  clearFilters: () => set({ 
    filters: { taskType: null, difficulty: null, minPayment: null } 
  }),
}));

// Earnings Store
export const useEarningsStore = create((set) => ({
  balance: {
    totalEarnings: 0,
    pendingEarnings: 0,
    availableBalance: 0,
  },
  transactions: [],
  earningsBreakdown: null,
  
  setBalance: (balance) => set({ balance }),
  
  setTransactions: (transactions) => set({ transactions }),
  
  setEarningsBreakdown: (breakdown) => set({ earningsBreakdown: breakdown }),
}));

// Stats Store
export const useStatsStore = create((set) => ({
  userStats: {
    accuracyRating: 0,
    tasksCompleted: 0,
    totalEarnings: 0,
  },
  todayStats: {
    tasksCompleted: 0,
    earnings: 0,
    timeSpentSeconds: 0,
  },
  performanceTrend: [],
  
  setUserStats: (stats) => set({ userStats: stats }),
  
  setTodayStats: (stats) => set({ todayStats: stats }),
  
  setPerformanceTrend: (trend) => set({ performanceTrend: trend }),
}));
