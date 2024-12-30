import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xjqbvqhvxzytjqbzlqht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcWJ2cWh2eHp5dGpxYnpscWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM5NzU2NTAsImV4cCI6MjAxOTU1MTY1MH0.SvD8sWoPC0NfEPKjkaO4qFGYYX3BKEGauYmFxv1gPFc';

export const supabase = createClient(supabaseUrl, supabaseKey);
