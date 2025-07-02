"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
      >
        <Sun className="h-4 w-4 text-gray-600" />
      </Button>
    )
  }

  const toggleTheme = () => {
    console.log("Current theme:", theme, "Resolved theme:", resolvedTheme)
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"
    console.log("Setting theme to:", newTheme)
    setTheme(newTheme)
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-700" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
