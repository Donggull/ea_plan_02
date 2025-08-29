'use client'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Get environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  
  if (typeof window !== 'undefined') {
    throw new Error('Supabase configuration is missing. Please check environment variables.')
  }
}

// Use actual values or throw error in client
const finalUrl = supabaseUrl || 'https://ojeebtnqwsgatzxwasbn.supabase.co'
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZWVidG5xd3NnYXR6eHdhc2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzM3MjYsImV4cCI6MjA3MjAwOTcyNn0.wqxckMW2bAjZ2mrWekdgemNmgh4FEKQtrn2vsep9Hhg'

console.log('Supabase client initializing with URL:', finalUrl)

export const supabase = createClient<Database>(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})