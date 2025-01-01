import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const CRAWLBASE_TOKEN = process.env.CRAWLBASE_TOKEN;
const CRAWLBASE_SCREENSHOTS_TOKEN = process.env.CRAWLBASE_SCREENSHOTS_TOKEN;
const CRAWLBASE_STORAGE_TOKEN = process.env.CRAWLBASE_STORAGE_TOKEN;

// Log environment variables (without exposing sensitive data)
console.log('Environment check:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
  hasCrawlbaseToken: !!process.env.CRAWLBASE_TOKEN,
  env: process.env.NODE_ENV
});

interface BookData {
  title: string;
  author: string;
  isbn: string;
  pages: number;
  rating: number;
  dateRead: string;
  review: string;
  coverUrl: string;
  coverStoragePath?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('API handler started');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Log all environment variables (without sensitive values)
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasCrawlbaseToken: !!process.env.CRAWLBASE_TOKEN,
    env: process.env.NODE_ENV,
    crawlbaseTokenPrefix: process.env.CRAWLBASE_TOKEN?.substring(0, 5) + '...'
  });

  try {
    const { userId, goodreadsId } = req.body;
    console.log('API received request:', { userId, goodreadsId });

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!goodreadsId) {
      return res.status(400).json({ message: 'Goodreads ID is required in request' });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ message: 'Supabase configuration error' });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Verify the Goodreads ID matches the profile
    console.log('Fetching profile from Supabase...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('goodreads_user_id')
      .eq('id', userId)
      .single();

    console.log('Profile from database:', profile);
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({ message: 'Failed to fetch profile' });
    }

    if (!profile?.goodreads_user_id) {
      return res.status(400).json({ message: 'Goodreads ID not found in profile' });
    }

    if (profile.goodreads_user_id !== goodreadsId) {
      console.error('Goodreads ID mismatch:', { 
        profileId: profile.goodreads_user_id, 
        requestId: goodreadsId 
      });
      return res.status(400).json({ message: 'Goodreads ID mismatch' });
    }

    // Scrape Goodreads data
    const goodreadsUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=read&sort=date_read&order=d&per_page=200&view=table`;
    console.log('Fetching from URL:', goodreadsUrl);

    if (!process.env.CRAWLBASE_TOKEN) {
      console.error('CRAWLBASE_TOKEN is not set');
      return res.status(500).json({ message: 'Crawlbase configuration error' });
    }

    try {
      const crawlbaseUrl = `https://api.crawlbase.com/?token=${process.env.CRAWLBASE_TOKEN}&url=${encodeURIComponent(goodreadsUrl)}`;
      console.log('Making request to Crawlbase URL:', crawlbaseUrl);

      const response = await fetch(crawlbaseUrl);
      console.log('Crawlbase response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Crawlbase error response:', errorText);
        return res.status(response.status).json({ 
          message: 'Failed to fetch Goodreads data',
          error: errorText
        });
      }

      const responseText = await response.text();
      console.log('Got response from Crawlbase, first 200 chars:', responseText.substring(0, 200));

      if (!responseText.includes('table')) {
        console.error('Response does not contain expected table data');
        return res.status(500).json({ message: 'Invalid response from Goodreads' });
      }

      console.log('Parsing HTML...');
      const books = parseGoodreadsHtml(responseText);
      console.log(`Successfully parsed ${books.length} books from response`);

      return res.status(200).json({
        message: 'Scraping successful',
        booksFound: books.length,
        firstBook: books[0]
      });

    } catch (err) {
      console.error('Error during Crawlbase request:', err);
      return res.status(500).json({ 
        message: 'Failed to fetch Goodreads data',
        error: err instanceof Error ? err.message : String(err)
      });
    }

  } catch (err) {
    console.error('Error in crawl-goodreads:', err);
    return res.status(500).json({ message: 'Failed to sync with Goodreads' });
  }
}

function parseGoodreadsHtml(html: string): BookData[] {
  const $ = cheerio.load(html);
  const books: BookData[] = [];

  // Find the table rows containing book data
  $('tr.bookalike').each((_, row) => {
    const $row = $(row);

    // Extract basic book info
    const title = $row.find('td.title a').first().text().trim();
    const author = $row.find('td.author a').first().text().trim();
    const isbn = $row.find('td.isbn span').text().trim();
    const pages = parseInt($row.find('td.num_pages span').text()) || 0;
    const rating = $row.find('td.rating span[class^="staticStar"]').length || 0;
    const dateRead = $row.find('td.date_read span').text().trim();
    const review = $row.find('td.review span').text().trim();
    const coverUrl = $row.find('td.cover img').attr('src') || '';

    // Only add books with required fields
    if (title && author && isbn) {
      books.push({
        title,
        author,
        isbn,
        pages,
        rating,
        dateRead,
        review,
        coverUrl
      });
    }
  });

  return books;
} 