"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface AuthModalProps {
  open: boolean
  mode: "login" | "register"
  onClose: () => void
  onSwitchMode: (mode: "login" | "register") => void
  onAuthSuccess?: () => void
}

export function AuthModal({ open, mode, onClose, onSwitchMode, onAuthSuccess }: AuthModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    studentId: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      return false
    }

    if (mode === "register") {
      if (!formData.firstName || !formData.lastName) {
        setError("First name and last name are required")
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return false
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long")
        return false
      }

      if (!formData.studentId) {
        setError("Student ID is required")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const supabase = createClient()

      if (mode === "login") {
        // Check if admin login
        const isAdminLogin = formData.email === "admin@gmail.com" && formData.password === "adminpassword"

        if (isAdminLogin) {
          // Try to sign in first
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password,
            })

            if (error && error.message.includes("Invalid login credentials")) {
              // Admin user doesn't exist, create it
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                  data: {
                    first_name: "Admin",
                    last_name: "User",
                    full_name: "Admin User",
                    is_admin: true,
                  },
                },
              })

              if (signUpError) throw signUpError

              // If signup successful, try to sign in again
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
              })

              if (signInError) throw signInError
            } else if (error) {
              throw error
            }

            setSuccess("Admin login successful!")

            setTimeout(() => {
              onClose()
              if (onAuthSuccess) {
                onAuthSuccess()
              }
              router.push("/admin")
            }, 1000)
          } catch (adminError) {
            console.error("Admin login error:", adminError)
            setError("Failed to login as admin. Please try again.")
            return
          }
        } else {
          // Regular user login
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          })

          if (error) throw error

          setSuccess("Successfully signed in!")

          setTimeout(() => {
            onClose()
            if (onAuthSuccess) {
              onAuthSuccess()
            }
            router.push("/dashboard")
          }, 1000)
        }
      } else {
        // Check if trying to register as admin
        if (formData.email === "admin@gmail.com") {
          setError("Admin account already exists. Please use login instead.")
          return
        }

        // Register new user
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              student_id: formData.studentId,
              full_name: `${formData.firstName} ${formData.lastName}`,
            },
          },
        })

        if (error) throw error

        if (data.user && !data.user.email_confirmed_at) {
          setSuccess("Registration successful! Please check your email to verify your account.")
        } else {
          setSuccess("Registration successful! You can now sign in.")
          setTimeout(() => {
            onSwitchMode("login")
          }, 2000)
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error)
      setError(error.message || "An error occurred during authentication")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      studentId: "",
    })
    setError("")
    setSuccess("")
  }

  const handleModeSwitch = (newMode: "login" | "register") => {
    resetForm()
    onSwitchMode(newMode)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-gray-900 dark:text-white font-bold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 dark:text-gray-300">
            {mode === "login"
              ? "Sign in to access your learning dashboard"
              : "Join our learning platform and start your journey"}
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300 font-medium">
                        First Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300 font-medium">
                        Last Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentId" className="text-gray-700 dark:text-gray-300 font-medium">
                      Student ID
                    </Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="STU001234"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange("studentId", e.target.value)}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10 pr-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <Alert className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{mode === "login" ? "Signing In..." : "Creating Account..."}</span>
                  </div>
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                  onClick={() => handleModeSwitch(mode === "login" ? "register" : "login")}
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
