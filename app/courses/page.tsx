"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Clock, Award, Users } from "lucide-react"
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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "not-started" | "in-progress" | "completed">("all")

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
        console.error("Error fetching courses data:", error)
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

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, statusFilter, progress])

  const filterCourses = () => {
    let filtered = courses

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((course) => {
        const courseProgress = progress[course.id]
        if (!courseProgress) return statusFilter === "not-started"

        switch (statusFilter) {
          case "not-started":
            return courseProgress.progress_percentage === 0
          case "in-progress":
            return courseProgress.progress_percentage > 0 && courseProgress.progress_percentage < 100
          case "completed":
            return courseProgress.progress_percentage === 100
          default:
            return true
        }
      })
    }

    setFilteredCourses(filtered)
  }

  const getStatusBadge = (courseId: string) => {
    const courseProgress = progress[courseId]
    if (!courseProgress || courseProgress.progress_percentage === 0) {
      return (
        <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          Not Started
        </Badge>
      )
    }
    if (courseProgress.progress_percentage === 100) {
      return (
        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
          Completed
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
        In Progress
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading courses...</p>
        </div>
      </div>
    )
  }

  const stats = {
    totalCourses: courses.length,
    notStarted:
      Object.values(progress).filter((p) => p.progress_percentage === 0).length +
      (courses.length - Object.keys(progress).length),
    inProgress: Object.values(progress).filter((p) => p.progress_percentage > 0 && p.progress_percentage < 100).length,
    completed: Object.values(progress).filter((p) => p.progress_percentage === 100).length,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Courses</h1>
          <p className="text-gray-600 dark:text-gray-300">Explore and continue your learning journey</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Not Started</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.notStarted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="rounded-xl"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "not-started" ? "default" : "outline"}
              onClick={() => setStatusFilter("not-started")}
              className="rounded-xl"
            >
              Not Started
            </Button>
            <Button
              variant={statusFilter === "in-progress" ? "default" : "outline"}
              onClick={() => setStatusFilter("in-progress")}
              className="rounded-xl"
            >
              In Progress
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
              className="rounded-xl"
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const courseProgress = progress[course.id]
            return (
              <Card
                key={course.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-xl group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {course.title}
                    </CardTitle>
                    {getStatusBadge(course.id)}
                  </div>
                  <CardDescription className="text-gray-600 dark:text-gray-300 line-clamp-3">
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
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4">Ready to start</div>
                  )}
                  <Link href={`/course/${course.slug}`} className="block">
                    <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                      {courseProgress?.progress_percentage === 100
                        ? "Review Course"
                        : courseProgress?.progress_percentage > 0
                          ? "Continue Learning"
                          : "Start Learning"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== "all" ? "No courses found" : "No courses available"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Courses will appear here once they are added to the system."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
