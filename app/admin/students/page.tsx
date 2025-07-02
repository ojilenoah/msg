"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, Users, BarChart3 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { parseMarkdownToModules } from "@/lib/markdown-parser"

interface Student {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
  aud: string
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

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    try {
      // Fetch students from public_user_profiles view
      const { data: studentsData, error: studentsError } = await supabase
        .from("public_user_profiles")
        .select("*")
        .neq("email", "admin@gmail.com")

      if (studentsError) {
        console.error("Error fetching students:", studentsError)
      }

      if (studentsData) {
        setStudents(studentsData)
      }

      // Fetch courses and progress
      const { data: coursesData } = await supabase.from("courses").select("*")
      const { data: progressData } = await supabase
        .from("student_course_progress_ultra")
        .select("*")
        .order("last_updated", { ascending: false })

      if (progressData && coursesData && studentsData) {
        const formattedProgress: StudentProgress[] = progressData
          .map((progress: any) => {
            const course = coursesData.find((c) => c.id === progress.course_id)
            const student = studentsData.find((s: any) => s.id === progress.student_id)

            if (!course || !student) return null

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

            // Extract display name from email (part before @)
            const displayName = student.email ? student.email.split("@")[0] : "Student"

            return {
              student_id: progress.student_id,
              student_email: student.email || "",
              student_name: displayName,
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

  const filteredStudents = students.filter((student) => {
    const displayName = student.email ? student.email.split("@")[0] : "Student"
    const studentId = `STU${student.id.slice(-3).toUpperCase()}`

    return (
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Student Management</h1>
          <p className="text-gray-600 dark:text-gray-300">View and manage student information</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Students List */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl mb-8">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">All Students ({students.length})</CardTitle>
          <CardDescription>Manage and view student information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => {
                const displayName = student.email ? student.email.split("@")[0] : `Student ${index + 1}`
                const studentId = `STU${student.id.slice(-3).toUpperCase()}`

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{displayName}</h3>
                        <Badge variant="outline">{studentId}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{student.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Joined: {new Date(student.created_at).toLocaleDateString()}
                        {student.last_sign_in_at && (
                          <span className="ml-4">
                            Last active: {new Date(student.last_sign_in_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No students found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Progress */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Student Progress</CardTitle>
          <CardDescription>Track student progress across all courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentProgress.length > 0 ? (
              studentProgress.map((progress, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{progress.student_name}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{progress.student_email}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{progress.course_title}</p>
                    <div className="flex items-center space-x-4">
                      <Progress value={progress.progress_percentage} className="flex-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {progress.progress_percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {progress.completed_units} of {progress.total_units} units completed
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No progress data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
