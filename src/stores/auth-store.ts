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
    set({ isLoading: true })
    
    try {
      // 현재 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        set({ user: null, organization: null, isLoading: false, isInitialized: true })
        return
      }

      if (!session?.user) {
        set({ user: null, organization: null, isLoading: false, isInitialized: true })
        return
      }

      // 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError || !userData) {
        console.error('User fetch error:', userError)
        set({ user: null, organization: null, isLoading: false, isInitialized: true })
        return
      }

      // 조직 정보 가져오기
      let organizationData: Organization | null = null
      if (userData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .single()

        if (!orgError && orgData) {
          organizationData = orgData
        }
      }

      set({ 
        user: userData, 
        organization: organizationData, 
        isLoading: false, 
        isInitialized: true 
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, organization: null, isLoading: false, isInitialized: true })
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('로그인에 실패했습니다.')
      }

      // 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError || !userData) {
        throw new Error('사용자 정보를 가져올 수 없습니다.')
      }

      // 조직 정보 가져오기
      let organizationData: Organization | null = null
      if (userData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .single()

        if (!orgError && orgData) {
          organizationData = orgData
        }
      }

      set({ 
        user: userData, 
        organization: organizationData, 
        isLoading: false 
      })
    } catch (error) {
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

      // 트리거가 생성한 데이터를 잠시 후 가져오기 (트리거 실행 시간 고려)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 생성된 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError || !userData) {
        console.error('User data fetch error:', userError)
        // 에러가 있어도 회원가입은 성공했으므로 진행
        set({ isLoading: false })
        return
      }

      // 생성된 조직 정보 가져오기
      let organizationData: Organization | null = null
      if (userData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .single()

        if (!orgError && orgData) {
          organizationData = orgData
        }
      }

      set({ 
        user: userData, 
        organization: organizationData, 
        isLoading: false 
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      set({ 
        user: null, 
        organization: null, 
        isLoading: false 
      })
    } catch (error) {
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

// Auth 상태 변경을 감지하는 리스너 설정
supabase.auth.onAuthStateChange(async (event, session) => {
  const { initialize } = useAuthStore.getState()
  
  if (event === 'SIGNED_OUT' || !session) {
    useAuthStore.setState({ 
      user: null, 
      organization: null, 
      isLoading: false 
    })
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    await initialize()
  }
})