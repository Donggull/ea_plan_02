import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase'

type User = Database['public']['Tables']['users']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Fetch additional user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return null
    }

    return userData
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export async function getOrganization(): Promise<Organization | null> {
  const user = await getUser()
  if (!user?.organization_id) return null

  const supabase = await createClient()
  
  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organization_id)
      .single()

    if (error || !organization) {
      return null
    }

    return organization
  } catch (error) {
    console.error('Error fetching organization:', error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return user
}

export async function requireOrganization(): Promise<{ user: User; organization: Organization }> {
  const user = await requireAuth()
  
  if (!user.organization_id) {
    redirect('/auth/setup-organization')
  }

  const organization = await getOrganization()
  
  if (!organization) {
    redirect('/auth/setup-organization')
  }

  return { user, organization }
}

export async function requireRole(requiredRoles: Array<string>): Promise<User> {
  const user = await requireAuth()
  
  if (!user.role || !requiredRoles.includes(user.role)) {
    redirect('/dashboard')
  }
  
  return user
}

export async function requireSubscription(requiredTiers: Array<string>): Promise<{ user: User; organization: Organization }> {
  const { user, organization } = await requireOrganization()
  
  if (!organization.subscription_tier || !requiredTiers.includes(organization.subscription_tier)) {
    redirect('/dashboard/billing')
  }

  return { user, organization }
}

export async function checkPermission(
  resource: string, 
  action: string, 
  user?: User
): Promise<boolean> {
  if (!user) {
    const fetchedUser = await getUser()
    if (!fetchedUser) return false
    user = fetchedUser
  }
  
  if (!user) return false

  // 기본 권한 체크 로직
  const rolePermissions = {
    owner: ['*'],
    admin: ['read', 'write', 'delete', 'invite', 'manage'],
    member: ['read', 'write'],
    viewer: ['read']
  }

  const userRole = user.role as keyof typeof rolePermissions
  const permissions = rolePermissions[userRole] || []

  return permissions.includes('*') || permissions.includes(action)
}

export function getSubscriptionLimits(tier: string) {
  const limits = {
    free: {
      projects: 3,
      members: 5,
      storage: 1024 * 1024 * 100, // 100MB
      ai_requests: 100,
    },
    starter: {
      projects: 10,
      members: 15,
      storage: 1024 * 1024 * 1024, // 1GB
      ai_requests: 1000,
    },
    pro: {
      projects: 50,
      members: 50,
      storage: 1024 * 1024 * 1024 * 10, // 10GB
      ai_requests: 10000,
    },
    enterprise: {
      projects: -1, // unlimited
      members: -1, // unlimited
      storage: -1, // unlimited
      ai_requests: -1, // unlimited
    },
  }

  return limits[tier as keyof typeof limits] || limits.free
}