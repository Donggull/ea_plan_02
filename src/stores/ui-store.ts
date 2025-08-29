import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // 사이드바 상태
  sidebarOpen: boolean
  sidebarWidth: number
  sidebarCollapsed: boolean
  
  // 다크모드 상태
  darkMode: boolean
  
  // 알림 상태
  notifications: Notification[]
  unreadCount: number
  
  // 챗봇 패널 상태
  chatPanelOpen: boolean
  
  // 모바일 상태
  isMobile: boolean
  
  // Actions
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  collapseSidebar: () => void
  expandSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  toggleDarkMode: () => void
  setDarkMode: (dark: boolean) => void
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearNotifications: () => void
  
  toggleChatPanel: () => void
  setChatPanelOpen: (open: boolean) => void
  
  setIsMobile: (mobile: boolean) => void
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: Date
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      sidebarWidth: 280,
      sidebarCollapsed: false,
      darkMode: false,
      notifications: [],
      unreadCount: 0,
      chatPanelOpen: false,
      isMobile: false,

      // Sidebar actions
      toggleSidebar: () => 
        set(state => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarWidth: (width: number) => 
        set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),
      
      collapseSidebar: () => 
        set({ sidebarCollapsed: true, sidebarWidth: 64 }),
      
      expandSidebar: () => 
        set({ sidebarCollapsed: false, sidebarWidth: 280 }),
      
      setSidebarOpen: (open: boolean) => 
        set({ sidebarOpen: open }),

      // Dark mode actions
      toggleDarkMode: () => 
        set(state => ({ darkMode: !state.darkMode })),
      
      setDarkMode: (dark: boolean) => {
        set({ darkMode: dark })
        if (typeof document !== 'undefined') {
          if (dark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },

      // Notification actions
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newNotification: Notification = {
          ...notification,
          id,
          read: false,
          timestamp: new Date(),
        }
        
        set(state => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }))
      },

      removeNotification: (id: string) => 
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: state.notifications.find(n => n.id === id && !n.read) 
            ? state.unreadCount - 1 
            : state.unreadCount
        })),

      markAsRead: (id: string) => 
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: state.notifications.find(n => n.id === id && !n.read)
            ? state.unreadCount - 1
            : state.unreadCount
        })),

      clearNotifications: () => 
        set({ notifications: [], unreadCount: 0 }),

      // Chat panel actions
      toggleChatPanel: () => 
        set(state => ({ chatPanelOpen: !state.chatPanelOpen })),
      
      setChatPanelOpen: (open: boolean) => 
        set({ chatPanelOpen: open }),

      // Mobile actions
      setIsMobile: (mobile: boolean) => 
        set({ isMobile: mobile }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode,
        chatPanelOpen: state.chatPanelOpen,
      }),
    }
  )
)