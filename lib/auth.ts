import { createClient } from "@/lib/supabase"

export interface User {
  id: string
  email: string
  student_id: string
  first_name: string
  last_name: string
  full_name: string
  is_admin?: boolean
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Check if user is admin
    const isAdmin = user.email === "admin@gmail.com"

    return {
      id: user.id,
      email: user.email!,
      student_id: user.user_metadata?.student_id || "",
      first_name: user.user_metadata?.first_name || "",
      last_name: user.user_metadata?.last_name || "",
      full_name: user.user_metadata?.full_name || user.email!,
      is_admin: isAdmin,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function signOut() {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Use Next.js router for smooth navigation instead of window.location
    return true
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

export async function signInWithStudentId(studentId: string, password: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${studentId}@student.edu`,
      password: password,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error signing in with student ID:", error)
    throw error
  }
}
