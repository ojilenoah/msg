interface Assessment {
  type: "self" | "tutor"
  questions: Array<{
    id: string
    question: string
    type: "text" | "essay" | "multiple-choice" | "checkbox" | "rating"
    options?: string[]
  }>
}

interface VideoBlock {
  type: "video"
  url: string
}

export interface ModuleUnit {
  module: number
  unit: number
  title: string
  content: string
  selfAssessment?: Assessment
  tutorMarked?: Assessment
}

export function parseMarkdownToModules(markdown: string): ModuleUnit[] {
  if (!markdown || markdown.trim() === "") {
    return []
  }

  console.log("Parsing markdown:", markdown.substring(0, 500) + "...")

  const modules: ModuleUnit[] = []

  try {
    // Parse structured format with modules and units
    const structuredModules = parseStructuredMarkdown(markdown)
    if (structuredModules.length > 0) {
      console.log("Found structured modules:", structuredModules.length)
      return structuredModules
    }

    // Fallback: treat the entire markdown as a single unit
    console.log("Using fallback parsing - treating as single unit")
    return parseFallbackMarkdown(markdown)
  } catch (error) {
    console.error("Error parsing markdown:", error)
    // Ultimate fallback
    return [
      {
        module: 1,
        unit: 1,
        title: "Course Content",
        content: markdown,
      },
    ]
  }
}

function parseStructuredMarkdown(markdown: string): ModuleUnit[] {
  const modules: ModuleUnit[] = []

  // Split by Module headers - handle "# Module 1: Title" format
  const modulePattern = /^# Module (\d+):\s*(.+)$/gm
  const moduleMatches = Array.from(markdown.matchAll(modulePattern))

  if (moduleMatches.length === 0) {
    return []
  }

  // Process each module
  for (let i = 0; i < moduleMatches.length; i++) {
    const currentMatch = moduleMatches[i]
    const nextMatch = moduleMatches[i + 1]
    const moduleNumber = Number.parseInt(currentMatch[1])
    const moduleTitle = currentMatch[2]

    const startIndex = currentMatch.index! + currentMatch[0].length
    const endIndex = nextMatch ? nextMatch.index! : markdown.length
    const moduleContent = markdown.substring(startIndex, endIndex).trim()

    if (moduleContent) {
      // Parse units within this module
      const units = parseUnitsInModule(moduleContent, moduleNumber, moduleTitle)
      modules.push(...units)
    }
  }

  return modules
}

function parseUnitsInModule(moduleContent: string, moduleNumber: number, moduleTitle: string): ModuleUnit[] {
  const units: ModuleUnit[] = []

  // Split by Unit headers - handle "## Unit 1: Title" format
  const unitPattern = /^## Unit (\d+):\s*(.+)$/gm
  const unitMatches = Array.from(moduleContent.matchAll(unitPattern))

  if (unitMatches.length === 0) {
    // No units found, treat entire module as one unit
    const { content, selfAssessment, tutorMarked } = parseUnitContent(moduleContent)

    units.push({
      module: moduleNumber,
      unit: 1,
      title: moduleTitle,
      content,
      selfAssessment,
      tutorMarked,
    })
    return units
  }

  // Process each unit
  for (let i = 0; i < unitMatches.length; i++) {
    const currentMatch = unitMatches[i]
    const nextMatch = unitMatches[i + 1]
    const unitNumber = Number.parseInt(currentMatch[1])
    const unitTitle = currentMatch[2]

    const startIndex = currentMatch.index! + currentMatch[0].length
    const endIndex = nextMatch ? nextMatch.index! : moduleContent.length
    let unitContent = moduleContent.substring(startIndex, endIndex).trim()

    // Check if this is the last unit and if there's a tutor-marked assessment after all units
    if (i === unitMatches.length - 1) {
      // Look for tutor-marked assessment section after the last unit
      const tutorAssessmentPattern = /^## Tutor-Marked Assessment\s*$/gm
      const tutorMatch = moduleContent.match(tutorAssessmentPattern)
      if (tutorMatch) {
        const tutorIndex = moduleContent.indexOf(tutorMatch[0])
        if (tutorIndex > startIndex) {
          // Include the tutor assessment in the last unit
          unitContent = moduleContent.substring(startIndex).trim()
        }
      }
    }

    if (unitContent) {
      const { content, selfAssessment, tutorMarked } = parseUnitContent(unitContent)

      units.push({
        module: moduleNumber,
        unit: unitNumber,
        title: unitTitle,
        content,
        selfAssessment,
        tutorMarked,
      })
    }
  }

  return units
}

