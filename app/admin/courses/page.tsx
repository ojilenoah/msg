"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
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

export default function AdminCourses() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const supabase = createClient()
      const { data: coursesData } = await supabase.from("courses").select("*").order("created_at", { ascending: false })
      setCourses(coursesData || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = () => {
    router.push("/admin/editor?new=true")
  }

  const handleEditCourse = (course: Course) => {
    router.push(`/admin/editor?id=${course.id}`)
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("courses").delete().eq("id", courseId)

      if (error) throw error

      setCourses((prev) => prev.filter((c) => c.id !== courseId))
    } catch (error) {
      console.error("Error deleting course:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Course Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Create and manage your courses</p>
        </div>
        <Button onClick={handleCreateCourse} className="rounded-lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl"
          >
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">{course.title}</CardTitle>
              <CardDescription>{course.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{course.slug}</Badge>
                <Badge variant="outline">{parseMarkdownToModules(course.markdown).length} units</Badge>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEditCourse(course)} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCourse(course.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Get started by creating your first course.</p>
            <Button onClick={handleCreateCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Course
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
