"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Save,
  X,
  Edit,
  Eye,
  Menu,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Code,
  CheckCircle,
  AlertCircle,
  PenTool,
  FileText,
  Heading1,
  Heading2,
  Bold,
  Italic,
  List,
  Quote,
  ImageIcon,
  Zap,
} from "lucide-react"
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

interface ModuleUnit {
  module: number
  unit: number
  title: string
  content: string
  selfAssessment?: {
    questions: Array<{
      id: string
      question: string
      type: string
      options?: string[]
    }>
  }
  tutorMarked?: {
    questions: Array<{
      id: string
      question: string
      type: string
    }>
  }
}

interface ModuleGroup {
  moduleNumber: number
  units: ModuleUnit[]
}

// Video embed component
const VideoEmbed = ({ videoId }: { videoId: string }) => {
  return (
    <div className="my-6">
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        ></iframe>
      </div>
    </div>
  )
}

// Quick insert snippets
const quickInsertSnippets = [
  {
    name: "Heading 1",
    icon: Heading1,
    snippet: "# Heading 1\n\n",
    description: "Insert a level 1 heading",
  },
  {
    name: "Heading 2",
    icon: Heading2,
    snippet: "## Heading 2\n\n",
    description: "Insert a level 2 heading",
  },
  {
    name: "Bold Text",
    icon: Bold,
    snippet: "**bold text**",
    description: "Insert bold text",
  },
  {
    name: "Italic Text",
    icon: Italic,
    snippet: "*italic text*",
    description: "Insert italic text",
  },
  {
    name: "Code Block",
    icon: Code,
    snippet: "```\ncode here\n```\n\n",
    description: "Insert a code block",
  },
  {
    name: "Ordered List",
    icon: List,
    snippet: "1. First item\n2. Second item\n3. Third item\n\n",
    description: "Insert an ordered list",
  },
  {
    name: "Unordered List",
    icon: List,
    snippet: "- First item\n- Second item\n- Third item\n\n",
    description: "Insert an unordered list",
  },
  {
    name: "Blockquote",
    icon: Quote,
    snippet: "> This is a blockquote\n> It can span multiple lines\n\n",
    description: "Insert a blockquote",
  },
  {
    name: "Image",
    icon: ImageIcon,
    snippet: "![Alt text](image-url.jpg)\n\n",
    description: "Insert an image",
  },
]

