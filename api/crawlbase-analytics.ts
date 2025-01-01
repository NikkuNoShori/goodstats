import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const CRAWLBASE_TOKENS = {
  javascript: process.env.CRAWLBASE_TOKEN,
  screenshots: process.env.CRAWLBASE_SCREENSHOTS_TOKEN,
  storage: process.env.CRAWLBASE_STORAGE_TOKEN,
  leads: process.env.CRAWLBASE_LEADS_TOKEN
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Fetch usage data for each token type
    const analytics = {
      javascript: { total_calls: 0, remaining_calls: 10000, last_call: null },
      screenshots: { total_calls: 0, remaining_calls: 10000, last_call: null },
      storage: { total_calls: 0, remaining_calls: 10000, last_call: null },
      leads: { total_calls: 0, remaining_calls: 10000, last_call: null }
    };

    // Get usage data from Supabase
    const { data: usageData } = await supabase
      .from('api_usage')
      .select('token_type, calls_count, last_call_at')
      .order('last_call_at', { ascending: false });

    if (usageData) {
      for (const usage of usageData) {
        const type = usage.token_type as keyof typeof analytics;
        if (analytics[type]) {
          analytics[type].total_calls = usage.calls_count;
          analytics[type].remaining_calls = 10000 - usage.calls_count;
          analytics[type].last_call = usage.last_call_at;
        }
      }
    }

    // For each token type, fetch current usage from Crawlbase API
    for (const [type, token] of Object.entries(CRAWLBASE_TOKENS)) {
      if (!token) continue;

      try {
        const response = await fetch(`https://api.crawlbase.com/stats?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          const typeKey = type as keyof typeof analytics;
          analytics[typeKey].total_calls = data.requests_made || analytics[typeKey].total_calls;
          analytics[typeKey].remaining_calls = data.remaining_requests || analytics[typeKey].remaining_calls;
        }
      } catch (err) {
        console.error(`Failed to fetch Crawlbase stats for ${type}:`, err);
      }
    }

    return res.status(200).json(analytics);
  } catch (err) {
    console.error('Error in crawlbase-analytics:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 