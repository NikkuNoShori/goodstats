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