export default function AdminEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get("id")
  const isNew = searchParams.get("new") === "true"
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const unitTextareaRef = useRef<HTMLTextAreaElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  const [course, setCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    markdown: "",
  })
  const [modules, setModules] = useState<ModuleUnit[]>([])
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())
  const [selectedUnit, setSelectedUnit] = useState<ModuleUnit | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit states
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingSlug, setEditingSlug] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)

  // View states
  const [currentView, setCurrentView] = useState<"unit" | "fullMarkdown">("unit")
  const [unitEditMode, setUnitEditMode] = useState(false)
  const [unitContent, setUnitContent] = useState("")
  const [unitTitle, setUnitTitle] = useState("")

  // Save status
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  // Assessment modal state
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<{ type: "self" | "tutor"; assessment: any } | null>(null)

  // Add module/unit dialog states
  const [showAddModuleDialog, setShowAddModuleDialog] = useState(false)
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newUnitTitle, setNewUnitTitle] = useState("")
  const [selectedModuleForUnit, setSelectedModuleForUnit] = useState<number>(1)

  // Header collapse state
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const [headerHovered, setHeaderHovered] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Live preview parsed unit
  const [livePreviewUnit, setLivePreviewUnit] = useState<ModuleUnit | null>(null)

  useEffect(() => {
    if (isNew) {
      // Create new course
      const newCourse: Course = {
        id: "",
        title: "New Course",
        slug: "",
        description: "",
        markdown: "",
        created_at: new Date().toISOString(),
      }
      setCourse(newCourse)
      setFormData({
        title: newCourse.title,
        slug: newCourse.slug,
        description: newCourse.description,
        markdown: newCourse.markdown,
      })
      setLoading(false)
    } else if (courseId) {
      fetchCourse()
    } else {
      setLoading(false)
    }
  }, [courseId, isNew])

  useEffect(() => {
    // Parse markdown and update sidebar
    const parsedModules = parseMarkdownToModules(formData.markdown)
    setModules(parsedModules)
    updateModuleGroups(parsedModules)
  }, [formData.markdown])

  // Live preview effect - parse unit content in real-time
  useEffect(() => {
    if (currentView === "unit" && selectedUnit && unitEditMode) {
      // Create a temporary markdown with just this unit's content
      const tempMarkdown = `# Module ${selectedUnit.module}: Module Title

## Unit ${selectedUnit.unit}: ${unitTitle}

${unitContent}
`
      const parsedUnits = parseMarkdownToModules(tempMarkdown)
      if (parsedUnits.length > 0) {
        setLivePreviewUnit(parsedUnits[0])
      }
    } else {
      setLivePreviewUnit(null)
    }
  }, [unitContent, unitTitle, currentView, selectedUnit, unitEditMode])

  // Header collapse on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!mainContentRef.current) return

      const currentScrollY = mainContentRef.current.scrollTop

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setHeaderCollapsed(true)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setHeaderCollapsed(false)
      }

      setLastScrollY(currentScrollY)
    }

    const mainContent = mainContentRef.current
    if (mainContent) {
      mainContent.addEventListener("scroll", handleScroll, { passive: true })
      return () => mainContent.removeEventListener("scroll", handleScroll)
    }
  }, [lastScrollY])

  const fetchCourse = async () => {
    try {
      const supabase = createClient()
      const { data: courseData, error } = await supabase.from("courses").select("*").eq("id", courseId).single()

      if (error) throw error

      setCourse(courseData)
      setFormData({
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        markdown: courseData.markdown,
      })
    } catch (error) {
      console.error("Error fetching course:", error)
      router.push("/admin/courses")
    } finally {
      setLoading(false)
    }
  }

  const updateModuleGroups = (parsedModules: ModuleUnit[]) => {
    const grouped = parsedModules.reduce((acc, unit) => {
      const existing = acc.find((g) => g.moduleNumber === unit.module)
      if (existing) {
        existing.units.push(unit)
      } else {
        acc.push({
          moduleNumber: unit.module,
          units: [unit],
        })
      }
      return acc
    }, [] as ModuleGroup[])

    // Sort modules and units
    grouped.sort((a, b) => a.moduleNumber - b.moduleNumber)
    grouped.forEach((moduleGroup) => {
      moduleGroup.units.sort((a, b) => a.unit - b.unit)
    })

    setModuleGroups(grouped)

    // Auto-expand first module and select first unit
    if (grouped.length > 0) {
      setExpandedModules(new Set([grouped[0].moduleNumber]))
      if (grouped[0].units.length > 0 && !selectedUnit && currentView === "unit") {
        handleUnitChange(grouped[0].units[0])
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

  const handleUnitChange = (unit: ModuleUnit) => {
    setSelectedUnit(unit)
    setCurrentView("unit")
    setUnitContent(unit.content)
    setUnitTitle(unit.title)
    setUnitEditMode(false)
  }

  const handleFullMarkdownView = () => {
    setCurrentView("fullMarkdown")
    setSelectedUnit(null)
    setUnitEditMode(false)
  }

  const insertSnippet = (snippet: string) => {
    if (currentView === "fullMarkdown" && textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentValue = formData.markdown

      const newValue = currentValue.substring(0, start) + snippet + currentValue.substring(end)

      handleInputChange("markdown", newValue)

      // Set cursor position after inserted snippet
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + snippet.length, start + snippet.length)
      }, 0)
    } else if (currentView === "unit" && unitEditMode && unitTextareaRef.current) {
      const textarea = unitTextareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentValue = unitContent

      const newValue = currentValue.substring(0, start) + snippet + currentValue.substring(end)

      setUnitContent(newValue)

      // Set cursor position after inserted snippet
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + snippet.length, start + snippet.length)
      }, 0)
    }
  }

  const addNewModule = async () => {
    if (!newModuleTitle.trim()) return

    const nextModuleNumber = Math.max(...moduleGroups.map((g) => g.moduleNumber), 0) + 1

    // Create a new unit for this module
    const newUnit: ModuleUnit = {
      module: nextModuleNumber,
      unit: 1,
      title: "Introduction",
      content: `Welcome to ${newModuleTitle}!

Add your content here...`,
    }

    const updatedModules = [...modules, newUnit]

    // Generate new markdown
    const newMarkdown = generateMarkdownFromModules(updatedModules)

    // Update formData
    const updatedFormData = { ...formData, markdown: newMarkdown }
    setFormData(updatedFormData)

    // Save to database if course exists
    if (course?.id) {
      await saveCourseToDatabase(updatedFormData)
    }

    setNewModuleTitle("")
    setShowAddModuleDialog(false)

    // Auto-expand the new module and select its first unit
    setExpandedModules((prev) => new Set([...prev, nextModuleNumber]))
    handleUnitChange(newUnit)
  }

  const addNewUnit = async () => {
    if (!newUnitTitle.trim() || !selectedModuleForUnit) return

    const moduleUnits = modules.filter((m) => m.module === selectedModuleForUnit)
    const nextUnitNumber = Math.max(...moduleUnits.map((u) => u.unit), 0) + 1

    const newUnit: ModuleUnit = {
      module: selectedModuleForUnit,
      unit: nextUnitNumber,
      title: newUnitTitle,
      content: `# ${newUnitTitle}

Add your content here...`,
    }

    const updatedModules = [...modules, newUnit]

    // Generate new markdown
    const newMarkdown = generateMarkdownFromModules(updatedModules)

    // Update formData
    const updatedFormData = { ...formData, markdown: newMarkdown }
    setFormData(updatedFormData)

    // Save to database if course exists
    if (course?.id) {
      await saveCourseToDatabase(updatedFormData)
    }

    setNewUnitTitle("")
    setShowAddUnitDialog(false)

    // Auto-expand the module and select the new unit
    setExpandedModules((prev) => new Set([...prev, selectedModuleForUnit]))
    handleUnitChange(newUnit)
  }

  const deleteUnit = async (moduleNum: number, unitNum: number) => {
    if (!confirm("Are you sure you want to delete this unit?")) return

    const updatedModules = modules.filter((unit) => !(unit.module === moduleNum && unit.unit === unitNum))

    // Generate new markdown
    const newMarkdown = generateMarkdownFromModules(updatedModules)

    // Update formData
    const updatedFormData = { ...formData, markdown: newMarkdown }
    setFormData(updatedFormData)

    // Save to database if course exists
    if (course?.id) {
      await saveCourseToDatabase(updatedFormData)
    }

    // Clear selection if deleted unit was selected
    if (selectedUnit?.module === moduleNum && selectedUnit?.unit === unitNum) {
      setSelectedUnit(null)
      setUnitContent("")
      setUnitTitle("")
      setCurrentView("fullMarkdown")
    }
  }

  const saveCourseToDatabase = async (dataToSave = formData) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("courses").update(dataToSave).eq("id", course?.id)
      if (error) throw error

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving to database:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const handleSaveCourse = async () => {
    setSaving(true)
    setSaveStatus("idle")
    try {
      const supabase = createClient()

      if (course?.id) {
        // Update existing course
        const { error } = await supabase.from("courses").update(formData).eq("id", course.id)
        if (error) throw error
      } else {
        // Create new course
        const { data, error } = await supabase.from("courses").insert([formData]).select().single()
        if (error) throw error
        setCourse(data)
      }

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving course:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUnit = async () => {
    if (!selectedUnit || !course?.id) return

    setSaving(true)
    setSaveStatus("idle")
    try {
      // Update the unit in the modules array
      const updatedModules = modules.map((unit) => {
        if (unit.module === selectedUnit.module && unit.unit === selectedUnit.unit) {
          return {
            ...unit,
            title: unitTitle,
            content: unitContent,
          }
        }
        return unit
      })

      // Regenerate markdown from updated modules
      const newMarkdown = generateMarkdownFromModules(updatedModules)

      // Update formData
      const updatedFormData = { ...formData, markdown: newMarkdown }
      setFormData(updatedFormData)

      // Save to database
      const supabase = createClient()
      const { error } = await supabase.from("courses").update(updatedFormData).eq("id", course.id)

      if (error) throw error

      // Update selected unit
      setSelectedUnit({
        ...selectedUnit,
        title: unitTitle,
        content: unitContent,
      })

      // Exit edit mode
      setUnitEditMode(false)

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving unit:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setSaving(false)
    }
  }

  const generateMarkdownFromModules = (modulesList: ModuleUnit[]) => {
    let markdown = ""

    // Group modules
    const grouped = modulesList.reduce((acc, unit) => {
      const existing = acc.find((g) => g.moduleNumber === unit.module)
      if (existing) {
        existing.units.push(unit)
      } else {
        acc.push({
          moduleNumber: unit.module,
          units: [unit],
        })
      }
      return acc
    }, [] as ModuleGroup[])

    // Sort modules and units
    grouped.sort((a, b) => a.moduleNumber - b.moduleNumber)
    grouped.forEach((moduleGroup) => {
      moduleGroup.units.sort((a, b) => a.unit - b.unit)
    })

    grouped.forEach((moduleGroup) => {
      // Add module header
      markdown += `# Module ${moduleGroup.moduleNumber}: Module Title

`

      moduleGroup.units.forEach((unit) => {
        markdown += `## Unit ${unit.unit}: ${unit.title}

`
        markdown += `${unit.content}

`

        // Add self-assessment if exists
        if (unit.selfAssessment && unit.selfAssessment.questions.length > 0) {
          markdown += `:::self-assessment
`
          unit.selfAssessment.questions.forEach((q, index) => {
            markdown += `**Question ${index + 1}:** ${q.question}
`
            if (q.type === "text" || q.type === "essay") {
              markdown += `[text-entry]

`
            } else if (q.type === "multiple-choice" && q.options) {
              q.options.forEach((option, i) => {
                markdown += `${String.fromCharCode(97 + i)}) ${option}
`
              })
              markdown += `
`
            }
          })
          markdown += `:::

`
        }

        // Add tutor-marked if exists
        if (unit.tutorMarked && unit.tutorMarked.questions.length > 0) {
          markdown += `:::tutor-marked
`
          unit.tutorMarked.questions.forEach((q, index) => {
            markdown += `**Assignment ${index + 1}:** ${q.question}
`
            markdown += `[essay]

`
          })
          markdown += `:::

`
        }
      })
    })

    return markdown
  }

  const handleAssessmentClick = (type: "self" | "tutor", assessment: any) => {
    setSelectedAssessment({ type, assessment })
    setAssessmentModalOpen(true)
  }

  // Function to render full unit content including assessments
  const renderFullUnitContent = (unit: ModuleUnit) => {
    let fullContent = unit.content

    // Add self-assessment syntax if exists
    if (unit.selfAssessment && unit.selfAssessment.questions.length > 0) {
      fullContent += `

:::self-assessment
`
      unit.selfAssessment.questions.forEach((q, index) => {
        fullContent += `**Question ${index + 1}:** ${q.question}
`
        if (q.type === "text" || q.type === "essay") {
          fullContent += `[text-entry]

`
        } else if (q.type === "multiple-choice" && q.options) {
          q.options.forEach((option, i) => {
            fullContent += `${String.fromCharCode(97 + i)}) ${option}
`
          })
          fullContent += `
`
        }
      })
      fullContent += `:::
`
    }

    // Add tutor-marked syntax if exists
    if (unit.tutorMarked && unit.tutorMarked.questions.length > 0) {
      fullContent += `

:::tutor-marked
`
      unit.tutorMarked.questions.forEach((q, index) => {
        fullContent += `**Assignment ${index + 1}:** ${q.question}
`
        fullContent += `[essay]

`
      })
      fullContent += `:::
`
    }

    return fullContent
  }

  // Function to render content with video embeds
  const renderContentWithVideos = (content: string) => {
    const parts = content.split(/(__VIDEO_EMBED_[a-zA-Z0-9_-]+__)/g)

    return parts.map((part, index) => {
      const videoMatch = part.match(/__VIDEO_EMBED_([a-zA-Z0-9_-]+)__/)
      if (videoMatch) {
        const videoId = videoMatch[1]
        return <VideoEmbed key={index} videoId={videoId} />
      }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading course editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* VS Code Style Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Explorer
              </h2>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModuleDialog(true)}
                  className="h-5 w-5 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Add Module"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden h-5 w-5 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Course Title */}
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              {formData.title}
            </div>
          </div>

          {/* File Explorer */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2">
                {/* Full Markdown Editor Option */}
                <div
                  className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${
                    currentView === "fullMarkdown"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                  onClick={handleFullMarkdownView}
                >
                  <Code className="h-4 w-4 mr-2 flex-shrink-0 text-orange-500" />
                  <span className="truncate">markdown-editor.md</span>
                </div>

                {/* Modules and Units */}
                {moduleGroups.map((moduleGroup) => {
                  const isExpanded = expandedModules.has(moduleGroup.moduleNumber)

                  return (
                    <div key={moduleGroup.moduleNumber} className="mt-1">
                      {/* Module Folder */}
                      <div className="flex items-center group">
                        <div
                          className="flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 flex-1 min-w-0"
                          onClick={() => toggleModuleExpansion(moduleGroup.moduleNumber)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 mr-1 flex-shrink-0 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0 text-gray-500" />
                          )}
                          {isExpanded ? (
                            <FolderOpen className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                          ) : (
                            <Folder className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                          )}
                          <span className="truncate text-gray-700 dark:text-gray-300">
                            module-{moduleGroup.moduleNumber}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                            {moduleGroup.units.length}
                          </span>
                        </div>

                        {isExpanded && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0 mr-1"
                            onClick={() => {
                              setSelectedModuleForUnit(moduleGroup.moduleNumber)
                              setShowAddUnitDialog(true)
                            }}
                            title="Add Unit"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* Units */}
                      {isExpanded && (
                        <div className="ml-4">
                          {moduleGroup.units.map((unit) => {
                            const isCurrent =
                              selectedUnit?.module === unit.module &&
                              selectedUnit?.unit === unit.unit &&
                              currentView === "unit"

                            return (
                              <div key={`${unit.module}-${unit.unit}`} className="flex items-center group">
                                <div
                                  className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 flex-1 min-w-0 ${
                                    isCurrent
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                  onClick={() => handleUnitChange(unit)}
                                >
                                  <File className="h-3 w-3 mr-2 flex-shrink-0 text-gray-500" />
                                  <span className="truncate text-xs">
                                    unit-{unit.unit}-{unit.title.toLowerCase().replace(/\s+/g, "-")}.md
                                  </span>
                                  <div className="flex items-center space-x-1 ml-auto flex-shrink-0">
                                    {unit.selfAssessment && unit.selfAssessment.questions.length > 0 && (
                                      <div className="w-1 h-1 bg-blue-500 rounded-full" title="Self Assessment" />
                                    )}
                                    {unit.tutorMarked && unit.tutorMarked.questions.length > 0 && (
                                      <div className="w-1 h-1 bg-purple-500 rounded-full" title="Tutor Assignment" />
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 flex-shrink-0 mr-1"
                                  onClick={() => deleteUnit(unit.module, unit.unit)}
                                  title="Delete Unit"
                                >
                                  <Trash2 className="h-2 w-2" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {moduleGroups.length === 0 && (
                  <div className="text-center py-8">
                    <Folder className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-2">No modules found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 bg-transparent"
                      onClick={() => setShowAddModuleDialog(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Module
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Quick Insert Panel - Fixed at Bottom */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="mb-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Quick Insert
              </h3>
              <div className="grid grid-cols-2 gap-1">
                {quickInsertSnippets.slice(0, 6).map((snippet) => {
                  const Icon = snippet.icon
                  return (
                    <Button
                      key={snippet.name}
                      variant="ghost"
                      size="sm"
                      onClick={() => insertSnippet(snippet.snippet)}
                      className="h-8 px-2 text-xs justify-start bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                      title={snippet.description}
                    >
                      <Icon className="h-3 w-3 mr-1 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="truncate text-purple-700 dark:text-purple-300">
                        {snippet.name.split(" ")[0]}
                      </span>
                    </Button>
                  )
                })}
              </div>

              {/* Show More Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs h-6 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  // Show all snippets in a dropdown or modal
                  const remainingSnippets = quickInsertSnippets.slice(6)
                  if (remainingSnippets.length > 0) {
                    // For now, just show the first remaining snippet
                    insertSnippet(remainingSnippets[0].snippet)
                  }
                }}
              >
                <Zap className="h-3 w-3 mr-1" />
                More Snippets
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Collapsible Header with Hover */}
        <div
          ref={headerRef}
          className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 z-10 ${
            headerCollapsed && !headerHovered ? "transform -translate-y-full" : "transform translate-y-0"
          }`}
          onMouseEnter={() => setHeaderHovered(true)}
          onMouseLeave={() => setHeaderHovered(false)}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  {editingTitle ? (
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="text-xl font-bold"
                      onBlur={() => setEditingTitle(false)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{formData.title}</h1>
                      <Button variant="ghost" size="sm" onClick={() => setEditingTitle(true)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Save Status Indicator */}
                {saveStatus === "success" && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Saved</span>
                  </div>
                )}
                {saveStatus === "error" && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Error</span>
                  </div>
                )}

                <Button variant="outline" onClick={() => router.push("/admin/courses")}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={currentView === "unit" && unitEditMode ? handleSaveUnit : handleSaveCourse}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : currentView === "unit" && unitEditMode ? "Save Unit" : "Save Course"}
                </Button>
              </div>
            </div>

            {/* Course metadata - Only show when not collapsed or when hovered */}
            {(!headerCollapsed || headerHovered) && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Slug:</span>
                  {editingSlug ? (
                    <Input
                      value={formData.slug}
                      onChange={(e) => handleInputChange("slug", e.target.value)}
                      className="text-sm"
                      onBlur={() => setEditingSlug(false)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingSlug(false)}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{formData.slug || "No slug"}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setEditingSlug(true)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Description:</span>
                  {editingDescription ? (
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="text-sm"
                      onBlur={() => setEditingDescription(false)}
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formData.description || "No description"}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setEditingDescription(true)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div ref={mainContentRef} className="flex-1 overflow-auto p-6">
          {currentView === "fullMarkdown" ? (
            /* Full Markdown Editor Panel */
            <div className="max-w-6xl mx-auto">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">Full Markdown Editor</CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">Edit the complete markdown content for this course</p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    ref={textareaRef}
                    value={formData.markdown}
                    onChange={(e) => handleInputChange("markdown", e.target.value)}
                    placeholder="Write your course content in Markdown..."
                    rows={30}
                    className="font-mono text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    <p className="mb-1">
                      <strong>Tip:</strong> Changes will be reflected live in the sidebar structure.
                    </p>
                    <p>
                      <strong>Video syntax:</strong> :::video followed by YouTube URL on next line, then :::
                    </p>
                    <p>
                      <strong>Assessment syntax:</strong> :::self-assessment or :::tutor-marked blocks
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : selectedUnit && selectedUnit.content ? (
            /* Individual Unit View */
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      {unitEditMode ? (
                        <Input
                          value={unitTitle}
                          onChange={(e) => setUnitTitle(e.target.value)}
                          className="text-2xl font-bold mb-2"
                          placeholder="Unit title..."
                        />
                      ) : (
                        <CardTitle className="text-2xl text-gray-900 dark:text-white">{selectedUnit.title}</CardTitle>
                      )}
                      <p className="text-gray-600 dark:text-gray-300">
                        Module {selectedUnit.module} • Unit {selectedUnit.unit}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={unitEditMode ? "default" : "outline"}
                        onClick={() => setUnitEditMode(!unitEditMode)}
                        size="sm"
                      >
                        {unitEditMode ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {unitEditMode ? (
                    <div className="space-y-4">
                      <Textarea
                        ref={unitTextareaRef}
                        value={unitContent}
                        onChange={(e) => setUnitContent(e.target.value)}
                        placeholder="Write your unit content in Markdown..."
                        rows={20}
                        className="font-mono text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p className="mb-1">
                          <strong>Tip:</strong> Use Markdown syntax for formatting. Quick insert buttons are available
                          in the sidebar.
                        </p>
                        <p>
                          <strong>Video syntax:</strong> :::video followed by YouTube URL on next line, then :::
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {renderContentWithVideos(renderFullUnitContent(selectedUnit))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assessment Buttons - Show for both edit and preview modes */}
              {(selectedUnit.selfAssessment?.questions.length > 0 ||
                selectedUnit.tutorMarked?.questions.length > 0 ||
                livePreviewUnit?.selfAssessment?.questions.length > 0 ||
                livePreviewUnit?.tutorMarked?.questions.length > 0) && (
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      Assessments {unitEditMode && livePreviewUnit ? "(Live Preview)" : "(Read-Only)"}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300">
                      {unitEditMode && livePreviewUnit
                        ? "Preview assessments as you type - changes are not saved until you click Save Unit"
                        : "View the assessments for this unit"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Use live preview unit if in edit mode, otherwise use selected unit */}
                      {((unitEditMode && livePreviewUnit?.selfAssessment?.questions.length > 0) ||
                        (!unitEditMode && selectedUnit.selfAssessment?.questions.length > 0)) && (
                        <Button
                          onClick={() =>
                            handleAssessmentClick(
                              "self",
                              unitEditMode && livePreviewUnit
                                ? livePreviewUnit.selfAssessment
                                : selectedUnit.selfAssessment,
                            )
                          }
                          variant="outline"
                          className="flex-1 rounded-lg"
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          View Self Assessment
                          {unitEditMode && livePreviewUnit && (
                            <Badge variant="secondary" className="ml-2">
                              {livePreviewUnit.selfAssessment?.questions.length || 0}
                            </Badge>
                          )}
                          {!unitEditMode && (
                            <Badge variant="secondary" className="ml-2">
                              {selectedUnit.selfAssessment?.questions.length || 0}
                            </Badge>
                          )}
                        </Button>
                      )}

                      {((unitEditMode && livePreviewUnit?.tutorMarked?.questions.length > 0) ||
                        (!unitEditMode && selectedUnit.tutorMarked?.questions.length > 0)) && (
                        <Button
                          onClick={() =>
                            handleAssessmentClick(
                              "tutor",
                              unitEditMode && livePreviewUnit ? livePreviewUnit.tutorMarked : selectedUnit.tutorMarked,
                            )
                          }
                          variant="outline"
                          className="flex-1 rounded-lg"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Tutor Assignment
                          {unitEditMode && livePreviewUnit && (
                            <Badge variant="secondary" className="ml-2">
                              {livePreviewUnit.tutorMarked?.questions.length || 0}
                            </Badge>
                          )}
                          {!unitEditMode && (
                            <Badge variant="secondary" className="ml-2">
                              {selectedUnit.tutorMarked?.questions.length || 0}
                            </Badge>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* No Content Selected */
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <File className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Content Selected</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Select a unit from the sidebar to view its content, or use the full markdown editor.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Module Dialog */}
      <Dialog open={showAddModuleDialog} onOpenChange={setShowAddModuleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
            <DialogDescription>Create a new module for your course</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moduleTitle">Module Title</Label>
              <Input
                id="moduleTitle"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Enter module title"
                onKeyDown={(e) => e.key === "Enter" && addNewModule()}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddModuleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addNewModule} disabled={!newModuleTitle.trim()}>
                Add Module
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Unit Dialog */}
      <Dialog open={showAddUnitDialog} onOpenChange={setShowAddUnitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
            <DialogDescription>Add a new unit to Module {selectedModuleForUnit}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitTitle">Unit Title</Label>
              <Input
                id="unitTitle"
                value={newUnitTitle}
                onChange={(e) => setNewUnitTitle(e.target.value)}
                placeholder="Enter unit title"
                onKeyDown={(e) => e.key === "Enter" && addNewUnit()}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddUnitDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addNewUnit} disabled={!newUnitTitle.trim()}>
                Add Unit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Read-Only Assessment Modal */}
      {selectedAssessment && (
        <Dialog open={assessmentModalOpen} onOpenChange={setAssessmentModalOpen}>
          <DialogContent className="sm:max-w-4xl bg-white/90 dark:bg-black/90 backdrop-blur-md border-0 rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-xl text-gray-900 dark:text-white">
                {selectedAssessment.type === "self" ? (
                  <PenTool className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileText className="h-5 w-5 text-purple-500" />
                )}
                <span>
                  {selectedAssessment.type === "self" ? "Self Assessment" : "Tutor Marked Assignment"}
                  {unitEditMode && livePreviewUnit ? " (Live Preview)" : " (Read-Only)"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                {unitEditMode && livePreviewUnit
                  ? "Live preview of assessment questions - changes reflect as you type in the editor"
                  : "Preview of the assessment questions - editing is disabled for admin view"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedAssessment.assessment?.questions?.map((question: any, index: number) => (
                <Card
                  key={question.id || index}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <CardHeader>
                    <CardTitle className="text-base text-gray-900 dark:text-white">Question {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300">{question.question}</p>
                    {question.options && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Options:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          {question.options.map((option: string, i: number) => (
                            <li key={i}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">Type: {question.type}</div>
                  </CardContent>
                </Card>
              ))}

              {(!selectedAssessment.assessment?.questions || selectedAssessment.assessment.questions.length === 0) && (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No questions found in this assessment</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button variant="outline" onClick={() => setAssessmentModalOpen(false)} className="rounded-lg">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
