import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { CreateOrgData } from '@/lib/validations/auth'

type User = Database['public']['Tables']['users']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

interface AuthState {
  user: User | null
  organization: Organization | null
  isLoading: boolean
  isInitialized: boolean
  
  // 액션들
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, orgData: CreateOrgData) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  refreshOrganization: () => Promise<void>
  
  // 내부 상태 업데이트
  setUser: (user: User | null) => void
  setOrganization: (organization: Organization | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  organization: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    // 이미 초기화 중이거나 초기화됐으면 스킵
    const state = get()
    if (state.isLoading || state.isInitialized) {
      console.log('Already initializing or initialized, skipping...')
      return
    }
    
    set({ isLoading: true })
    console.log('Initializing auth state...')
    
    try {
      // 현재 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        set({ user: null, organization: null, isLoading: false, isInitialized: true })
        return
      }

      if (!session?.user) {
        console.log('No session found')
        set({ user: null, organization: null, isLoading: false, isInitialized: true })
        return
      }

      console.log('Session found, fetching user data for:', session.user.email)

      // API를 통해 사용자 정보 가져오기 (RLS 우회)
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        
        // 세션에서 액세스 토큰이 있으면 Authorization 헤더에 추가
        if (session.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const response = await fetch('/api/auth/user', {
          method: 'GET',
          headers,
          credentials: 'include',
        })

        if (response.ok) {
          const { user: userData, organization: organizationData } = await response.json()
          console.log('User data fetched successfully:', userData?.name || userData?.email)
          
          set({ 
            user: userData, 
            organization: organizationData, 
            isLoading: false, 
            isInitialized: true 
          })
          return
        }
      } catch (apiError) {
        console.error('API error:', apiError)
      }

      // API 실패 시 fallback 사용자 프로필 생성
      console.error('API failed, creating fallback user profile')
      const fallbackUser: User = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        user_role: 'user',
        subscription_tier: 'free',
        organization_id: null,
        role: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      set({ 
        user: fallbackUser, 
        organization: null, 
        isLoading: false, 
        isInitialized: true 
      })
      return
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, organization: null, isLoading: false, isInitialized: true })
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true })
    
    try {
      console.log('Starting signIn process for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Auth signIn error:', error)
        throw error
      }

      if (!data.user) {
        throw new Error('로그인에 실패했습니다.')
      }

      console.log('Auth successful, user ID from auth:', data.user.id)
      console.log('Auth successful, user email:', data.user.email)

      // Wait for session to be properly established
      await new Promise(resolve => setTimeout(resolve, 500))

      // Use server-side API to get user profile (handles RLS properly)
      console.log('Fetching user profile via API...')
      
      try {
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 중요: 쿠키 포함
        })

        if (response.ok) {
          const apiResult = await response.json()
          console.log('API response:', apiResult)

          const userData = apiResult.user
          const organizationData = apiResult.organization

          console.log('Login successful via API, setting user and organization data')
          console.log('API User data being set:', userData)
          console.log('API Organization data being set:', organizationData)
          
          set({ 
            user: userData, 
            organization: organizationData, 
            isLoading: false,
            isInitialized: true
          })
          
          return
        } else {
          const errorData = await response.json()
          console.error('API error response:', errorData)
        }
      } catch (apiError) {
        console.error('API fetch error:', apiError)
      }

      // API가 실패했으므로 fallback 사용자 프로필 생성
      console.log('API failed, creating fallback user profile...')
      
      const displayName = data.user.user_metadata?.full_name || 
                         data.user.user_metadata?.name || 
                         data.user.email?.split('@')[0] || 
                         'User'
      
      const userData = {
        id: data.user.id,
        email: data.user.email!,
        name: displayName,
        user_role: 'user',
        subscription_tier: 'free',
        organization_id: null,
        role: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Login successful with fallback profile, setting user data')
      console.log('Fallback User data being set:', userData)
      
      set({ 
        user: userData, 
        organization: null, 
        isLoading: false,
        isInitialized: true
      })
    } catch (error) {
      console.error('SignIn error:', error)
      set({ isLoading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string, orgData: CreateOrgData) => {
    set({ isLoading: true })
    
    try {
      // 사용자 회원가입 - 데이터베이스 트리거가 자동으로 조직과 프로필을 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: orgData.user.name,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('회원가입에 실패했습니다.')

      console.log('Signup successful, user will be created by database trigger')
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    
    try {
      console.log('Starting signOut process...')
      
      // 1. Supabase 세션 완전히 제거
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error

      // 2. 로컬 상태 초기화
      set({ 
        user: null, 
        organization: null, 
        isLoading: false,
        isInitialized: false
      })
      
      // 3. 브라우저 세션 저장소 클리어
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // Supabase 관련 쿠키들도 확실히 제거
        const cookies = document.cookie.split(';')
        cookies.forEach(cookie => {
          const [name] = cookie.split('=')
          if (name.trim().includes('supabase') || name.trim().includes('sb-')) {
            document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
          }
        })
      }
      
      console.log('SignOut completed successfully')
    } catch (error) {
      console.error('SignOut error:', error)
      set({ isLoading: false })
      throw error
    }
  },


  resetPassword: async (email: string) => {
    set({ isLoading: true })
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  updatePassword: async (password: string) => {
    set({ isLoading: true })
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  updateProfile: async (data: Partial<User>) => {
    set({ isLoading: true })
    const { user } = get()
    
    if (!user) {
      set({ isLoading: false })
      throw new Error('로그인이 필요합니다.')
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id)
        .select()
        .single()

      if (error || !userData) {
        throw new Error('프로필 업데이트에 실패했습니다.')
      }

      set({ user: userData, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  refreshUser: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && userData) {
        set({ user: userData })
      }
    } catch (error) {
      console.error('User refresh error:', error)
    }
  },

  refreshOrganization: async () => {
    const { user } = get()
    if (!user?.organization_id) return

    try {
      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user.organization_id)
        .single()

      if (!error && orgData) {
        set({ organization: orgData })
      }
    } catch (error) {
      console.error('Organization refresh error:', error)
    }
  },

  // 내부 상태 업데이트 메서드들
  setUser: (user: User | null) => set({ user }),
  setOrganization: (organization: Organization | null) => set({ organization }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}))

// Auth 상태 변경을 감지하는 리스너 설정 (최소한의 이벤트만 처리)
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event, session ? 'session exists' : 'no session')
  
  // 로그아웃 처리만 수행
  if (event === 'SIGNED_OUT' || !session) {
    console.log('User signed out, clearing auth state')
    useAuthStore.setState({ 
      user: null, 
      organization: null, 
      isLoading: false,
      isInitialized: true
    })
    return
  }
  
  // 최초 로그인 시에만 초기화 수행
  if (event === 'SIGNED_IN') {
    console.log('User signed in, initializing auth state')
    
    // 상태 리셋 후 재초기화
    useAuthStore.setState({ 
      isInitialized: false,
      isLoading: false
    })
    
    // 약간의 딜레이 후 초기화 (상태 안정화)
    setTimeout(async () => {
      const { initialize } = useAuthStore.getState()
      await initialize()
    }, 100)
    return
  }
  
  // 다른 모든 이벤트들은 무시 (INITIAL_SESSION, TOKEN_REFRESHED 등)
  console.log(`Ignoring auth event: ${event} to prevent unnecessary data refetch`)
})