import { supabase, supabaseAdmin } from './supabase'
import { User } from '@/types'

export async function signUp(email: string, password: string, role: 'user' | 'admin' = 'user') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role
        }
      }
    })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null

    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'user',
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { role } }
    )

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        role: session.user.user_metadata?.role || 'user',
        created_at: session.user.created_at,
        updated_at: session.user.updated_at || session.user.created_at
      }
      callback(user)
    } else {
      callback(null)
    }
  })
}

