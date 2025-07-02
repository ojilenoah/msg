# LMS Markdown Reference Guide

This guide outlines the complete syntax for creating course content in the MSGetsoplatform LMS. All content is written in Markdown with special extensions for educational features.

## Course Structure

### Modules
Modules are the top-level organizational units of a course. Each module should start with a level 1 heading:

\`\`\`markdown
# Module 1: Introduction to Programming
\`\`\`

**Syntax Rules:**
- Must start with \`# Module [number]: [title]\`
- Module numbers should be sequential (1, 2, 3, etc.)
- Title should be descriptive and concise

### Units
Units are subdivisions within modules. Each unit should start with a level 2 heading:

\`\`\`markdown
## Unit 1: Variables and Data Types
\`\`\`

**Syntax Rules:**
- Must start with \`## Unit [number]: [title]\`
- Unit numbers should be sequential within each module
- Units contain the main learning content

## Content Formatting

### Standard Markdown
All standard Markdown syntax is supported:

#### Headings
\`\`\`markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
\`\`\`

#### Text Formatting
\`\`\`markdown
**Bold text**
*Italic text*
***Bold and italic***
~~Strikethrough~~
\`Inline code\`
\`\`\`

#### Lists
\`\`\`markdown
- Unordered list item 1
- Unordered list item 2
  - Nested item
  - Another nested item

1. Ordered list item 1
2. Ordered list item 2
   1. Nested ordered item
   2. Another nested item
\`\`\`

#### Links and Images
\`\`\`markdown
[Link text](https://example.com)
![Image alt text](image-url.jpg)
\`\`\`

#### Code Blocks
\`\`\`markdown
\\\`\\\`\\\`javascript
function hello() {
    console.log("Hello, World!");
}
\\\`\\\`\\\`
\`\`\`

#### Tables
\`\`\`markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
\`\`\`

#### Blockquotes
\`\`\`markdown
> This is a blockquote
> It can span multiple lines
\`\`\`

## LMS-Specific Features

### Video Embeds
Embed YouTube videos using the video block syntax:

\`\`\`markdown
:::video
https://www.youtube.com/watch?v=VIDEO_ID
:::
\`\`\`

**Supported URL formats:**
- \`https://www.youtube.com/watch?v=VIDEO_ID\`
- \`https://youtu.be/VIDEO_ID\`
- \`https://www.youtube.com/embed/VIDEO_ID\`

**Example:**
\`\`\`markdown
:::video
https://www.youtube.com/watch?v=dQw4w9WgXcQ
:::
\`\`\`

### Self-Assessment Questions
Create interactive self-assessment questions that students can complete:

\`\`\`markdown
:::self-assessment
**Question 1:** What is the capital of France?
[text-entry]

**Question 2:** Which of the following are programming languages?
[checkbox]
- Python
- HTML
- JavaScript
- CSS

**Question 3:** What does HTML stand for?
a) Hypertext Markup Language
b) High Tech Modern Language
c) Home Tool Markup Language
d) Hyperlink and Text Markup Language
:::
\`\`\`

#### Question Types

##### Text Entry Questions
\`\`\`markdown
**Question:** Explain the concept of variables in programming.
[text-entry]
\`\`\`

##### Essay Questions
\`\`\`markdown
**Essay Question:** Discuss the importance of data structures in computer science.
[text-entry]
\`\`\`

##### Multiple Choice Questions
\`\`\`markdown
**Question:** Which of the following is a JavaScript framework?
a) React
b) Python
c) MySQL
d) CSS
\`\`\`

##### Checkbox Questions (Multiple Selection)
\`\`\`markdown
**Question:** Select all valid HTML tags:
[checkbox]
- \`<div>\`
- \`<span>\`
- \`<paragraph>\`
- \`<section>\`
\`\`\`

### Tutor-Marked Assessments
Create assignments that require tutor review and grading:

\`\`\`markdown
:::tutor-marked
**Assignment 1:** Create a simple calculator application using JavaScript.

Requirements:
- Implement basic arithmetic operations (+, -, *, /)
- Include a user interface
- Handle edge cases and errors
- Submit your code with documentation

[essay]
:::
\`\`\`

#### Assignment Types

##### Essay Assignments
\`\`\`markdown
:::tutor-marked
**Essay Assignment:** Write a 1000-word essay on the impact of artificial intelligence on modern society.
[essay]
:::
\`\`\`

##### Project Assignments
\`\`\`markdown
:::tutor-marked
**Project Assignment:** Build a responsive website using HTML, CSS, and JavaScript.

Deliverables:
1. Source code files
2. Live demo link
3. Documentation explaining your approach

[essay]
:::
\`\`\`

## Advanced Formatting

### Math Expressions
Use LaTeX syntax for mathematical expressions:

\`\`\`markdown
The quadratic formula is: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

Inline math: The value of $\\pi$ is approximately 3.14159.
\`\`\`

### Code Syntax Highlighting
Specify the language for proper syntax highlighting:

\`\`\`markdown
\\\`\\\`\\\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\\\`\\\`\\\`

\\\`\\\`\\\`sql
SELECT * FROM users WHERE age > 18;
\\\`\\\`\\\`

\\\`\\\`\\\`css
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}
\\\`\\\`\\\`
\`\`\`

### Callout Boxes
Create attention-grabbing callout boxes:

\`\`\`markdown
> **💡 Tip:** Always test your code before submitting assignments.

> **⚠️ Warning:** Be careful when working with user input to prevent security vulnerabilities.

> **📝 Note:** This concept will be important for the final exam.
\`\`\`

## Best Practices

### Content Organization
1. **Use clear, descriptive titles** for modules and units
2. **Break content into digestible chunks** using appropriate headings
3. **Include practical examples** for complex concepts
4. **Balance theory with hands-on practice**

### Assessment Design
1. **Mix question types** to test different skills
2. **Provide clear instructions** for assignments
3. **Include rubrics** for tutor-marked assessments
4. **Test self-assessments** before publishing

### Media Integration
1. **Use relevant videos** that enhance learning
2. **Ensure video quality** is appropriate for educational use
3. **Provide video transcripts** when possible for accessibility
4. **Keep videos focused** and reasonably short (5-15 minutes)

### Writing Style
1. **Use clear, concise language**
2. **Define technical terms** when first introduced
3. **Use active voice** when possible
4. **Include real-world examples** and applications

## Common Patterns

### Unit Structure Template
\`\`\`markdown
## Unit 1: Introduction to Variables

### Learning Objectives
By the end of this unit, you will be able to:
- Define what a variable is
- Create variables in JavaScript
- Understand different data types

### Content
Variables are containers for storing data values...

### Video Tutorial
:::video
https://www.youtube.com/watch?v=EXAMPLE_ID
:::

### Practice Exercise
:::self-assessment
**Question 1:** What keyword is used to declare a variable in JavaScript?
a) var
b) let
c) const
d) All of the above
:::

### Assignment
:::tutor-marked
**Assignment:** Create a JavaScript program that demonstrates the use of different variable types.
[essay]
:::
\`\`\`

### Assessment Block Template
\`\`\`markdown
:::self-assessment
**Question 1:** [Your question here]
[text-entry]

**Question 2:** [Multiple choice question]
a) Option A
b) Option B
c) Option C
d) Option D

**Question 3:** [Checkbox question]
[checkbox]
- Option 1
- Option 2
- Option 3
- Option 4
:::
\`\`\`

## Troubleshooting

### Common Issues

#### Video Not Displaying
- Ensure the YouTube URL is valid and public
- Check that the video block syntax is correct
- Verify there are no extra spaces or characters

#### Assessment Questions Not Parsing
- Ensure proper spacing around question blocks
- Check that question numbers are formatted correctly
- Verify that answer type indicators are spelled correctly

#### Module/Unit Structure Issues
- Ensure module and unit headers follow the exact format
- Check that numbers are sequential
- Verify there are no duplicate module/unit numbers

### Validation Tips
1. **Preview your content** regularly while editing
2. **Test all interactive elements** before publishing
3. **Check video embeds** to ensure they load properly
4. **Validate assessment questions** by taking them yourself

## Examples

### Complete Unit Example
\`\`\`markdown
# Module 1: Web Development Fundamentals

## Unit 1: Introduction to HTML

### What is HTML?
HTML (HyperText Markup Language) is the standard markup language for creating web pages.

### Basic HTML Structure
Every HTML document has a basic structure:

\\\`\\\`\\\`html
<!DOCTYPE html>
<html>
<head>
    <title>Page Title</title>
</head>
<body>
    <h1>My First Heading</h1>
    <p>My first paragraph.</p>
</body>
</html>
\\\`\\\`\\\`

### Video Tutorial
:::video
https://www.youtube.com/watch?v=UB1O30fR-EE
:::

### Self-Assessment
:::self-assessment
**Question 1:** What does HTML stand for?
[text-entry]

**Question 2:** Which HTML tag is used for the largest heading?
a) \`<h6>\`
b) \`<h1>\`
c) \`<header>\`
d) \`<title>\`

**Question 3:** Select all valid HTML tags:
[checkbox]
- \`<p>\`
- \`<div>\`
- \`<paragraph>\`
- \`<span>\`
:::

### Assignment
:::tutor-marked
**Assignment:** Create a personal webpage using HTML.

Requirements:
- Include a header with your name
- Add a paragraph about yourself
- Include at least one image
- Use proper HTML structure

Submit your HTML file and a screenshot of the rendered page.
[essay]
:::
\`\`\`

This reference guide covers all supported Markdown syntax and LMS-specific features. Use it as a reference while creating course content to ensure proper formatting and functionality.
\`\`\`

Perfect! I've implemented all the requested features:

## ✅ **Complete Markdown Reference System**

### 1. **Comprehensive Markdown Reference Document**
- ✅ **Complete syntax guide** covering all LMS-specific features
- ✅ **Module and Unit structure** with exact syntax requirements
- ✅ **Video embed syntax** with supported URL formats
- ✅ **Self-assessment questions** (text entry, multiple choice, checkbox)
- ✅ **Tutor-marked assessments** with essay and project formats
- ✅ **Advanced formatting** (math, code blocks, callouts)
- ✅ **Best practices** and troubleshooting tips
- ✅ **Complete examples** and templates

### 2. **New Admin Dashboard Tab**
- ✅ **"Markdown Reference" tab** added to admin sidebar
- ✅ **Two-tab interface**: Reference Guide and Quick Insert
- ✅ **Searchable snippet library** with copy functionality
- ✅ **Professional documentation layout** with proper styling

### 3. **Quick Insert Functionality in Editor**
- ✅ **Quick Insert panel** appears in sidebar when in full markdown mode
- ✅ **10 pre-built snippets** for common content blocks:
  - Module Header
  - Unit Header  
  - Video Embed
  - Self-Assessment (with multiple question types)
  - Tutor Assignment
  - Code Block
  - Lists (ordered/unordered)
  - Blockquote
  - Image

### 4. **Smart Insert Features**
- ✅ **Cursor position insertion** - snippets insert at current cursor location
- ✅ **Auto-focus return** to textarea after insertion
- ✅ **Collapsible panel** to save space when not needed
- ✅ **Visual indicators** with icons for each snippet type

### 5. **Enhanced User Experience**
- ✅ **Copy-to-clipboard** functionality in reference tab
- ✅ **Search functionality** for finding specific snippets
- ✅ **Visual feedback** with success indicators
- ✅ **Responsive design** that works on all screen sizes
- ✅ **Dark mode support** throughout

### 6. **Complete Documentation Coverage**
- ✅ **All LMS syntax** documented with examples
- ✅ **Troubleshooting section** for common issues
- ✅ **Best practices** for content creation
- ✅ **Template patterns** for consistent course structure

The system now provides comprehensive support for course creators with both detailed documentation and practical quick-insert tools to make content authoring faster and more consistent.
