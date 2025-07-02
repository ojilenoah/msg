"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, BookOpen, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const markdownReference = `# LMS Markdown Reference Guide

This comprehensive guide outlines all supported Markdown syntax for creating course content in the LMS platform.

## Table of Contents

1. [Course Structure](#course-structure)
2. [Text Formatting](#text-formatting)
3. [Lists and Tables](#lists-and-tables)
4. [Media Elements](#media-elements)
5. [Assessment Blocks](#assessment-blocks)
6. [Code and Math](#code-and-math)
7. [Special Elements](#special-elements)

---

## Course Structure

### Module Headers
Use level 1 headings to define course modules:

\`\`\`markdown
# Module 1: Introduction to Programming
# Module 2: Data Structures
# Module 3: Algorithms
\`\`\`

### Unit Headers
Use level 2 headings to define units within modules:

\`\`\`markdown
## Unit 1: Variables and Data Types
## Unit 2: Control Structures
## Unit 3: Functions
\`\`\`

### Section Headers
Use level 3-6 headings for subsections:

\`\`\`markdown
### Learning Objectives
#### Key Concepts
##### Important Notes
###### Additional Resources
\`\`\`

---

## Text Formatting

### Basic Formatting
- **Bold text**: \`**bold**\` or \`__bold__\`
- *Italic text*: \`*italic*\` or \`_italic_\`
- ***Bold and italic***: \`***bold italic***\`
- ~~Strikethrough~~: \`~~strikethrough~~\`
- \`Inline code\`: \`\\\`inline code\\\`\`

### Paragraphs and Line Breaks
- Separate paragraphs with blank lines
- Use two spaces at the end of a line for a line break

### Blockquotes
Use \`>\` for blockquotes:

\`\`\`markdown
> This is a blockquote
> It can span multiple lines
> 
> > Nested blockquotes are also supported
\`\`\`

---

## Lists and Tables

### Unordered Lists
\`\`\`markdown
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3
\`\`\`

### Ordered Lists
\`\`\`markdown
1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item
\`\`\`

### Task Lists
\`\`\`markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another incomplete task
\`\`\`

### Tables
\`\`\`markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
\`\`\`

---

## Media Elements

### Images
\`\`\`markdown
![Alt text](image-url.jpg)
![Alt text](image-url.jpg "Optional title")
\`\`\`

### Links
\`\`\`markdown
[Link text](https://example.com)
[Link with title](https://example.com "Link title")
\`\`\`

### Video Embeds
Use the special video block syntax for YouTube videos:

\`\`\`markdown
:::video
https://www.youtube.com/watch?v=VIDEO_ID
:::
\`\`\`

**Supported video formats:**
- YouTube URLs (watch?v= or youtu.be/)
- The system automatically extracts the video ID

---

## Assessment Blocks

### Self-Assessment Questions
Use the \`:::self-assessment\` block for interactive quizzes:

\`\`\`markdown
:::self-assessment
**Question 1:** What is the capital of France?
a) London
b) Berlin
c) Paris
d) Madrid

**Question 2:** Explain the concept of variables in programming.
[text-entry]

**Question 3:** Which of the following are programming languages? (Select all that apply)
[checkbox]
- Python
- HTML
- JavaScript
- CSS
- Java
:::
\`\`\`

**Question Types:**
- **Multiple Choice**: Use a), b), c), d) format
- **Text Entry**: Use \`[text-entry]\` for short answers
- **Essay**: Use \`[essay]\` for long-form responses
- **Checkbox**: Use \`[checkbox]\` followed by list items

### Tutor-Marked Assessments
Use the \`:::tutor-marked\` block for assignments requiring manual grading:

\`\`\`markdown
:::tutor-marked
**Assignment:** Create a simple calculator program

Requirements:
- Implement basic arithmetic operations (+, -, *, /)
- Handle user input validation
- Provide clear error messages
- Include comments explaining your code

Submission format: Upload your .py file and a brief explanation document.

[essay]
:::
\`\`\`

---

## Code and Math

### Code Blocks
Use triple backticks with language specification:

\`\`\`markdown
\\\`\\\`\\\`python
def hello_world():
    print("Hello, World!")
    
hello_world()
\\\`\\\`\\\`
\`\`\`

**Supported languages:**
- python, javascript, java, c, cpp, html, css, sql, bash, json, xml, yaml

### Inline Code
Use single backticks for inline code: \`\\\`variable_name\\\`\`

### Math Expressions
Use LaTeX syntax for mathematical expressions:

\`\`\`markdown
Inline math: $E = mc^2$

Block math:
$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
\`\`\`

---

## Special Elements

### Horizontal Rules
Create horizontal dividers:

\`\`\`markdown
---
***
___
\`\`\`

### Escape Characters
Use backslash to escape special characters:

\`\`\`markdown
\\* Not italic \\*
\\# Not a header
\\\` Not code \\\`
\`\`\`

### HTML Elements
Limited HTML is supported for advanced formatting:

\`\`\`html
<div class="highlight">
  <p>This is a highlighted section</p>
</div>

<details>
  <summary>Click to expand</summary>
  <p>Hidden content here</p>
</details>
\`\`\`

---

## Best Practices

### Content Organization
1. **Use consistent heading hierarchy**: Start with Module (H1), then Unit (H2), then subsections (H3+)
2. **Keep paragraphs concise**: Aim for 3-4 sentences per paragraph
3. **Use lists for clarity**: Break down complex information into bullet points
4. **Include visual breaks**: Use horizontal rules to separate major sections

### Assessment Design
1. **Vary question types**: Mix multiple choice, text entry, and essay questions
2. **Provide clear instructions**: Explain what students need to do
3. **Use progressive difficulty**: Start with easier questions, build complexity
4. **Include feedback opportunities**: Use tutor-marked assignments for detailed feedback

### Media Integration
1. **Optimize images**: Use appropriate file sizes and formats
2. **Test video links**: Ensure YouTube URLs are accessible
3. **Provide alt text**: Always include descriptive alt text for images
4. **Consider accessibility**: Use clear, descriptive link text

### Code Examples
1. **Include complete examples**: Show full, working code snippets
2. **Add comments**: Explain complex logic within code blocks
3. **Use appropriate languages**: Specify the correct language for syntax highlighting
4. **Test code**: Ensure all code examples actually work

---

## Common Patterns

### Learning Module Template
\`\`\`markdown
# Module X: Module Title

## Unit 1: Introduction

### Learning Objectives
By the end of this unit, you will be able to:
- Objective 1
- Objective 2
- Objective 3

### Key Concepts
- Concept 1: Definition and explanation
- Concept 2: Definition and explanation

### Example
\\\`\\\`\\\`python
# Code example here
\\\`\\\`\\\`

### Practice Exercise
:::self-assessment
**Question 1:** Practice question here
[text-entry]
:::

## Unit 2: Advanced Topics

### Prerequisites
Before starting this unit, ensure you have completed:
- [ ] Unit 1: Introduction
- [ ] Previous module assessments

### Content continues...

### Assignment
:::tutor-marked
**Assignment:** Detailed assignment description

Requirements:
- Requirement 1
- Requirement 2

[essay]
:::
\`\`\`

---

## Troubleshooting

### Common Issues

**Videos not displaying:**
- Check YouTube URL format
- Ensure video is publicly accessible
- Use the exact \`:::video\` block syntax

**Assessments not working:**
- Verify block syntax with \`:::\` markers
- Check question formatting
- Ensure proper answer type indicators

**Code not highlighting:**
- Specify language after opening backticks
- Check for typos in language names
- Ensure proper closing of code blocks

**Math not rendering:**
- Use proper LaTeX syntax
- Escape special characters when needed
- Check for balanced delimiters

### Getting Help

If you encounter issues not covered in this guide:
1. Check the course editor preview
2. Validate your Markdown syntax
3. Contact technical support with specific error details

---

*This reference guide is regularly updated. Last updated: ${new Date().toLocaleDateString()}*`

export default function AdminReference() {
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  const copyToClipboard = async (text: string, snippetId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSnippet(snippetId)
      setTimeout(() => setCopiedSnippet(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const codeSnippets = [
    {
      id: "module-header",
      title: "Module Header",
      code: "# Module 1: Module Title",
    },
    {
      id: "unit-header",
      title: "Unit Header",
      code: "## Unit 1: Unit Title",
    },
    {
      id: "video-embed",
      title: "Video Embed",
      code: ":::video\nhttps://www.youtube.com/watch?v=VIDEO_ID\n:::",
    },
    {
      id: "self-assessment",
      title: "Self Assessment",
      code: `:::self-assessment
**Question 1:** Your question here?
a) Option A
b) Option B
c) Option C
d) Option D

**Question 2:** Text entry question?
[text-entry]
:::`,
    },
    {
      id: "tutor-marked",
      title: "Tutor Assignment",
      code: `:::tutor-marked
**Assignment:** Assignment description

Requirements:
- Requirement 1
- Requirement 2

[essay]
:::`,
    },
    {
      id: "code-block",
      title: "Code Block",
      code: "```python\ndef hello_world():\n    print('Hello, World!')\n```",
    },
  ]

  const filteredSnippets = codeSnippets.filter(
    (snippet) =>
      snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Markdown Reference</h1>
          <p className="text-gray-600 dark:text-gray-300">Complete guide to LMS Markdown syntax and features</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Reference Snippets */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl sticky top-4">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Quick Snippets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredSnippets.map((snippet) => (
                    <div key={snippet.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {snippet.title}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(snippet.code, snippet.id)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedSnippet === snippet.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        <code>{snippet.code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Documentation */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardContent className="p-8">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownReference}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
