"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, BarChart3, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { parseMarkdownToModules } from "@/lib/markdown-parser"

interface Course {
  id: string
  title: string
  slug: string
  description: string
  markdown: string
  created_at: string
}

interface StudentProgress {
  student_id: string
  student_email: string
  student_name: string
  course_id: string
  course_title: string
  completed_units: number
  total_units: number
  progress_percentage: number
  last_updated: string
}

export default function AdminOverview() {
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    try {
      // Fetch courses
      const { data: coursesData } = await supabase.from("courses").select("*").order("created_at", { ascending: false })
      setCourses(coursesData || [])

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase.rpc("get_all_users")

      if (!studentsError && studentsData) {
        const formattedStudents = studentsData
          .filter((user: any) => user.email !== "admin@gmail.com")
          .map((user: any) => ({
            id: user.id,
            email: user.email || "",
            first_name: user.raw_user_meta_data?.first_name || "",
            last_name: user.raw_user_meta_data?.last_name || "",
            full_name: user.raw_user_meta_data?.full_name || user.raw_user_meta_data?.first_name || user.email || "",
            student_id: user.raw_user_meta_data?.student_id || "",
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at || "",
          }))

        setStudents(formattedStudents)
      }

      // Fetch student progress
      const { data: progressData } = await supabase
        .from("student_course_progress_ultra")
        .select("*")
        .order("last_updated", { ascending: false })

      if (progressData && coursesData) {
        const formattedProgress: StudentProgress[] = progressData
          .map((progress: any) => {
            const course = coursesData.find((c) => c.id === progress.course_id)
            if (!course) return null

            const modules = parseMarkdownToModules(course.markdown)
            const totalUnits = modules.length

            let completedUnits = 0
            if (progress.units_progress) {
              const tutorCompleted = progress.tutor_marked_completed || {}
              completedUnits = modules.filter((unit) => {
                const unitKey = `${unit.module}_${unit.unit}`
                const unitProgress = progress.units_progress[unitKey]

                if (!unitProgress?.completed) return false

                const hasTutorAssessment = unit.tutorMarked && unit.tutorMarked.questions.length > 0
                if (hasTutorAssessment) {
                  return tutorCompleted[unitKey] || false
                }

                return true
              }).length
            }

            const progressPercentage = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0

            return {
              student_id: progress.student_id,
              student_email: "Student",
              student_name: "Student",
              course_id: progress.course_id,
              course_title: course.title,
              completed_units: completedUnits,
              total_units: totalUnits,
              progress_percentage: progressPercentage,
              last_updated: progress.last_updated,
            }
          })
          .filter(Boolean)

        setStudentProgress(formattedProgress)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading overview...</p>
        </div>
      </div>
    )
  }

  const stats = {
    totalCourses: courses.length,
    totalStudents: students.length,
    avgProgress:
      studentProgress.length > 0
        ? Math.round(studentProgress.reduce((acc, p) => acc + p.progress_percentage, 0) / studentProgress.length)
        : 0,
    activeStudents: new Set(studentProgress.filter((p) => p.progress_percentage > 0).map((p) => p.student_id)).size,
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Overview</h1>
        <p className="text-gray-600 dark:text-gray-300">System statistics and recent activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Students</CardTitle>
            <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Students</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeStudents}</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Progress</CardTitle>
            <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Recent Student Activity</CardTitle>
          <CardDescription>Latest progress updates from students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentProgress.length > 0 ? (
              studentProgress.slice(0, 5).map((progress, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{progress.student_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{progress.course_title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last updated: {new Date(progress.last_updated).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{progress.progress_percentage}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {progress.completed_units}/{progress.total_units} units
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No student activity yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
