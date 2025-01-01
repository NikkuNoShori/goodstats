export interface ApiUsage {
  user_id: string;
  api_type: 'javascript' | 'screenshots' | 'storage' | 'leads';
  calls_made: number;
  last_call_at: string;
  created_at: string;
  updated_at: string;
}

export interface SyncStatus {
  last_sync: string | null;
  total_books: number;
  sync_in_progress: boolean;
}

export interface CrawlbaseAnalytics {
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