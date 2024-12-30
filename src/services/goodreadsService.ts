import { Book } from '../types/book';
import { supabase } from './supabase';

export const goodreadsService = {
  fetchUserBooks: async (profileUrl: string): Promise<Book[]> => {
    const { data, error } = await supabase.functions.invoke('goodreads-books', {
      method: 'POST',
      body: { profileUrl }
    });

    if (error) throw error;
    if (!data?.books) throw new Error('Failed to fetch books');
    
    return data.books;
  }
};
