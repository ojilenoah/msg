"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import {
  BarChart3,
  BookOpen,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut,
  User,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"

interface AdminSidebarProps {
  className?: string
  user: any
}

const sidebarItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: BarChart3,
  },
  {
    title: "Courses",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: Users,
  },
  {
    title: "Editor",
    href: "/admin/editor",
    icon: FileText,
  },
  {
    title: "Markdown Reference",
    href: "/admin/reference",
    icon: HelpCircle,
  },
]

export function AdminSidebar({ className, user }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isExpanded = !isCollapsed || isHovered

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const getUserInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase()
  }

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        isExpanded ? "w-64" : "w-16",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {isExpanded && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">MSGetso</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 p-0">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && <span>{item.title}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section with User Controls */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-center">
          {isExpanded ? (
            <div className="flex items-center justify-between w-full px-3 py-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Theme</span>
              <ModeToggle />
            </div>
          ) : (
            <ModeToggle />
          )}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn("w-full justify-start space-x-3 px-3 py-2 h-auto", !isExpanded && "justify-center px-2")}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {getUserInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              {isExpanded && (
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{user.email.split("@")[0]}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Administrator</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
