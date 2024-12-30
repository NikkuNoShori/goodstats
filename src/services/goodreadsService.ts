import axios from 'axios';

const GOODREADS_API_KEY = import.meta.env.VITE_GOODREADS_API_KEY;
const BASE_URL = 'https://www.goodreads.com/api';

export interface BookData {
  id: string;
  title: string;
  author: string;
  dateRead: Date;
  rating: number;
  pageCount: number;
  genre: string;
}

export const goodreadsService = {
  async getUserBooks(userId: string): Promise<BookData[]> {
    try {
      const response = await axios.get(`${BASE_URL}/review/list`, {
        params: {
          v: '2',
          key: GOODREADS_API_KEY,
          id: userId,
          shelf: 'read',
          per_page: 200,
          format: 'json'
        }
      });
      
      return response.data.reviews.map((review: any) => ({
        id: review.book.id,
        title: review.book.title,
        author: review.book.authors[0].name,
        dateRead: new Date(review.read_at),
        rating: review.rating,
        pageCount: review.book.num_pages,
        genre: review.book.popular_shelves[0]?.name || 'Unknown'
      }));
    } catch (error) {
      console.error('Error fetching Goodreads data:', error);
      throw error;
    }
  }
}; 