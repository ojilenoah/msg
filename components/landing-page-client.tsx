"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Award, TrendingUp } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"

export function LandingPageClient() {
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: "login" | "register" }>({
    open: false,
    mode: "register",
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/10 dark:to-indigo-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {" "}
                MSGetsoplatform
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience our advanced learning management system designed for modern education. Track your progress,
              complete assessments, and achieve your learning goals with our modular approach.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="rounded-xl px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                onClick={() => setAuthModal({ open: true, mode: "register" })}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl px-8 py-4 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                onClick={() => setAuthModal({ open: true, mode: "login" })}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why Choose MSGetsoplatform?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Built for modern learners with cutting-edge technology
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Modular Content</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                Learn through structured modules and units designed for optimal knowledge retention.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                Monitor your learning journey with detailed progress analytics and completion metrics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                Test your knowledge with self-assessments and tutor-marked assignments.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Personalized</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                Tailored learning experience that adapts to your pace and learning style.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-blue-100 dark:text-blue-100 mb-8">
            Join thousands of students already using MSGetsoplatform
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-xl px-8 py-4 text-lg bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => setAuthModal({ open: true, mode: "register" })}
          >
            Join Now
          </Button>
        </div>
      </div>
      <AuthModal
        open={authModal.open}
        mode={authModal.mode}
        onClose={() => setAuthModal({ ...authModal, open: false })}
        onSwitchMode={(mode) => setAuthModal({ ...authModal, mode })}
      />
    </div>
  )
}
