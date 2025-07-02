-- Create the new unified student_course_progress_ultra table
create table if not exists student_course_progress_ultra (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references auth.users(id) on delete cascade,
    course_id uuid references courses(id) on delete cascade,
    modules_completed int[] default '{}', -- array of completed module numbers
    units_progress jsonb default '{}'::jsonb, -- stores answers & progress per unit
    self_assessment_answers jsonb default '{}'::jsonb, -- all self-assessment answers for entire course
    tutor_marked_answers jsonb default '{}'::jsonb, -- all tutor-marked answers for entire course
    self_assessments_completed jsonb default '{}'::jsonb, -- track completed units
    tutor_marked_completed jsonb default '{}'::jsonb, -- track completed units
    course_completed boolean default false,
    last_updated timestamptz default now(),
    
    -- Ensure one row per student per course
    unique(student_id, course_id)
);

-- Create indexes for performance
create index if not exists idx_student_course_progress_ultra_student_id
on student_course_progress_ultra (student_id);

create index if not exists idx_student_course_progress_ultra_course_id
on student_course_progress_ultra (course_id);

-- GIN indexes for JSONB queries
create index if not exists idx_student_course_progress_ultra_units_progress
on student_course_progress_ultra using gin (units_progress);

create index if not exists idx_student_course_progress_ultra_self_assessment_answers
on student_course_progress_ultra using gin (self_assessment_answers);

create index if not exists idx_student_course_progress_ultra_tutor_marked_answers
on student_course_progress_ultra using gin (tutor_marked_answers);

create index if not exists idx_student_course_progress_ultra_self_assessments_completed
on student_course_progress_ultra using gin (self_assessments_completed);

create index if not exists idx_student_course_progress_ultra_tutor_marked_completed
on student_course_progress_ultra using gin (tutor_marked_completed);
