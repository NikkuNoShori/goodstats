import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xkwndhfbyxzxmcfxfacx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrd25kaGZieXh6eG1jZnhmYWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1ODIyOTQsImV4cCI6MjA1MTE1ODI5NH0.9EnDwh_F0Q3hKFJcq_uSojQzL5kd5edJ3GHBRJFe348'
);

async function getCurrentUser() {
  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session Error:', sessionError.message);
    return;
  }

  if (!session) {
    console.log('No active session. Please sign in first.');
    return;
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Profile Error:', profileError.message);
    return;
  }

  console.log('User ID:', profile.id);
  console.log('Email:', profile.email);
  console.log('Current Role:', profile.role);
  
  // Print the SQL command to make this user an admin
  console.log('\nTo make this user an admin, run this SQL command in Supabase:');
  console.log(`update profiles set role = 'admin' where id = '${profile.id}';`);
}

getCurrentUser(); 