function parseFallbackMarkdown(markdown: string): ModuleUnit[] {
  const { content, selfAssessment, tutorMarked } = parseUnitContent(markdown)
  return [
    {
      module: 1,
      unit: 1,
      title: "Course Content",
      content,
      selfAssessment,
      tutorMarked,
    },
  ]
}

function parseUnitContent(content: string): {
  content: string
  selfAssessment?: Assessment
  tutorMarked?: Assessment
} {
  let cleanContent = content
  let selfAssessment: Assessment | undefined
  let tutorMarked: Assessment | undefined

  console.log("Parsing unit content for assessments...")

  // Extract self-assessment blocks using the ::: format
  const selfAssessmentPattern = /:::self-assessment\s*\n([\s\S]*?)\n:::/gi
  const selfAssessmentMatches = Array.from(content.matchAll(selfAssessmentPattern))

  if (selfAssessmentMatches.length > 0) {
    console.log("Found self-assessment blocks:", selfAssessmentMatches.length)
    const allSelfQuestions: Assessment["questions"] = []

    selfAssessmentMatches.forEach((match, index) => {
      const assessmentContent = match[1].trim()
      const questions = parseAssessmentContent(assessmentContent, "self", index)
      allSelfQuestions.push(...questions)
      // Remove the assessment block from content
      cleanContent = cleanContent.replace(match[0], "")
    })

    if (allSelfQuestions.length > 0) {
      selfAssessment = {
        type: "self",
        questions: allSelfQuestions,
      }
    }
  }

  // Extract tutor-marked assessment blocks using the ::: format
  const tutorMarkedPattern = /:::tutor-marked\s*\n([\s\S]*?)\n:::/gi
  const tutorMarkedMatches = Array.from(content.matchAll(tutorMarkedPattern))

  if (tutorMarkedMatches.length > 0) {
    console.log("Found tutor-marked blocks:", tutorMarkedMatches.length)
    const allTutorQuestions: Assessment["questions"] = []

    tutorMarkedMatches.forEach((match, index) => {
      const assessmentContent = match[1].trim()
      const questions = parseAssessmentContent(assessmentContent, "tutor", index)
      allTutorQuestions.push(...questions)
      // Remove the assessment block from content
      cleanContent = cleanContent.replace(match[0], "")
    })

    if (allTutorQuestions.length > 0) {
      tutorMarked = {
        type: "tutor",
        questions: allTutorQuestions,
      }
    }
  }

  // Extract video blocks using the ::: format
  const videoPattern =
    /:::video\s*\n(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+)(?:\S*)?\s*\n:::/gi
  const videoMatches = Array.from(content.matchAll(videoPattern))

  if (videoMatches.length > 0) {
    console.log("Found video blocks:", videoMatches.length)
    videoMatches.forEach((match) => {
      const videoUrl = match[1].trim()
      // Convert YouTube URL to embed format
      const videoId = extractYouTubeId(videoUrl)
      if (videoId) {
        // Use a special marker that we'll replace in the React component
        const videoMarker = `__VIDEO_EMBED_${videoId}__`
        // Replace the video block with the marker
        cleanContent = cleanContent.replace(match[0], videoMarker)
      }
    })
  }

  // Look for standalone tutor-marked assessment section
  if (!tutorMarked) {
    const tutorAssessmentPattern = /^## Tutor-Marked Assessment\s*$([\s\S]*?)(?=^##|^#|$)/gm
    const tutorMatch = content.match(tutorAssessmentPattern)

    if (tutorMatch) {
      console.log("Found standalone tutor-marked assessment section")
      tutorMarked = {
        type: "tutor",
        questions: [
          {
            id: "assignment1",
            question:
              "Complete the practical assignment for this module. Demonstrate your understanding by creating a working example that incorporates the concepts learned.",
            type: "essay",
          },
        ],
      }
      // Remove the tutor assessment section from content
      cleanContent = cleanContent.replace(tutorMatch[0], "")
    }
  }

  // Remove completion criteria and other non-content sections
  cleanContent = cleanContent
    .replace(/^## Completion Criteria[\s\S]*?(?=^##|^#|$)/gm, "")
    .replace(/^---\s*$/gm, "")
    .trim()

  console.log("Assessment parsing results:", {
    hasSelfAssessment: !!selfAssessment,
    hasTutorMarked: !!tutorMarked,
    selfQuestions: selfAssessment?.questions.length || 0,
    tutorQuestions: tutorMarked?.questions.length || 0,
  })

  return {
    content: cleanContent,
    selfAssessment,
    tutorMarked,
  }
}

function parseAssessmentContent(content: string, type: "self" | "tutor", blockIndex: number): Assessment["questions"] {
  const questions: Assessment["questions"] = []

  // Split by question patterns
  const questionPatterns = [
    /\*\*Question \d+:\*\*([\s\S]*?)(?=\*\*Question \d+:\*\*|$)/gi,
    /\*\*Essay Question:\*\*([\s\S]*?)(?=\*\*|$)/gi,
  ]

  let foundQuestions = false

  for (const pattern of questionPatterns) {
    const matches = Array.from(content.matchAll(pattern))
    if (matches.length > 0) {
      foundQuestions = true
      matches.forEach((match, index) => {
        const questionContent = match[1].trim()
        const question = parseIndividualQuestion(questionContent, type, `${type}_${blockIndex}_q${index + 1}`)
        if (question) {
          questions.push(question)
        }
      })
      break
    }
  }

  // If no structured questions found, treat the entire content as one question
  if (!foundQuestions && content.trim()) {
    const question = parseIndividualQuestion(content, type, `${type}_${blockIndex}_q1`)
    if (question) {
      questions.push(question)
    }
  }

  return questions
}

function parseIndividualQuestion(
  questionContent: string,
  type: "self" | "tutor",
  id: string,
): Assessment["questions"][0] | null {
  if (!questionContent.trim()) return null

  // Extract the main question text (everything before [text-entry] or [checkbox])
  let questionText = questionContent
    .replace(/\[text-entry\]/gi, "")
    .replace(/\[checkbox\]/gi, "")
    .trim()

  // Remove leading asterisks and clean up
  questionText = questionText.replace(/^\*+\s*/, "").trim()

  // Determine question type based on content
  let questionType: "text" | "essay" | "multiple-choice" | "checkbox" | "rating" = "text"
  let options: string[] | undefined

  if (questionContent.includes("[text-entry]")) {
    questionType = type === "tutor" ? "essay" : "text"
  } else if (questionContent.includes("[checkbox]")) {
    questionType = "checkbox"
    // Extract options (lines starting with -)
    const lines = questionContent.split("\n")
    options = lines
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.trim().substring(1).trim())
      .filter((option) => option.length > 0)
  } else if (questionContent.toLowerCase().includes("essay")) {
    questionType = "essay"
  } else if (questionContent.toLowerCase().includes("choose") || questionContent.toLowerCase().includes("select")) {
    // Check if it has multiple choice options (a), b), c), etc.)
    const lines = questionContent.split("\n")
    const mcOptions = lines
      .filter((line) => /^[a-dA-D][).]\s/.test(line.trim()))
      .map((line) => line.replace(/^[a-dA-D][).]\s*/, "").trim())

    if (mcOptions.length > 0) {
      questionType = "multiple-choice"
      options = mcOptions
    } else {
      // Check for dash-separated options
      const dashOptions = lines
        .filter((line) => line.trim().startsWith("-"))
        .map((line) => line.trim().substring(1).trim())
        .filter((option) => option.length > 0)

      if (dashOptions.length > 0) {
        questionType = "checkbox"
        options = dashOptions
      }
    }
  }

  return {
    id,
    question: questionText,
    type: questionType,
    options: options && options.length > 0 ? options : undefined,
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, /youtube\.com\/embed\/([^&\n?#]+)/]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}
