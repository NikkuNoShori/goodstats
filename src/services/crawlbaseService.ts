import { supabase } from './supabase';

export type CrawlbaseTokenType = 'javascript' | 'screenshots' | 'storage' | 'leads';

interface CrawlbaseAnalytics {
  javascript: {
    total_calls: number;
    remaining_calls: number;
    last_call: string | null;
  };
  screenshots: {
    total_calls: number;
    remaining_calls: number;
    last_call: string | null;
  };
  storage: {
    total_calls: number;
    remaining_calls: number;
    last_call: string | null;
  };
  leads: {
    total_calls: number;
    remaining_calls: number;
    last_call: string | null;
  };
}

class CrawlbaseService {
  async checkUsageLimit(userId: string, tokenType: CrawlbaseTokenType): Promise<boolean> {
    const { data: usage, error } = await supabase
      .from('api_usage')
      .select('calls_made')
      .eq('user_id', userId)
      .eq('token_type', tokenType)
      .single();

    if (error) {
      console.error('Error checking API usage:', error);
      return false;
    }

    // Allow up to 100 calls per user
    return !usage || usage.calls_made < 100;
  }

  async incrementUsage(userId: string, tokenType: CrawlbaseTokenType): Promise<void> {
    const { error } = await supabase.rpc('increment_api_usage', {
      p_user_id: userId,
      p_token_type: tokenType
    });

    if (error) {
      console.error('Error incrementing API usage:', error);
      throw new Error('Failed to update API usage count');
    }
  }

  async getAnalytics(): Promise<CrawlbaseAnalytics> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Not authenticated');
    }

    const { data: isAdmin } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!isAdmin?.is_admin) {
      throw new Error('Unauthorized');
    }

    const response = await fetch('/api/crawlbase-analytics', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return response.json();
  }
}

export const crawlbaseService = new CrawlbaseService(); 