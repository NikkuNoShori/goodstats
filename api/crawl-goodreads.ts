import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const CRAWLBASE_TOKEN = process.env.CRAWLBASE_TOKEN;

interface BookData {
  title: string;
  author: string;
  isbn: string;
  pages: number;
  rating: number;
  dateRead: string;
  review: string;
  coverUrl: string;
  shelves: string[];
  coverStoragePath?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, goodreadsId } = req.body;

  if (!userId || !goodreadsId) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // First, fetch the user's shelves
    const shelvesUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=all`;
    const shelvesResponse = await fetch(
      `https://api.crawlbase.com/?token=${CRAWLBASE_TOKEN}&url=${encodeURIComponent(shelvesUrl)}`
    );

    if (!shelvesResponse.ok) {
      throw new Error('Failed to fetch shelves');
    }

    const shelvesHtml = await shelvesResponse.text();
    const books = parseGoodreadsHtml(shelvesHtml);

    // Update books in Supabase
    for (const book of books) {
      const { error: upsertError } = await supabase
        .from('books')
        .upsert({
          user_id: userId,
          goodreads_id: goodreadsId,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          rating: book.rating,
          date_read: book.dateRead,
          review: book.review,
          shelves: book.shelves,
          page_count: book.pages,
          cover_image: book.coverUrl,
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        console.error('Error upserting book:', upsertError);
      }
    }

    // Update last sync timestamp
    await supabase
      .from('profiles')
      .update({
        last_sync: new Date().toISOString()
      })
      .eq('id', userId);

    return res.status(200).json({ books });
  } catch (error) {
    console.error('Error in handler:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function parseGoodreadsHtml(html: string): BookData[] {
  const $ = cheerio.load(html);
  const books: BookData[] = [];

  // Find all book rows
  $('.bookalike').each((_, element) => {
    const title = $(element).find('.title a').text().trim();
    const author = $(element).find('.author a').text().trim();
    const isbn = $(element).find('.isbn13').text().trim() || '';
    const rating = parseInt($(element).find('.rating .value').text().trim()) || 0;
    const dateRead = $(element).find('.date_read .value').text().trim();
    const review = $(element).find('.review .value').text().trim();
    const coverUrl = $(element).find('.cover img').attr('src') || '';
    const pages = parseInt($(element).find('.num_pages .value').text().trim()) || 0;
    
    // Get shelves for the book
    const shelves: string[] = [];
    $(element).find('.shelves .value a').each((_, shelfElement) => {
      shelves.push($(shelfElement).text().trim());
    });

    books.push({
      title,
      author,
      isbn,
      rating,
      dateRead,
      review,
      coverUrl,
      pages,
      shelves
    });
  });

  return books;
} 