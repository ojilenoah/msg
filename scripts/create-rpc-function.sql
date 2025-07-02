-- Create RPC function to get all users (since we can't directly query auth.users from client)
create or replace function get_all_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  raw_user_meta_data jsonb
)
language sql
security definer
as $$
  select 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
  from auth.users
  order by created_at desc;
$$;
