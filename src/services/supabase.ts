import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Add proper types for Supabase tables
export interface Profile {
  id: string;
  email: string;
  goodreads_id?: string;
  goodreads_token?: string;
  goodreads_refresh_token?: string;
  goodreads_token_expiry?: number;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  goodreads_id: string;
  title: string;
  author: string;
  isbn?: string;
  isbn13?: string;
  rating?: number;
  date_read?: string;
  date_started?: string;
  shelves?: string[];
  page_count?: number;
  format?: string;
  publisher?: string;
  published_date?: string;
  genres?: string[];
  description?: string;
  cover_image?: string;
  link?: string;
  created_at: string;
  updated_at: string;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
