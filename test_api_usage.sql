-- First, get an existing user ID
SELECT id FROM auth.users LIMIT 1;

-- Then test the increment_api_usage function with that user ID
-- Replace the UUID below with the ID from the previous query
-- SELECT increment_api_usage(
--   'REPLACE_WITH_ACTUAL_USER_ID'::uuid, 
--   'javascript'
-- );

-- Verify the result
-- SELECT * FROM api_usage 
-- WHERE user_id = 'REPLACE_WITH_ACTUAL_USER_ID'; 

-- Test the increment_api_usage function
SELECT increment_api_usage(
  '989603a1-3333-4268-92bb-634ea069043d'::uuid, 
  'javascript'
);

-- Verify the result
SELECT * FROM api_usage 
WHERE user_id = '989603a1-3333-4268-92bb-634ea069043d'; 