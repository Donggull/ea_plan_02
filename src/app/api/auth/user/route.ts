import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

// Service role client for privileged operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Get the current user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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