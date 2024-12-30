import * as cheerio from 'cheerio';
import { Book } from '../types/book';

export const goodreadsService = {
  getUserBooks: async (username: string): Promise<Book[]> => {
    const response = await fetch(`https://www.goodreads.com/review/list/${username}?shelf=read`);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const books: Book[] = [];
    
    $('.bookalike').each((_, element) => {
      const book: Book = {
        id: $(element).attr('id') || '',
        title: $('.title a', element).text().trim(),
        author: $('.author a', element).text().trim(),
        rating: parseInt($('.rating', element).text().trim()) || 0,
        dateRead: $('.date_read span', element).attr('title') || undefined,
        coverImage: $('.cover img', element).attr('src') || undefined
      };
      books.push(book);
    });
    
    return books;
  }
};
