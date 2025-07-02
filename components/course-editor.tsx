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
  Monitor,
  Code,
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

interface CourseEditorProps {
  course: Course
  onSave: (courseData: Partial<Course>) => void
  onCancel: () => void
}

interface ModuleGroup {
  moduleNumber: number
  units: ModuleUnit[]
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

export function CourseEditor({ course, onSave, onCancel }: CourseEditorProps) {
  const [formData, setFormData] = useState({
    title: course.title,
    slug: course.slug,
    description: course.description,
    markdown: course.markdown,
  })
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor")
  const [modules, setModules] = useState<ModuleUnit[]>([])
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())
  const [selectedUnit, setSelectedUnit] = useState<ModuleUnit | null>(null)

  useEffect(() => {
    // Parse markdown and update sidebar
    const parsedModules = parseMarkdownToModules(formData.markdown)
    setModules(parsedModules)

    // Group modules
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
      if (grouped[0].units.length > 0) {
        setSelectedUnit(grouped[0].units[0])
      }
    }

    // Auto-generate slug from title
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.markdown, formData.title])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(formData)
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

  const insertTemplate = (template: string) => {
    const templates = {
      module: `\n# Module X: Module Title\n\n## Unit 1: Unit Title\n\nContent goes here...\n\n`,
      unit: `\n## Unit X: Unit Title\n\nContent goes here...\n\n`,
      selfAssessment: `\n:::self-assessment\n**Question 1:** What did you learn in this unit?\n[text-entry]\n\n**Question 2:** Rate your understanding (1-5)\n[rating]\n:::\n\n`,
      tutorAssessment: `\n:::tutor-marked\n**Assignment:** Complete the practical exercise for this module.\n[essay]\n:::\n\n`,
      video: `\n:::video\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\n:::\n\n`,
    }

    const newMarkdown = formData.markdown + templates[template as keyof typeof templates]
    handleInputChange("markdown", newMarkdown)
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
              <CardDescription>Design and structure your course content</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Course
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
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Course Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {moduleGroups.map((moduleGroup) => {
                const isExpanded = expandedModules.has(moduleGroup.moduleNumber)

                return (
                  <div key={moduleGroup.moduleNumber}>
                    {/* Module Header */}
                    <div
                      className="flex items-center space-x-1 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group"
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

                    {/* Units */}
                    {isExpanded && (
                      <div className="ml-4 space-y-1">
                        {moduleGroup.units.map((unit) => {
                          const isCurrent = selectedUnit?.module === unit.module && selectedUnit?.unit === unit.unit

                          return (
                            <div
                              key={`${unit.module}-${unit.unit}`}
                              className={`flex items-center space-x-2 py-1 px-2 rounded cursor-pointer group ${
                                isCurrent
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                              onClick={() => setSelectedUnit(unit)}
                            >
                              <File className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                              <span className="text-xs text-gray-900 dark:text-white flex-1 truncate">
                                Unit {unit.unit}: {unit.title}
                              </span>
                              <div className="flex items-center space-x-1">
                                {unit.selfAssessment && unit.selfAssessment.questions.length > 0 && (
                                  <PenTool className="h-2 w-2 text-blue-500" />
                                )}
                                {unit.tutorMarked && unit.tutorMarked.questions.length > 0 && (
                                  <FileText className="h-2 w-2 text-purple-500" />
                                )}
                                {unit.content.includes("__VIDEO_EMBED_") && <Video className="h-2 w-2 text-red-500" />}
                              </div>
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Insert Templates */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Quick Insert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertTemplate("module")}
                className="w-full justify-start text-xs"
              >
                <Folder className="h-3 w-3 mr-2" />
                Module
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertTemplate("unit")}
                className="w-full justify-start text-xs"
              >
                <File className="h-3 w-3 mr-2" />
                Unit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertTemplate("selfAssessment")}
                className="w-full justify-start text-xs"
              >
                <PenTool className="h-3 w-3 mr-2" />
                Self Assessment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertTemplate("tutorAssessment")}
                className="w-full justify-start text-xs"
              >
                <FileText className="h-3 w-3 mr-2" />
                Tutor Assignment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertTemplate("video")}
                className="w-full justify-start text-xs"
              >
                <Video className="h-3 w-3 mr-2" />
                YouTube Video
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Editor Area */}
        <div className="lg:col-span-3">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white">Course Content</CardTitle>
                <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "editor" | "preview")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editor" className="flex items-center space-x-2">
                      <Code className="h-4 w-4" />
                      <span>Editor</span>
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span>Preview</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {activeView === "editor" ? (
                <div className="space-y-4">
                  <Textarea
                    value={formData.markdown}
                    onChange={(e) => handleInputChange("markdown", e.target.value)}
                    placeholder="Write your course content in Markdown..."
                    rows={20}
                    className="font-mono text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p className="mb-1">
                      <strong>Tip:</strong> Use the quick insert buttons to add structured content.
                    </p>
                    <p>
                      <strong>Video syntax:</strong> :::video followed by YouTube URL on next line, then :::
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 min-h-96 max-h-96 overflow-y-auto">
                  {selectedUnit ? (
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedUnit.title}</h1>
                        <Badge variant="secondary">
                          Module {selectedUnit.module} • Unit {selectedUnit.unit}
                        </Badge>
                      </div>
                      <div className="prose prose-lg dark:prose-invert max-w-none">
                        {renderContentWithVideos(selectedUnit.content)}
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {renderContentWithVideos(formData.markdown)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
