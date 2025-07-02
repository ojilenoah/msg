-- Insert admin user if it doesn't exist
-- This will be handled by the auth system, but we can set up the user metadata

-- Note: The actual user creation happens through Supabase Auth
-- This script is for reference - the admin user will be created when they first sign up
-- with email "admin@gmail.com" and password "adminpassword"

-- You can run this to ensure the admin user has the right metadata:
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'::jsonb
-- )
-- WHERE email = 'admin@gmail.com';
