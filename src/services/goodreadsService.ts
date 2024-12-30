import { supabase } from './supabase';
import { userService } from './userService';
import { env } from '../config/env';
import type { Book } from './supabase';

export const goodreadsService = {
  initializeAuth: async (): Promise<string> => {
    const response = await fetch('/.netlify/functions/goodreads-auth', {
      headers: {
        'x-goodreads-key': env.goodreads.apiKey,
        'x-callback-url': env.goodreads.callbackUrl,
      },
    });
    const data = await response.json();
    localStorage.setItem('goodreads_request_token', data.token);
    return data.redirectUrl;
  },

  completeAuth: async (oauthToken: string, oauthVerifier: string) => {
    // Exchange tokens using Netlify function
    const response = await fetch('/.netlify/functions/goodreads-callback', {
      method: 'POST',
      body: JSON.stringify({ oauthToken, oauthVerifier })
    });
    const data = await response.json();

    // Update user profile with Goodreads tokens
    await userService.updateProfile({
      goodreads_id: data.goodreadsId,
      goodreads_token: data.accessToken,
      goodreads_refresh_token: data.refreshToken,
      goodreads_token_expiry: Date.now() + data.expiresIn * 1000
    });

    return data;
  },

  getUserBooks: async (): Promise<Book[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('date_read', { ascending: false });

    if (error) throw error;
    return data;
  },

  syncBooks: async () => {
    // Implement book sync logic here
    // This would fetch books from Goodreads and store them in Supabase
  },

  startSync: async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: syncId } = await supabase.rpc('start_book_sync', {
      p_user_id: user.id
    });

    return syncId;
  },

  updateSyncProgress: async (
    syncId: string,
    processed: number,
    total: number,
    currentPage: number,
    totalPages: number,
    status: string
  ) => {
    await supabase.rpc('update_sync_progress', {
      p_sync_id: syncId,
      p_processed_books: processed,
      p_total_books: total,
      p_current_page: currentPage,
      p_total_pages: totalPages,
      p_status: status
    });
  }
}; 