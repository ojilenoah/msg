"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { BookOpen, User, LogOut, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()

    // Check user status periodically to catch auth changes
    const interval = setInterval(checkUser, 5000)
    return () => clearInterval(interval)
  }, [])

  // Also check user when pathname changes
  useEffect(() => {
    checkUser()
  }, [pathname])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error checking user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getUserInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase()
  }

  const getUserDisplayName = (email: string) => {
    return email.split("@")[0]
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">MSGetsoplatform</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/courses"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Courses
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            )}
            {user?.is_admin && (
              <Link
                href="/admin"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <ModeToggle />

            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                  Welcome, {getUserDisplayName(user.email)}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {getUserInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem className="flex-col items-start">
                      <div className="font-medium">{getUserDisplayName(user.email)}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.is_admin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="w-full">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
