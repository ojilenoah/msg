"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, Award, TrendingUp } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { parseMarkdownToModules } from "@/lib/markdown-parser"

interface Course {
  id: string
  title: string
  slug: string
  description: string
  markdown: string
  created_at: string
}

interface CourseProgress {
  course_id: string
  completed_units: number
  total_units: number
  progress_percentage: number
}

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          window.location.href = "/"
          return
        }

        if (!mounted) return

        setUser(currentUser)

        const supabase = createClient()

        // Fetch courses with markdown content
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false })

        if (coursesError) throw coursesError

        if (!mounted) return

        setCourses(coursesData || [])

        // Fetch progress data from ultra table
        const { data: progressData, error: progressError } = await supabase
          .from("student_course_progress_ultra")
          .select("course_id, units_progress, tutor_marked_completed")
          .eq("student_id", currentUser.id)

        if (progressError) throw progressError

        if (!mounted) return

        // Calculate progress from ultra structure with tutor assessment requirement
        const progressMap: Record<string, CourseProgress> = {}

        if (progressData && coursesData) {
          coursesData.forEach((course) => {
            const courseProgressData = progressData.find((p) => p.course_id === course.id)

            // Parse course modules to understand structure
            const modules = course.markdown ? parseMarkdownToModules(course.markdown) : []
            const totalUnits = modules.length

            if (courseProgressData?.units_progress && totalUnits > 0) {
              const unitsProgress = courseProgressData.units_progress
              const tutorCompleted = courseProgressData.tutor_marked_completed || {}

              // Count completed units (require tutor assessment if exists)
              const completedUnits = modules.filter((unit) => {
                const unitKey = `${unit.module}_${unit.unit}`
                const unitProgress = unitsProgress[unitKey]

                if (!unitProgress?.completed) return false

                // If unit has tutor assessment, it must be completed
                const hasTutorAssessment = unit.tutorMarked && unit.tutorMarked.questions.length > 0
                if (hasTutorAssessment) {
                  const tutorKey = `${unit.module}_${unit.unit}`
                  return tutorCompleted[tutorKey] || false
                }

                return true
              }).length

              progressMap[course.id] = {
                course_id: course.id,
                completed_units: completedUnits,
                total_units: totalUnits,
                progress_percentage: totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0,
              }
            } else {
              // No progress data for this course
              progressMap[course.id] = {
                course_id: course.id,
                completed_units: 0,
                total_units: totalUnits,
                progress_percentage: 0,
              }
            }
          })
        }

        setProgress(progressMap)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = {
    totalCourses: courses.length,
    inProgress: Object.values(progress).filter((p) => p.progress_percentage > 0 && p.progress_percentage < 100).length,
    completed: Object.values(progress).filter((p) => p.progress_percentage === 100).length,
    avgProgress:
      Object.values(progress).length > 0
        ? Math.round(
            Object.values(progress).reduce((acc, p) => acc + p.progress_percentage, 0) / Object.values(progress).length,
          )
        : 0,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.first_name || "Student"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Track your progress and continue your learning journey</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Available Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</CardTitle>
              <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgProgress}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Courses</h2>
            <Link href="/courses">
              <Button
                variant="outline"
                className="rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                View All Courses
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 6).map((course) => {
              const courseProgress = progress[course.id]
              return (
                <Card
                  key={course.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-xl group"
                >
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      {course.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {courseProgress && courseProgress.total_units > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Progress</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {courseProgress.progress_percentage}%
                          </span>
                        </div>
                        <Progress
                          value={courseProgress.progress_percentage}
                          className="h-2 bg-gray-200 dark:bg-gray-700"
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {courseProgress.completed_units} of {courseProgress.total_units} units completed
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Not started yet</div>
                    )}
                    <Link href={`/course/${course.slug}`}>
                      <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                        {courseProgress?.progress_percentage === 100 ? "Review Course" : "Start Learning"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses available</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Courses will appear here once they are added to the system.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
