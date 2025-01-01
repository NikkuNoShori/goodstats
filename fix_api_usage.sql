-- Check if the table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'api_usage'
) as table_exists;

-- Get current column names
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'api_usage';

-- Add token_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'api_usage' 
    AND column_name = 'token_type'
  ) THEN
    ALTER TABLE api_usage 
    ADD COLUMN token_type TEXT;
  END IF;
END $$;

-- If there's an existing api_type column, copy data and drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'api_usage' 
    AND column_name = 'api_type'
  ) THEN
    -- Copy data from api_type to token_type
    UPDATE api_usage 
    SET token_type = api_type;
    
    -- Drop the old column
    ALTER TABLE api_usage 
    DROP COLUMN api_type;
  END IF;
END $$;

-- Make token_type NOT NULL
ALTER TABLE api_usage 
ALTER COLUMN token_type SET NOT NULL;

-- Recreate the unique constraint
ALTER TABLE api_usage 
DROP CONSTRAINT IF EXISTS api_usage_user_id_token_type_key;

ALTER TABLE api_usage 
ADD CONSTRAINT api_usage_user_id_token_type_key 
UNIQUE (user_id, token_type);

-- Recreate the index
DROP INDEX IF EXISTS idx_api_usage_user_token;
CREATE INDEX idx_api_usage_user_token 
ON api_usage(user_id, token_type);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'api_usage'; 

-- Create function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id UUID, p_token_type TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO api_usage (user_id, token_type, calls_made, last_call_at)
  VALUES (p_user_id, p_token_type, 1, NOW())
  ON CONFLICT (user_id, token_type)
  DO UPDATE SET
    calls_made = api_usage.calls_made + 1,
    last_call_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 