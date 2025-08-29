import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    timestamp: string
  }>
  activeModal: string | null
  loading: {
    global: boolean
    operations: Record<string, boolean>
  }
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setActiveModal: (modalId: string | null) => void
  setGlobalLoading: (loading: boolean) => void
  setOperationLoading: (operation: string, loading: boolean) => void
  clearOperationLoading: (operation: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'system',
  notifications: [],
  activeModal: null,
  loading: {
    global: false,
    operations: {}
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      ]
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),
  clearNotifications: () => set({ notifications: [] }),
  setActiveModal: (modalId) => set({ activeModal: modalId }),
  setGlobalLoading: (loading) =>
    set((state) => ({
      loading: { ...state.loading, global: loading }
    })),
  setOperationLoading: (operation, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        operations: {
          ...state.loading.operations,
          [operation]: loading
        }
      }
    })),
  clearOperationLoading: (operation) =>
    set((state) => {
      const { [operation]: _, ...rest } = state.loading.operations
      return {
        loading: {
          ...state.loading,
          operations: rest
        }
      }
    })
}))