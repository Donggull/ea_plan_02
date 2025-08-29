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

      // Use server-side API to bypass RLS issues
      console.log('Fetching user profile via API...')
      
      try {
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const apiResult = await response.json()
        console.log('API response:', apiResult)

        const userData = apiResult.user
        const organizationData = apiResult.organization

        console.log('Login successful via API, setting user and organization data')
        
        set({ 
          user: userData, 
          organization: organizationData, 
          isLoading: false 
        })
        
        return // Early return since we got the data successfully
        
      } catch (apiError) {
        console.error('API approach failed, falling back to direct database:', apiError)
      }

      // Fallback to original approach if API fails
      console.log('Falling back to direct database approach...')
      
      // 잠시 대기 후 사용자 정보 가져오기 (RLS 정책 적용 시간 확보)
      await new Promise(resolve => setTimeout(resolve, 100))

      // 이메일을 기준으로 올바른 사용자 찾기 (ID 불일치 문제 해결)
      let { data: initialUserData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email!)
        .single()
      
      // 이메일로도 찾을 수 없으면 ID로 시도
      if (userError?.code === 'PGRST116' || !initialUserData) {
        console.log('User not found by email, trying by ID...')
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        initialUserData = result.data
        userError = result.error
      }
      
      console.log('User profile query result:', { initialUserData, userError })
      
      let userData = initialUserData

      // 사용자 프로필이 없으면 생성 (기존 사용자 대응)
      if (userError?.code === 'PGRST116' || !userData) {
        console.log('User profile not found, trying to create one...')
        
        // 프로필 생성
        const displayName = data.user.user_metadata?.full_name || 
                          data.user.user_metadata?.name || 
                          data.user.email?.split('@')[0] || 
                          'User'
        
        const { data: newUserData, error: createError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: displayName,
            user_role: 'user',
            subscription_tier: 'free'
          })
          .select()
          .single()

        if (createError) {
          console.error('Failed to create user profile:', createError)
          
          // 중복 키 오류인 경우 기존 프로필을 다시 조회 시도
          if (createError.code === '23505') {
            console.log('User already exists, trying to fetch existing profile...')
            
            // 여러 번 시도하여 RLS 정책 적용 시간 확보
            let existingUserData = null
            let existingUserError = null
            
            for (let attempt = 1; attempt <= 3; attempt++) {
              console.log(`Profile fetch attempt ${attempt}/3`)
              await new Promise(resolve => setTimeout(resolve, attempt * 200))
              
              const result = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single()
              
              existingUserData = result.data
              existingUserError = result.error
              
              if (!existingUserError && existingUserData) {
                break
              }
            }
            
            if (existingUserError || !existingUserData) {
              console.error('Failed to fetch existing user profile after multiple attempts:', existingUserError)
              
              // 마지막으로 이메일을 기준으로 실제 사용자 데이터 확인
              console.log('Attempting to find user by email as final fallback...')
              const { data: emailUserData, error: emailUserError } = await supabase
                .from('users')
                .select('*')
                .eq('email', data.user.email!)
                .single()
              
              if (!emailUserError && emailUserData) {
                console.log('Found existing user by email:', emailUserData.id)
                userData = emailUserData
              } else {
                // 완전히 실패한 경우, 기본값으로 처리하되 실제 존재하는 사용자 ID 사용
                console.log('Using fallback approach - login successful but profile data unavailable')
                userData = {
                  id: data.user.id,
                  email: data.user.email!,
                  name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                  user_role: 'user',
                  subscription_tier: 'free',
                  organization_id: null,
                  role: null,
                  avatar_url: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              }
            } else {
              userData = existingUserData
            }
          } else {
            throw new Error('사용자 프로필 생성에 실패했습니다.')
          }
        } else {
          userData = newUserData
        }
      }

      // 조직 정보 가져오기 (없으면 생성)
      console.log('Checking user organization ID:', userData.organization_id)
      let organizationData: Organization | null = null
      if (!userData.organization_id) {
        // 조직이 없으면 생성
        console.log('No organization found, creating organization for user...')
        const orgSlug = `${userData.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${data.user.id.slice(0, 8)}-${Date.now()}`
        
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: `${userData.name}의 조직`,
            slug: orgSlug,
            description: '개인 워크스페이스',
            created_by: data.user.id,
            is_active: true,
            subscription_tier: 'free'
          })
          .select()
          .single()

        if (!orgError && orgData) {
          organizationData = orgData
          
          // 사용자 프로필에 조직 연결
          await supabase
            .from('users')
            .update({ 
              organization_id: orgData.id,
              role: 'owner'
            })
            .eq('id', data.user.id)
        }
      } else {
        // 기존 조직 가져오기
        console.log('Fetching existing organization:', userData.organization_id)
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .single()

        console.log('Organization query result:', { orgData, orgError })
        
        if (orgError) {
          console.error('Failed to fetch organization:', orgError)
          console.log('Continuing login without organization data')
          organizationData = null
        } else if (!orgData) {
          console.error('No organization data returned')
          console.log('Continuing login without organization data')
          organizationData = null
        } else {
          organizationData = orgData
        }
      }

      console.log('Login successful, setting user and organization data')
      
      set({ 
        user: userData, 
        organization: organizationData, 
        isLoading: false 
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