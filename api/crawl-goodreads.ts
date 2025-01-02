import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const CRAWLBASE_TOKEN = process.env.CRAWLBASE_TOKEN;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 180000; // Increase to 180 seconds (3 minutes)

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  console.log(`Starting fetch with ${timeoutMs}ms timeout (${timeoutMs/1000} seconds)`);
  
  const timeout = setTimeout(() => {
    console.log('Timeout reached, aborting request');
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Add keepalive to prevent premature connection closing
      keepalive: true,
      // Increase timeout in headers
      headers: {
        ...options.headers,
        'Connection': 'keep-alive',
        'Keep-Alive': `timeout=${Math.floor(timeoutMs/1000)}`,
        'Crawlbase-Request-Timeout': `${Math.floor(timeoutMs/1000)}`
      }
    });
    console.log('Fetch completed successfully');
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request timed out after ${timeoutMs}ms`);
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url: string, options: RequestInit = {}) {
  let lastError;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`Attempt ${i + 1}/${MAX_RETRIES} to fetch from Crawlbase`);
      const response = await fetchWithTimeout(url, options);
      
      // Check if response is ok before returning
      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 0) {
          return { ok: true, text };
        }
        throw new Error('Empty response received');
      }
      
      lastError = await response.text();
      console.log(`Attempt ${i + 1} failed with status ${response.status}: ${lastError}`);
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed with error:`, error);
    }
    
    // Wait before retrying, with exponential backoff
    if (i < MAX_RETRIES - 1) {
      const delay = Math.pow(2, i) * 2000; // Increase backoff: 2s, 4s, 8s
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
}

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

interface DatabaseBook {
  id?: number;
  user_id: string;
  goodreads_id: string;
  title: string;
  author: string;
  rating: number;
  date_read?: string;
  isbn: string;
  review: string;
  shelves?: string[];
  page_count?: number;
  cover_image?: string;
  updated_at?: string;
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
    if (!CRAWLBASE_TOKEN) {
      throw new Error('Crawlbase token is not configured');
    }

    // First, fetch all shelves
    const shelvesListUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=all&per_page=1`;
    console.log('Fetching shelves list from:', shelvesListUrl);
    
    const shelvesListResult = await fetchWithRetry(
      `https://api.crawlbase.com/?token=${CRAWLBASE_TOKEN}&url=${encodeURIComponent(shelvesListUrl)}&format=raw`,
      {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );

    if (!shelvesListResult.ok || !shelvesListResult.text) {
      throw new Error('Failed to fetch shelves list');
    }

    const $ = cheerio.load(shelvesListResult.text);
    const shelves = $('#paginatedShelfList option').map((_, el) => $(el).val()).get() as string[];
    
    if (!shelves.length) {
      throw new Error('No shelves found - please check if the Goodreads profile is public');
    }

    console.log('Found shelves:', shelves);
    let allBooks: BookData[] = [];

    // Fetch books from each shelf
    for (let shelfIndex = 0; shelfIndex < shelves.length; shelfIndex++) {
      const shelf = shelves[shelfIndex];
      const shelfUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=${shelf}&per_page=100&view=table`;
      
      // Send progress update for shelf fetching
      res.write(`data: ${JSON.stringify({
        progress: {
          stage: 'fetching',
          current: shelfIndex + 1,
          total: shelves.length,
          message: `Fetching books from shelf: ${shelf} (${shelfIndex + 1}/${shelves.length})`
        }
      })}\n\n`);
      
      try {
        const shelvesResult = await fetchWithRetry(
          `https://api.crawlbase.com/?token=${CRAWLBASE_TOKEN}&url=${encodeURIComponent(shelfUrl)}&format=raw`,
          {
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        );

        if (shelvesResult.ok && shelvesResult.text) {
          const shelfBooks = parseGoodreadsHtml(shelvesResult.text);
          allBooks = allBooks.concat(shelfBooks);
          console.log(`Found ${shelfBooks.length} books in shelf ${shelf}`);
        } else {
          console.error(`Failed to fetch shelf ${shelf}`);
        }
      } catch (error) {
        console.error(`Error fetching shelf ${shelf}:`, error);
        continue;
      }
    }

    // Deduplicate books
    const uniqueBooks = Array.from(
      new Map(allBooks.map(book => [`${book.title}-${book.author}`, book])).values()
    );

    console.log(`Total unique books found: ${uniqueBooks.length}`);

    // Update books in Supabase
    let processed = 0;
    const booksToReturn: DatabaseBook[] = [];
    
    for (const book of uniqueBooks) {
      // Send progress update for saving books
      res.write(`data: ${JSON.stringify({
        progress: {
          stage: 'saving',
          current: processed + 1,
          total: uniqueBooks.length,
          message: `Saving book: ${book.title} (${processed + 1}/${uniqueBooks.length})`
        }
      })}\n\n`);

      const bookData: DatabaseBook = {
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
      };

      const { data, error: upsertError } = await supabase
        .from('books')
        .upsert(bookData)
        .select()
        .single();

      if (upsertError) {
        console.error('Error upserting book:', upsertError);
      } else if (data) {
        booksToReturn.push(data);
      }

      processed++;
    }

    // Update last sync timestamp
    await supabase
      .from('profiles')
      .update({
        last_sync: new Date().toISOString(),
        goodreads_user_id: goodreadsId
      })
      .eq('id', userId);

    // Send final completion message
    res.write(`data: ${JSON.stringify({
      books: booksToReturn,
      progress: {
        stage: 'complete',
        current: booksToReturn.length,
        total: booksToReturn.length,
        message: `Successfully synced ${booksToReturn.length} books from ${shelves.length} shelves`
      }
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Error in handler:', error);
    res.write(`data: ${JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    })}\n\n`);
    res.end();
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