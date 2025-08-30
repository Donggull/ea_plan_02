import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client')
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting user profile fetch...')
    
    let user = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('API: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        console.error('API: Token validation failed:', tokenError)
        return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
      }
      
      user = tokenUser
    } else {
      // 쿠키 기반 세션 확인
      console.log('API: Using cookie-based authentication')
      
      try {
        const supabase = createRouteHandlerClient({ 
          cookies 
        })
        
        // Get the current user from the session
        console.log('API: Getting user from session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('API: Session error:', sessionError)
          return NextResponse.json(
            { error: 'Session error', details: sessionError.message },
            { status: 401 }
          )
        }
        
        if (!session?.user) {
          console.log('API: No session user found')
          return NextResponse.json(
            { error: 'No authenticated session' },
            { status: 401 }
          )
        }
        
        user = session.user
      } catch (cookieError) {
        console.error('API: Cookie access failed:', cookieError)
        return NextResponse.json({ error: '쿠키 인증 오류' }, { status: 401 })
      }
    }
    
    if (!user) {
      console.log('API: No user found')
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      )
    }

    console.log('API: Looking up user profile for:', user.id, user.email)

    // Use service role to fetch user profile (bypasses RLS)
    let { data: userData, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', user.email!)
      .single()

    // If not found by email, try by ID
    if (profileError?.code === 'PGRST116' || !userData) {
      console.log('API: User not found by email, trying by ID...')
      const result = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      userData = result.data
      profileError = result.error
    }

    // If still not found, create the profile
    if (profileError?.code === 'PGRST116' || !userData) {
      console.log('API: Creating new user profile...')
      
      const displayName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.email?.split('@')[0] || 
                         'User'
      
      const { data: newUserData, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          name: displayName,
          user_role: 'user',
          subscription_tier: 'free'
        })
        .select()
        .single()

      if (createError) {
        console.error('API: Failed to create user profile:', createError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      userData = newUserData
    }

    // Get organization data if available
    let organizationData = null
    if (userData.organization_id) {
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single()

      if (!orgError && orgData) {
        organizationData = orgData
      }
    }

    return NextResponse.json({
      user: userData,
      organization: organizationData
    })

  } catch (error) {
    console.error('API: Error in user route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}