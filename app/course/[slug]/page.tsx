"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  BookOpen,
  CheckCircle,
  Circle,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  PenTool,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AssessmentModal } from "@/components/assessment-modal"
import { parseMarkdownToModules, type ModuleUnit } from "@/lib/markdown-parser"
import Link from "next/link"

interface Course {
  id: string
  title: string
  slug: string
  description: string
  markdown: string
}

interface ModuleGroup {
  moduleNumber: number
  units: ModuleUnit[]
  completedUnits: number
  totalUnits: number
}

// Custom component for rendering videos
const VideoEmbed = ({ videoId }: { videoId: string }) => {
  return (
    <div className="video-container my-6">
      <iframe
        width="100%"
        height="400"
        src={`https://www.youtube.com/embed/${videoId}`}
        frameBorder="0"
        allowFullScreen
        className="rounded-lg shadow-lg"
        title={`YouTube video ${videoId}`}
      />
    </div>
  )
}

export default function CoursePage() {
  const params = useParams()
  const slug = params.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleUnit[]>([])
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([])
  const [currentUnit, setCurrentUnit] = useState<ModuleUnit | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [assessmentProgress, setAssessmentProgress] = useState<Record<string, { self: boolean; tutor: boolean }>>({})

  // File explorer state
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())

  // Modal state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [missingAssessments, setMissingAssessments] = useState<string[]>([])

  // Assessment modal state
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<{ type: "self" | "tutor"; assessment: any } | null>(null)

  useEffect(() => {
    if (slug) {
      fetchCourse()
    }
  }, [slug])

  useEffect(() => {
    // Group modules and calculate completion
    const grouped = modules.reduce((acc, unit) => {
      const existing = acc.find((g) => g.moduleNumber === unit.module)
      if (existing) {
        existing.units.push(unit)
      } else {
        acc.push({
          moduleNumber: unit.module,
          units: [unit],
          completedUnits: 0,
          totalUnits: 0,
        })
      }
      return acc
    }, [] as ModuleGroup[])

    // Calculate completion for each module
    grouped.forEach((moduleGroup) => {
      moduleGroup.totalUnits = moduleGroup.units.length
      moduleGroup.completedUnits = moduleGroup.units.filter((unit) => {
        const unitKey = `${unit.module}-${unit.unit}`
        return isUnitComplete(unit, unitKey)
      }).length
    })

    // Sort modules by number
    grouped.sort((a, b) => a.moduleNumber - b.moduleNumber)

    // Sort units within each module
    grouped.forEach((moduleGroup) => {
      moduleGroup.units.sort((a, b) => a.unit - b.unit)
    })

    setModuleGroups(grouped)

    // Auto-expand first module
    if (grouped.length > 0) {
      setExpandedModules(new Set([grouped[0].moduleNumber]))
    }
  }, [modules, progress, assessmentProgress])

  const isUnitComplete = (unit: ModuleUnit, unitKey: string) => {
    const unitProgress = progress[unitKey]
    const unitAssessmentProgress = assessmentProgress[unitKey] || { self: false, tutor: false }

    // Unit is only complete if:
    // 1. It's marked as complete in progress
    // 2. AND if it has tutor assessments, they must be completed
    const hasTutorAssessment = unit.tutorMarked && unit.tutorMarked.questions.length > 0

    if (hasTutorAssessment) {
      return unitProgress && unitAssessmentProgress.tutor
    }

    return unitProgress
  }

  const fetchCourse = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        window.location.href = "/"
        return
      }
      setUser(currentUser)

      const supabase = createClient()

      const { data: courseData, error } = await supabase.from("courses").select("*").eq("slug", slug).single()

      if (error) throw error

      setCourse(courseData)

      // Parse markdown content into modules and units
      if (courseData.markdown) {
        const parsedModules = parseMarkdownToModules(courseData.markdown)
        setModules(parsedModules)
        if (parsedModules.length > 0) {
          setCurrentUnit(parsedModules[0])
        }
      }

      // Fetch user progress for this course using ultra structure
      const { data: progressData } = await supabase
        .from("student_course_progress_ultra")
        .select("units_progress, self_assessments_completed, tutor_marked_completed")
        .eq("student_id", currentUser.id)
        .eq("course_id", courseData.id)
        .maybeSingle()

      const progressMap: Record<string, boolean> = {}
      const assessmentMap: Record<string, { self: boolean; tutor: boolean }> = {}

      if (progressData) {
        // Extract unit completion from units_progress
        if (progressData.units_progress) {
          Object.entries(progressData.units_progress).forEach(([unitKey, unitData]: [string, any]) => {
            const key = unitKey.replace("_", "-")
            progressMap[key] = unitData.completed || false
          })
        }

        // Extract assessment completion
        if (progressData.self_assessments_completed) {
          Object.entries(progressData.self_assessments_completed).forEach(([unitKey, completed]: [string, any]) => {
            const key = unitKey.replace("_", "-")
            if (!assessmentMap[key]) assessmentMap[key] = { self: false, tutor: false }
            assessmentMap[key].self = completed || false
          })
        }

        if (progressData.tutor_marked_completed) {
          Object.entries(progressData.tutor_marked_completed).forEach(([unitKey, completed]: [string, any]) => {
            const key = unitKey.replace("_", "-")
            if (!assessmentMap[key]) assessmentMap[key] = { self: false, tutor: false }
            assessmentMap[key].tutor = completed || false
          })
        }
      }

      setProgress(progressMap)
      setAssessmentProgress(assessmentMap)
    } catch (error) {
      console.error("Error fetching course:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnitChange = (unit: ModuleUnit) => {
    setCurrentUnit(unit)
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  const handleAssessmentComplete = async () => {
    // Refresh progress after assessment completion
    if (user && course) {
      const supabase = createClient()
      const { data: progressData } = await supabase
        .from("student_course_progress_ultra")
        .select("units_progress, self_assessments_completed, tutor_marked_completed")
        .eq("student_id", user.id)
        .eq("course_id", course.id)
        .maybeSingle()

      const progressMap: Record<string, boolean> = {}
      const assessmentMap: Record<string, { self: boolean; tutor: boolean }> = {}

      if (progressData) {
        if (progressData.units_progress) {
          Object.entries(progressData.units_progress).forEach(([unitKey, unitData]: [string, any]) => {
            const key = unitKey.replace("_", "-")
            progressMap[key] = unitData.completed || false
          })
        }

        if (progressData.self_assessments_completed) {
          Object.entries(progressData.self_assessments_completed).forEach(([unitKey, completed]: [string, any]) => {
            const key = unitKey.replace("_", "-")
            if (!assessmentMap[key]) assessmentMap[key] = { self: false, tutor: false }
            assessmentMap[key].self = completed || false
          })
        }

        if (progressData.tutor_marked_completed) {
          Object.entries(progressData.tutor_marked_completed).forEach(([unitKey, completed]: [string, any]) => {
            const key = unitKey.replace("_", "-")
            if (!assessmentMap[key]) assessmentMap[key] = { self: false, tutor: false }
            assessmentMap[key].tutor = completed || false
          })
        }
      }

      setProgress(progressMap)
      setAssessmentProgress(assessmentMap)
    }

    // Close the assessment modal
    setAssessmentModalOpen(false)
    setSelectedAssessment(null)
  }

  const toggleModuleExpansion = (moduleNumber: number) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(moduleNumber)) {
        newSet.delete(moduleNumber)
      } else {
        newSet.add(moduleNumber)
      }
      return newSet
    })
  }

  const markUnitComplete = async () => {
    if (!currentUnit || !user || !course) return

    const unitKey = `${currentUnit.module}-${currentUnit.unit}`
    const unitAssessmentProgress = assessmentProgress[unitKey] || { self: false, tutor: false }

    // Check if unit has assessments that need to be completed
    const hasSelfAssessment = currentUnit.selfAssessment && currentUnit.selfAssessment.questions.length > 0
    const hasTutorAssessment = currentUnit.tutorMarked && currentUnit.tutorMarked.questions.length > 0

    // Check if required assessments are completed
    const missing: string[] = []
    if (hasSelfAssessment && !unitAssessmentProgress.self) {
      missing.push("Self Assessment")
    }
    if (hasTutorAssessment && !unitAssessmentProgress.tutor) {
      missing.push("Tutor Marked Assignment")
    }

    if (missing.length > 0) {
      setMissingAssessments(missing)
      setShowAssessmentModal(true)
      return
    }

    try {
      const supabase = createClient()
      const ultraUnitKey = `${currentUnit.module}_${currentUnit.unit}`

      // Get existing progress data
      const { data: existingData } = await supabase
        .from("student_course_progress_ultra")
        .select("*")
        .eq("student_id", user.id)
        .eq("course_id", course.id)
        .maybeSingle()

      const currentUnitsProgress = existingData?.units_progress || {}
      const currentUnitData = currentUnitsProgress[ultraUnitKey] || {}

      const updatedUnitData = {
        ...currentUnitData,
        completed: true,
      }

      const updatedUnitsProgress = {
        ...currentUnitsProgress,
        [ultraUnitKey]: updatedUnitData,
      }

      // Check if module is completed (all units in this module are done)
      const moduleUnits = modules.filter((m) => m.module === currentUnit.module)
      const moduleCompleted = moduleUnits.every((unit) => {
        const key = `${unit.module}_${unit.unit}`
        if (key === ultraUnitKey) return true

        const unitData = updatedUnitsProgress[key]
        if (!unitData?.completed) return false

        // Also check if tutor assessments are complete for this unit
        const unitKey = `${unit.module}-${unit.unit}`
        const unitAssessments = assessmentProgress[unitKey] || { self: false, tutor: false }
        const hasTutorAssignment = unit.tutorMarked && unit.tutorMarked.questions.length > 0

        return hasTutorAssignment ? unitAssessments.tutor : true
      })

      let updatedModulesCompleted = existingData?.modules_completed || []
      if (moduleCompleted && !updatedModulesCompleted.includes(currentUnit.module)) {
        updatedModulesCompleted = [...updatedModulesCompleted, currentUnit.module]
      }

      // Check if entire course is completed
      const allModules = [...new Set(modules.map((m) => m.module))]
      const courseCompleted = allModules.every((moduleNum) => updatedModulesCompleted.includes(moduleNum))

      const updateData = {
        units_progress: updatedUnitsProgress,
        modules_completed: updatedModulesCompleted,
        course_completed: courseCompleted,
        last_updated: new Date().toISOString(),
      }

      if (existingData) {
        const { error } = await supabase
          .from("student_course_progress_ultra")
          .update(updateData)
          .eq("student_id", user.id)
          .eq("course_id", course.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("student_course_progress_ultra").insert({
          student_id: user.id,
          course_id: course.id,
          ...updateData,
        })

        if (error) throw error
      }

      setProgress((prev) => ({
        ...prev,
        [unitKey]: true,
      }))
    } catch (error) {
      console.error("Error marking unit complete:", error)
    }
  }

  // Function to render content with video embeds
  const renderContentWithVideos = (content: string) => {
    // Split content by video markers and render each part
    const parts = content.split(/(__VIDEO_EMBED_[a-zA-Z0-9_-]+__)/g)

    return parts.map((part, index) => {
      const videoMatch = part.match(/__VIDEO_EMBED_([a-zA-Z0-9_-]+)__/)
      if (videoMatch) {
        const videoId = videoMatch[1]
        return <VideoEmbed key={index} videoId={videoId} />
      }

      // Regular markdown content
      if (part.trim()) {
        return (
          <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
            {part}
          </ReactMarkdown>
        )
      }

      return null
    })
  }

  // Handle assessment button clicks
  const handleAssessmentClick = (type: "self" | "tutor", assessment: any) => {
    setSelectedAssessment({ type, assessment })
    setAssessmentModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course not found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">The course you're looking for doesn't exist.</p>
          <Link href="/dashboard">
            <Button className="rounded-lg">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Calculate progress based on tutor assessment completion
  const completedUnits = modules.filter((unit) => {
    const unitKey = `${unit.module}-${unit.unit}`
    return isUnitComplete(unit, unitKey)
  }).length

  const totalUnits = modules.length
  const progressPercentage = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0

  const currentUnitKey = currentUnit ? `${currentUnit.module}-${currentUnit.unit}` : ""
  const currentUnitProgress = currentUnit ? isUnitComplete(currentUnit, currentUnitKey) : false
  const currentUnitAssessmentProgress = currentUnit
    ? assessmentProgress[currentUnitKey] || { self: false, tutor: false }
    : { self: false, tutor: false }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-16">
      <div className="flex h-screen">
        {/* VSCode-like File Explorer Sidebar */}
        <div className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden`}>
          <div className="h-full bg-white/60 dark:bg-black/60 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Explorer
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Course Title */}
              <div className="mb-4 p-2 bg-white/40 dark:bg-black/40 rounded-lg">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{course.title}</span>
                </div>
                {totalUnits > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-300">Progress</span>
                      <span className="text-gray-900 dark:text-white font-medium">{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-1" />
                  </div>
                )}
              </div>

              {/* File Explorer Tree */}
              <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                {moduleGroups.map((moduleGroup) => {
                  const isExpanded = expandedModules.has(moduleGroup.moduleNumber)
                  const moduleProgress =
                    moduleGroup.totalUnits > 0
                      ? Math.round((moduleGroup.completedUnits / moduleGroup.totalUnits) * 100)
                      : 0

                  return (
                    <div key={moduleGroup.moduleNumber}>
                      {/* Module Header */}
                      <div
                        className="flex items-center space-x-1 py-1 px-2 hover:bg-white/60 dark:hover:bg-black/60 rounded cursor-pointer group"
                        onClick={() => toggleModuleExpansion(moduleGroup.moduleNumber)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                        )}
                        {isExpanded ? (
                          <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                        <span className="text-sm text-gray-900 dark:text-white flex-1">
                          Module {moduleGroup.moduleNumber}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {moduleGroup.completedUnits}/{moduleGroup.totalUnits}
                        </span>
                      </div>

                      {/* Module Progress Bar */}
                      {isExpanded && (
                        <div className="ml-6 mr-2 mb-2">
                          <Progress value={moduleProgress} className="h-1" />
                        </div>
                      )}

                      {/* Units */}
                      {isExpanded && (
                        <div className="ml-4 space-y-1">
                          {moduleGroup.units.map((unit) => {
                            const unitKey = `${unit.module}-${unit.unit}`
                            const isComplete = isUnitComplete(unit, unitKey)
                            const isCurrent = currentUnit?.module === unit.module && currentUnit?.unit === unit.unit
                            const unitAssessments = assessmentProgress[unitKey] || { self: false, tutor: false }

                            return (
                              <div
                                key={`${unit.module}-${unit.unit}`}
                                className={`flex items-center space-x-2 py-1 px-2 rounded cursor-pointer group ${
                                  isCurrent
                                    ? "bg-blue-100 dark:bg-blue-900/30"
                                    : "hover:bg-white/60 dark:hover:bg-black/60"
                                }`}
                                onClick={() => handleUnitChange(unit)}
                              >
                                <div className="w-3 flex justify-center">
                                  {isComplete ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Circle className="h-3 w-3 text-gray-400" />
                                  )}
                                </div>
                                <File className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                <span className="text-xs text-gray-900 dark:text-white flex-1 truncate">
                                  Unit {unit.unit}: {unit.title}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {unit.selfAssessment && unit.selfAssessment.questions.length > 0 && (
                                    <PenTool
                                      className={`h-2 w-2 ${unitAssessments.self ? "text-green-500" : "text-gray-400"}`}
                                    />
                                  )}
                                  {unit.tutorMarked && unit.tutorMarked.questions.length > 0 && (
                                    <FileText
                                      className={`h-2 w-2 ${unitAssessments.tutor ? "text-green-500" : "text-gray-400"}`}
                                    />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {moduleGroups.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No modules found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
                  {currentUnit && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Module {currentUnit.module} • Unit {currentUnit.unit} • {currentUnit.title}
                    </p>
                  )}
                </div>
              </div>
              {totalUnits > 0 && (
                <div className="flex items-center space-x-2">
                  <Progress value={progressPercentage} className="w-32" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{progressPercentage}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {currentUnit && currentUnit.content ? (
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-0 shadow-lg rounded-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-gray-900 dark:text-white">{currentUnit.title}</CardTitle>
                        <CardDescription>
                          Module {currentUnit.module} • Unit {currentUnit.unit}
                        </CardDescription>
                      </div>
                      {!currentUnitProgress && (
                        <Button onClick={markUnitComplete} className="rounded-lg">
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {renderContentWithVideos(currentUnit.content)}
                    </div>
                  </CardContent>
                </Card>

                {/* Assessment Buttons */}
                {(currentUnit.selfAssessment?.questions.length > 0 ||
                  currentUnit.tutorMarked?.questions.length > 0) && (
                  <Card className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-0 shadow-lg rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">Assessments</CardTitle>
                      <CardDescription>Complete the assessments for this unit</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4">
                        {currentUnit.selfAssessment && currentUnit.selfAssessment.questions.length > 0 && (
                          <Button
                            onClick={() => handleAssessmentClick("self", currentUnit.selfAssessment)}
                            className={`flex-1 rounded-lg ${
                              currentUnitAssessmentProgress.self
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            <PenTool className="h-4 w-4 mr-2" />
                            {currentUnitAssessmentProgress.self ? "Review Self Assessment" : "Take Self Assessment"}
                          </Button>
                        )}

                        {currentUnit.tutorMarked && currentUnit.tutorMarked.questions.length > 0 && (
                          <Button
                            onClick={() => handleAssessmentClick("tutor", currentUnit.tutorMarked)}
                            className={`flex-1 rounded-lg ${
                              currentUnitAssessmentProgress.tutor
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-purple-600 hover:bg-purple-700"
                            }`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {currentUnitAssessmentProgress.tutor ? "Review Assignment" : "Submit Assignment"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : course.markdown ? (
              <div className="max-w-4xl mx-auto">
                <Card className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-0 shadow-lg rounded-xl mb-6">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">{course.title}</CardTitle>
                    <CardDescription>Course Content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {renderContentWithVideos(course.markdown)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No content available</h3>
                  <p className="text-gray-600 dark:text-gray-300">This course doesn't have any content yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Required Modal */}
      <Dialog open={showAssessmentModal} onOpenChange={setShowAssessmentModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Assessments Required</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              You must complete the following assessments before marking this unit as complete:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <ul className="space-y-2">
              {missingAssessments.map((assessment, index) => (
                <li key={index} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Circle className="h-4 w-4 text-amber-500" />
                  <span>{assessment}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAssessmentModal(false)} className="rounded-lg">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessment Modal */}
      {selectedAssessment && (
        <AssessmentModal
          open={assessmentModalOpen}
          onClose={() => {
            setAssessmentModalOpen(false)
            setSelectedAssessment(null)
          }}
          type={selectedAssessment.type}
          assessment={selectedAssessment.assessment}
          courseId={course.id}
          moduleNumber={currentUnit?.module || 1}
          unitNumber={currentUnit?.unit || 1}
          userId={user?.id || ""}
          onComplete={handleAssessmentComplete}
        />
      )}
    </div>
  )
}
