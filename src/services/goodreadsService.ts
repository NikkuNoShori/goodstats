import { Book, BookDetails } from '../types/book';
import client from './api/client';
import { userService } from './userService';

const API_KEY = import.meta.env.VITE_GOODREADS_API_KEY;
const API_SECRET = import.meta.env.VITE_GOODREADS_API_SECRET;
const CALLBACK_URL = import.meta.env.VITE_GOODREADS_CALLBACK_URL;

interface AuthResult {
  userId: string;
  goodreadsId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const goodreadsService = {
  initializeAuth: async (): Promise<string> => {
    // Goodreads OAuth 1.0a flow
    const response = await client.get('/oauth/request_token', {
      params: {
        oauth_callback: import.meta.env.VITE_GOODREADS_CALLBACK_URL
      }
    });

    // Store request token for later use
    localStorage.setItem('goodreads_request_token', response.data.oauth_token);
    
    // Return authorization URL
    return `https://www.goodreads.com/oauth/authorize?oauth_token=${response.data.oauth_token}`;
  },

  completeAuth: async (oauthToken: string, oauthVerifier: string): Promise<AuthResult> => {
    // Exchange request token for access token
    const requestToken = localStorage.getItem('goodreads_request_token');
    if (!requestToken || requestToken !== oauthToken) {
      throw new Error('Invalid OAuth token');
    }

    const response = await client.post('/oauth/access_token', {
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier
    });

    // Clean up request token
    localStorage.removeItem('goodreads_request_token');

    // Get user info
    const userResponse = await client.get('/api/auth_user', {
      headers: {
        Authorization: `Bearer ${response.data.access_token}`
      }
    });

    return {
      userId: userResponse.data.user.id,
      goodreadsId: userResponse.data.user.goodreads_id,
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  },

  refreshToken: async (refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> => {
    const response = await client.post('/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  },

  getUserBooks: async (): Promise<Book[]> => {
    const token = userService.getGoodreadsToken();
    if (!token) throw new Error('Not authenticated');

    try {
      const { data } = await client.get('/review/list', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          v: 2,
          shelf: 'read',
          per_page: 200,
          sort: 'date_read'
        }
      });
      return data.reviews.map(mapBookFromResponse);
    } catch (error) {
      console.error('Failed to fetch user books:', error);
      throw error;
    }
  }
};

const mapBookFromResponse = (review: any): Book => ({
  id: review.book.id,
  title: review.book.title,
  author: review.book.authors[0].name,
  isbn: review.book.isbn,
  isbn13: review.book.isbn13,
  rating: review.rating,
  dateRead: review.read_at,
  dateStarted: review.started_at,
  shelves: review.shelves,
  pageCount: review.book.num_pages,
  format: review.book.format,
  publisher: review.book.publisher,
  publishedDate: review.book.publication_date,
  genres: review.book.popular_shelves.slice(0, 5).map((s: any) => s.name),
  description: review.book.description,
  coverImage: review.book.image_url,
  link: review.book.link
}); 