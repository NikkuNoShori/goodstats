-- Add role column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create an index on the role column
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Make specific user an admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = '989603a1-3333-4268-92bb-634ea069043d';

-- Verify the update
SELECT id, email, role FROM profiles WHERE id = '989603a1-3333-4268-92bb-634ea069043d'; 