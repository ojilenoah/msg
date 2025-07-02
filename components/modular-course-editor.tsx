"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BookOpen,
  FileText,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  PenTool,
  Video,
  Code,
  Plus,
  Trash2,
  Eye,
  Upload,
} from "lucide-react"
import { parseMarkdownToModules, type ModuleUnit } from "@/lib/markdown-parser"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Course {
  id: string
  title: string
  slug: string
  description: string
  markdown: string
  created_at: string
}

interface ModularCourseEditorProps {
  course: Course
  onSave: (courseData: Partial<Course>) => void
  onCancel: () => void
}

interface ModuleGroup {
  moduleNumber: number
  units: ModuleUnit[]
}

interface UnitContent {
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
      options?: string[]
    }>
  }
}

// Custom component for rendering videos in preview
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

export function ModularCourseEditor({ course, onSave, onCancel }: ModularCourseEditorProps) {
  const [formData, setFormData] = useState({
    title: course.title,
    slug: course.slug,
    description: course.description,
  })

  const [modules, setModules] = useState<ModuleUnit[]>([])
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())
  const [selectedUnit, setSelectedUnit] = useState<UnitContent | null>(null)
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor")

  // Unit content state
  const [unitContent, setUnitContent] = useState("")
  const [unitTitle, setUnitTitle] = useState("")

  // Dialog states
  const [showAddModuleDialog, setShowAddModuleDialog] = useState(false)
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newUnitTitle, setNewUnitTitle] = useState("")
  const [selectedModuleForUnit, setSelectedModuleForUnit] = useState<number>(1)

  useEffect(() => {
    // Parse existing markdown content
    if (course.markdown) {
      const parsedModules = parseMarkdownToModules(course.markdown)
      setModules(parsedModules)
      updateModuleGroups(parsedModules)
    }

    // Auto-generate slug from title
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [course.markdown, formData.title])

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
      if (grouped[0].units.length > 0 && !selectedUnit) {
        selectUnit(grouped[0].units[0])
      }
    }
  }

  const selectUnit = (unit: ModuleUnit) => {
    const unitData: UnitContent = {
      module: unit.module,
      unit: unit.unit,
      title: unit.title,
      content: unit.content,
      selfAssessment: unit.selfAssessment,
      tutorMarked: unit.tutorMarked,
    }

    setSelectedUnit(unitData)
    setUnitTitle(unit.title)
    setUnitContent(unit.content)
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

  const addNewModule = () => {
    if (!newModuleTitle.trim()) return

    const nextModuleNumber = Math.max(...moduleGroups.map((g) => g.moduleNumber), 0) + 1

    // Create a new unit for this module
    const newUnit: ModuleUnit = {
      module: nextModuleNumber,
      unit: 1,
      title: "Introduction",
      content: `Welcome to ${newModuleTitle}!\n\nAdd your content here...`,
    }

    const updatedModules = [...modules, newUnit]
    setModules(updatedModules)
    updateModuleGroups(updatedModules)

    setNewModuleTitle("")
    setShowAddModuleDialog(false)

    // Auto-expand the new module and select its first unit
    setExpandedModules((prev) => new Set([...prev, nextModuleNumber]))
    selectUnit(newUnit)
  }

  const addNewUnit = () => {
    if (!newUnitTitle.trim() || !selectedModuleForUnit) return

    const moduleUnits = modules.filter((m) => m.module === selectedModuleForUnit)
    const nextUnitNumber = Math.max(...moduleUnits.map((u) => u.unit), 0) + 1

    const newUnit: ModuleUnit = {
      module: selectedModuleForUnit,
      unit: nextUnitNumber,
      title: newUnitTitle,
      content: `# ${newUnitTitle}\n\nAdd your content here...`,
    }

    const updatedModules = [...modules, newUnit]
    setModules(updatedModules)
    updateModuleGroups(updatedModules)

    setNewUnitTitle("")
    setShowAddUnitDialog(false)

    // Auto-expand the module and select the new unit
    setExpandedModules((prev) => new Set([...prev, selectedModuleForUnit]))
    selectUnit(newUnit)
  }

  const saveUnitContent = () => {
    if (!selectedUnit) return

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

    setModules(updatedModules)
    updateModuleGroups(updatedModules)

    // Update selected unit
    setSelectedUnit((prev) => (prev ? { ...prev, title: unitTitle, content: unitContent } : null))
  }

  const deleteUnit = (moduleNum: number, unitNum: number) => {
    if (!confirm("Are you sure you want to delete this unit?")) return

    const updatedModules = modules.filter((unit) => !(unit.module === moduleNum && unit.unit === unitNum))

    setModules(updatedModules)
    updateModuleGroups(updatedModules)

    // Clear selection if deleted unit was selected
    if (selectedUnit?.module === moduleNum && selectedUnit?.unit === unitNum) {
      setSelectedUnit(null)
      setUnitContent("")
      setUnitTitle("")
    }
  }

  const generateMarkdown = () => {
    let markdown = ""

    moduleGroups.forEach((moduleGroup) => {
      // Find module title from first unit
      const firstUnit = moduleGroup.units[0]
      if (firstUnit) {
        markdown += `# Module ${moduleGroup.moduleNumber}: ${firstUnit.title.includes("Module") ? firstUnit.title.split(":")[1]?.trim() || "Module Title" : "Module Title"}\n\n`
      }

      moduleGroup.units.forEach((unit) => {
        markdown += `## Unit ${unit.unit}: ${unit.title}\n\n`
        markdown += `${unit.content}\n\n`

        // Add self-assessment if exists
        if (unit.selfAssessment && unit.selfAssessment.questions.length > 0) {
          markdown += `:::self-assessment\n`
          unit.selfAssessment.questions.forEach((q, index) => {
            markdown += `**Question ${index + 1}:** ${q.question}\n`
            if (q.type === "text" || q.type === "essay") {
              markdown += `[text-entry]\n\n`
            } else if (q.type === "multiple-choice" && q.options) {
              q.options.forEach((option, i) => {
                markdown += `${String.fromCharCode(97 + i)}) ${option}\n`
              })
              markdown += `\n`
            }
          })
          markdown += `:::\n\n`
        }

        // Add tutor-marked if exists
        if (unit.tutorMarked && unit.tutorMarked.questions.length > 0) {
          markdown += `:::tutor-marked\n`
          unit.tutorMarked.questions.forEach((q, index) => {
            markdown += `**Assignment ${index + 1}:** ${q.question}\n`
            markdown += `[essay]\n\n`
          })
          markdown += `:::\n\n`
        }
      })
    })

    return markdown
  }

  const handlePublish = () => {
    // Save current unit content first
    saveUnitContent()

    // Generate complete markdown
    const completeMarkdown = generateMarkdown()

    // Save course with generated markdown
    onSave({
      ...formData,
      markdown: completeMarkdown,
    })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                {course.id ? "Edit Course" : "Create New Course"}
              </CardTitle>
              <CardDescription>Design and structure your course content modularly</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
                <Upload className="h-4 w-4 mr-2" />
                Publish Course
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter course title"
                className="bg-white dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Course Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="course-slug"
                className="bg-white dark:bg-gray-700"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Course Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter course description"
              rows={3}
              className="bg-white dark:bg-gray-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Course Structure */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Course Structure
                </CardTitle>
                <div className="flex space-x-1">
                  <Dialog open={showAddModuleDialog} onOpenChange={setShowAddModuleDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowAddModuleDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addNewModule}>Add Module</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {moduleGroups.map((moduleGroup) => {
                const isExpanded = expandedModules.has(moduleGroup.moduleNumber)

                return (
                  <div key={moduleGroup.moduleNumber}>
                    {/* Module Header */}
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center space-x-1 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group flex-1"
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
                        <span className="text-xs text-gray-500 dark:text-gray-400">{moduleGroup.units.length}</span>
                      </div>

                      {isExpanded && (
                        <Dialog open={showAddUnitDialog} onOpenChange={setShowAddUnitDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setSelectedModuleForUnit(moduleGroup.moduleNumber)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
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
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setShowAddUnitDialog(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={addNewUnit}>Add Unit</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {/* Units */}
                    {isExpanded && (
                      <div className="ml-4 space-y-1">
                        {moduleGroup.units.map((unit) => {
                          const isCurrent = selectedUnit?.module === unit.module && selectedUnit?.unit === unit.unit

                          return (
                            <div
                              key={`${unit.module}-${unit.unit}`}
                              className={`flex items-center justify-between group ${
                                isCurrent
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
                              } rounded px-2 py-1`}
                            >
                              <div
                                className="flex items-center space-x-2 cursor-pointer flex-1"
                                onClick={() => selectUnit(unit)}
                              >
                                <File className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                <span className="text-xs text-gray-900 dark:text-white truncate">
                                  Unit {unit.unit}: {unit.title}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {unit.selfAssessment && unit.selfAssessment.questions.length > 0 && (
                                    <PenTool className="h-2 w-2 text-blue-500" />
                                  )}
                                  {unit.tutorMarked && unit.tutorMarked.questions.length > 0 && (
                                    <FileText className="h-2 w-2 text-purple-500" />
                                  )}
                                  {unit.content.includes("__VIDEO_EMBED_") && (
                                    <Video className="h-2 w-2 text-red-500" />
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                                onClick={() => deleteUnit(unit.module, unit.unit)}
                              >
                                <Trash2 className="h-3 w-3" />
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
                <div className="text-center py-4">
                  <BookOpen className="h-6 w-6 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">No modules yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-transparent"
                    onClick={() => setShowAddModuleDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Module
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Editor Area */}
        <div className="lg:col-span-3">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">
                    {selectedUnit ? `Module ${selectedUnit.module} - Unit ${selectedUnit.unit}` : "Unit Editor"}
                  </CardTitle>
                  {selectedUnit && <CardDescription>Editing: {selectedUnit.title}</CardDescription>}
                </div>
                <div className="flex items-center space-x-2">
                  {selectedUnit && (
                    <Button onClick={saveUnitContent} size="sm" variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Save Unit
                    </Button>
                  )}
                  <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "editor" | "preview")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="editor" className="flex items-center space-x-2">
                        <Code className="h-4 w-4" />
                        <span>Editor</span>
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>Preview</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedUnit ? (
                <>
                  {activeView === "editor" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="unitTitle">Unit Title</Label>
                        <Input
                          id="unitTitle"
                          value={unitTitle}
                          onChange={(e) => setUnitTitle(e.target.value)}
                          placeholder="Enter unit title"
                          className="bg-white dark:bg-gray-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unitContent">Unit Content (Markdown)</Label>
                        <Textarea
                          id="unitContent"
                          value={unitContent}
                          onChange={(e) => setUnitContent(e.target.value)}
                          placeholder="Write your unit content in Markdown..."
                          rows={20}
                          className="font-mono text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p className="mb-1">
                          <strong>Tip:</strong> Use Markdown syntax for formatting.
                        </p>
                        <p>
                          <strong>Video syntax:</strong> :::video followed by YouTube URL on next line, then :::
                        </p>
                        <p>
                          <strong>Assessment syntax:</strong> :::self-assessment or :::tutor-marked blocks
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 min-h-96 max-h-96 overflow-y-auto">
                      <div className="space-y-6">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{unitTitle}</h1>
                          <Badge variant="secondary">
                            Module {selectedUnit.module} • Unit {selectedUnit.unit}
                          </Badge>
                        </div>
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                          {renderContentWithVideos(unitContent)}
                        </div>

                        {/* Show assessments in preview */}
                        {selectedUnit.selfAssessment && selectedUnit.selfAssessment.questions.length > 0 && (
                          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <CardHeader>
                              <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                                <PenTool className="h-5 w-5" />
                                <span>Self Assessment</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {selectedUnit.selfAssessment.questions.map((question, index) => (
                                  <div key={question.id} className="space-y-2">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      Question {index + 1}: {question.question}
                                    </p>
                                    {question.options && (
                                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                                        {question.options.map((option, i) => (
                                          <li key={i}>{option}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {selectedUnit.tutorMarked && selectedUnit.tutorMarked.questions.length > 0 && (
                          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                            <CardHeader>
                              <CardTitle className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
                                <FileText className="h-5 w-5" />
                                <span>Tutor Marked Assignment</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {selectedUnit.tutorMarked.questions.map((question, index) => (
                                  <div key={question.id} className="space-y-2">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      Assignment {index + 1}: {question.question}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <File className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Unit Selected</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Select a unit from the sidebar to start editing, or create a new module.
                    </p>
                    <Button onClick={() => setShowAddModuleDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Module
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
