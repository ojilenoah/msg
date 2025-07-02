"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Star, FileText, PenTool, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface AssessmentQuestion {
  id: string
  question: string
  type: "text" | "essay" | "multiple-choice" | "checkbox" | "rating"
  options?: string[]
}

interface Assessment {
  type: "self" | "tutor"
  questions: AssessmentQuestion[]
}

interface AssessmentModalProps {
  open: boolean
  onClose: () => void
  type: "self" | "tutor"
  assessment: Assessment
  courseId: string
  moduleNumber: number
  unitNumber: number
  userId: string
  onComplete: () => void
}

export function AssessmentModal({
  open,
  onClose,
  type,
  assessment,
  courseId,
  moduleNumber,
  unitNumber,
  userId,
  onComplete,
}: AssessmentModalProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (open) {
      loadExistingAnswers()
    }
  }, [open])

  const getUnitKey = () => `${moduleNumber}_${unitNumber}`

  const loadExistingAnswers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("student_course_progress_ultra")
        .select("self_assessment_answers, tutor_marked_answers, self_assessments_completed, tutor_marked_completed")
        .eq("student_id", userId)
        .eq("course_id", courseId)
        .maybeSingle()

      if (data) {
        const unitKey = getUnitKey()

        // Get answers for this specific assessment type and unit
        let existingAnswers = {}
        let isCompleted = false

        if (type === "self") {
          existingAnswers = data.self_assessment_answers?.[unitKey] || {}
          isCompleted = data.self_assessments_completed?.[unitKey] || false
        } else {
          existingAnswers = data.tutor_marked_answers?.[unitKey] || {}
          isCompleted = data.tutor_marked_completed?.[unitKey] || false
        }

        setAnswers(existingAnswers)
        setCompleted(isCompleted)
      }
    } catch (error) {
      console.error("Error loading existing answers:", error)
      setAnswers({})
      setCompleted(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const unitKey = getUnitKey()

      // Get existing progress data
      const { data: existingData } = await supabase
        .from("student_course_progress_ultra")
        .select("*")
        .eq("student_id", userId)
        .eq("course_id", courseId)
        .maybeSingle()

      // Prepare the updated data
      const updatedData: any = {
        last_updated: new Date().toISOString(),
      }

      if (type === "self") {
        // Update self assessment answers and completion
        const currentSelfAnswers = existingData?.self_assessment_answers || {}
        const currentSelfCompleted = existingData?.self_assessments_completed || {}

        updatedData.self_assessment_answers = {
          ...currentSelfAnswers,
          [unitKey]: answers,
        }

        updatedData.self_assessments_completed = {
          ...currentSelfCompleted,
          [unitKey]: true,
        }

        // Also update units_progress to mark unit as having self assessment completed
        const currentUnitsProgress = existingData?.units_progress || {}
        updatedData.units_progress = {
          ...currentUnitsProgress,
          [unitKey]: {
            ...currentUnitsProgress[unitKey],
            self_assessment_completed: true,
            completed: true, // Auto-complete unit when self assessment is done
          },
        }
      } else {
        // Update tutor marked answers and completion
        const currentTutorAnswers = existingData?.tutor_marked_answers || {}
        const currentTutorCompleted = existingData?.tutor_marked_completed || {}

        updatedData.tutor_marked_answers = {
          ...currentTutorAnswers,
          [unitKey]: answers,
        }

        updatedData.tutor_marked_completed = {
          ...currentTutorCompleted,
          [unitKey]: true,
        }

        // Also update units_progress to mark unit as having tutor assignment completed
        const currentUnitsProgress = existingData?.units_progress || {}
        updatedData.units_progress = {
          ...currentUnitsProgress,
          [unitKey]: {
            ...currentUnitsProgress[unitKey],
            tutor_marked_completed: true,
          },
        }
      }

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from("student_course_progress_ultra")
          .update(updatedData)
          .eq("student_id", userId)
          .eq("course_id", courseId)

        if (error) throw error
      } else {
        // Insert new record
        const { error } = await supabase.from("student_course_progress_ultra").insert({
          student_id: userId,
          course_id: courseId,
          ...updatedData,
        })

        if (error) throw error
      }

      setCompleted(true)

      // Close modal after a short delay
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (error) {
      console.error("Error submitting assessment:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderQuestion = (question: AssessmentQuestion) => {
    const currentAnswer = answers[question.id] || ""

    switch (question.type) {
      case "text":
        return (
          <Input
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Your answer..."
            className="bg-white/60 dark:bg-black/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-lg"
          />
        )

      case "essay":
        return (
          <Textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your detailed response here..."
            rows={8}
            className="bg-white/60 dark:bg-black/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-lg"
          />
        )

      case "multiple-choice":
        return (
          <RadioGroup
            value={currentAnswer}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="text-gray-700 dark:text-gray-300 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const isChecked = Array.isArray(currentAnswer) && currentAnswer.includes(option)
              return (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentArray = Array.isArray(currentAnswer) ? currentAnswer : []
                      if (checked) {
                        handleAnswerChange(question.id, [...currentArray, option])
                      } else {
                        handleAnswerChange(
                          question.id,
                          currentArray.filter((item: string) => item !== option),
                        )
                      }
                    }}
                  />
                  <Label
                    htmlFor={`${question.id}-${index}`}
                    className="text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              )
            })}
          </div>
        )

      case "rating":
        return (
          <RadioGroup
            value={currentAnswer?.toString() || ""}
            onValueChange={(value) => handleAnswerChange(question.id, Number.parseInt(value))}
            className="flex space-x-4"
          >
            {[1, 2, 3, 4, 5].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <RadioGroupItem value={rating.toString()} id={`${question.id}-rating-${rating}`} />
                <Label htmlFor={`${question.id}-rating-${rating}`} className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{rating}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      default:
        return null
    }
  }

  const isAnswered = assessment.questions.every((q) => {
    const answer = answers[q.id]
    if (q.type === "checkbox") {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== undefined && answer !== ""
  })

  const getIcon = () => {
    if (type === "self") {
      return <PenTool className="h-5 w-5 text-blue-500" />
    }
    return <FileText className="h-5 w-5 text-purple-500" />
  }

  const getTitle = () => {
    if (type === "self") {
      return "Self Assessment"
    }
    return "Tutor Marked Assignment"
  }

  const getDescription = () => {
    if (type === "self") {
      return "Test your understanding of this unit"
    }
    return "Submit your work for tutor review and feedback"
  }

  const getBorderColor = () => {
    if (type === "self") {
      return "border-blue-200 dark:border-blue-800"
    }
    return "border-purple-200 dark:border-purple-800"
  }

  const getBackgroundColor = () => {
    if (type === "self") {
      return "bg-blue-50/50 dark:bg-blue-900/20"
    }
    return "bg-purple-50/50 dark:bg-purple-900/20"
  }

  if (completed) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-md border-0 rounded-xl">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {type === "self" ? "Assessment Completed!" : "Assignment Submitted!"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {type === "self"
                ? "Your responses have been saved and you can review them anytime."
                : "Your assignment has been submitted for tutor review."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white/90 dark:bg-black/90 backdrop-blur-md border-0 rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-gray-900 dark:text-white">
            {getIcon()}
            <span>{getTitle()}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {assessment.questions?.map((question, index) => (
            <Card
              key={question.id}
              className={`${getBackgroundColor()} ${getBorderColor()} backdrop-blur-sm border shadow-sm rounded-lg`}
            >
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-white">Question {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">{question.question}</p>
                {renderQuestion(question)}
              </CardContent>
            </Card>
          ))}

          {assessment.questions.length === 0 && (
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>No questions found in this assessment block.</span>
            </div>
          )}
        </div>

        {assessment.questions.length > 0 && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button variant="outline" onClick={onClose} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !isAnswered}
              className={`rounded-lg ${
                type === "self"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              } text-white`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : type === "self" ? (
                "Submit Assessment"
              ) : (
                "Submit Assignment"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
