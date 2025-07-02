-- Drop the old table and recreate with better structure
DROP TABLE IF EXISTS student_course_progress;

-- Create new efficient table structure
CREATE TABLE IF NOT EXISTS student_course_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Store all assessment answers in structured JSONB
    -- Format: { "module_unit": { "self_assessment": {...}, "tutor_marked": {...} } }
    assessment_answers jsonb DEFAULT '{}'::jsonb,
    
    -- Store completion status for each unit
    -- Format: { "module_unit": { "unit_completed": true, "self_completed": true, "tutor_completed": true } }
    completion_status jsonb DEFAULT '{}'::jsonb,
    
    -- Overall course progress
    last_accessed_module int DEFAULT 1,
    last_accessed_unit int DEFAULT 1,
    course_completed_at timestamptz,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Ensure one row per student per course
    UNIQUE(student_id, course_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_course_progress_student_id 
ON student_course_progress (student_id);

CREATE INDEX IF NOT EXISTS idx_student_course_progress_course_id 
ON student_course_progress (course_id);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_student_course_progress_assessment_answers 
ON student_course_progress USING GIN (assessment_answers);

CREATE INDEX IF NOT EXISTS idx_student_course_progress_completion_status 
ON student_course_progress USING GIN (completion_status);
