-- Add unique constraint for the student_course_progress table
ALTER TABLE student_course_progress 
ADD CONSTRAINT unique_student_course_unit 
UNIQUE (student_id, course_id, module_number, unit_number);

-- Update the table to ensure we have proper constraints
-- This will allow upsert operations to work correctly
