import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Load environment variables
config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure server timeouts
const SERVER_TIMEOUT = 180000; // 180 seconds (3 minutes)
app.use((req, res, next) => {
  res.setTimeout(SERVER_TIMEOUT, () => {
    console.log('Server response timeout');
    res.status(408).send('Request timeout');
  });
  next();
});

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Log environment variables on startup
console.log('Server environment check:', {
  hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY,
  hasCrawlbaseToken: !!process.env.CRAWLBASE_TOKEN,
  env: process.env.NODE_ENV,
  crawlbaseTokenPrefix: process.env.CRAWLBASE_TOKEN?.substring(0, 5) + '...'
});

app.post('/api/crawl-goodreads', async (req, res) => {
  // Set up SSE headers for streaming updates
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');
  
  // Helper function to send SSE data
  const sendSSE = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.flush(); // Force flush the response
  };

  const { userId, goodreadsId } = req.body;

  if (!userId || !goodreadsId) {
    sendSSE({ error: 'User ID and Goodreads ID are required' });
    return res.end();
  }

  try {
    // First, fetch all shelves
    const shelvesListUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=all&per_page=1`;
    console.log('Fetching shelves list from:', shelvesListUrl);
    
    const shelvesListResult = await fetchWithRetry(
      `https://api.crawlbase.com/?token=${process.env.CRAWLBASE_TOKEN}&url=${encodeURIComponent(shelvesListUrl)}&format=raw`,
      {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );

    if (!shelvesListResult.ok || !shelvesListResult.text) {
      throw new Error('Failed to fetch shelves list');
    }

    const $ = cheerio.load(shelvesListResult.text);
    const shelves = $('#paginatedShelfList option').map((_, el) => $(el).val()).get();
    
    if (!shelves.length) {
      throw new Error('No shelves found - please check if the Goodreads profile is public');
    }

    console.log('Found shelves:', shelves);
    let allBooks = [];

    // Fetch books from each shelf
    for (let shelfIndex = 0; shelfIndex < shelves.length; shelfIndex++) {
      const shelf = shelves[shelfIndex];
      const shelfUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=${shelf}&per_page=100&view=table&sort=date_read&order=d`;
      
      console.log(`Fetching shelf ${shelf} (${shelfIndex + 1}/${shelves.length}) from:`, shelfUrl);
      
      // Send progress update for shelf fetching
      sendSSE({
        progress: {
          stage: 'fetching',
          current: shelfIndex + 1,
          total: shelves.length,
          message: `Fetching books from shelf: ${shelf} (${shelfIndex + 1}/${shelves.length})`
        }
      });
      
      try {
        const shelvesResult = await fetchWithRetry(
          `https://api.crawlbase.com/?token=${process.env.CRAWLBASE_TOKEN}&url=${encodeURIComponent(shelfUrl)}&format=raw`,
          {
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        );

        if (shelvesResult.ok && shelvesResult.text) {
          const shelfBooks = parseGoodreadsHtml(shelvesResult.text);
          // Add the current shelf to each book's shelves array
          shelfBooks.forEach(book => {
            if (!book.shelves) book.shelves = [];
            if (!book.shelves.includes(shelf)) {
              book.shelves.push(shelf);
            }
          });
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

    // Deduplicate books while preserving all shelves
    const bookMap = new Map();
    allBooks.forEach(book => {
      const key = `${book.title}-${book.author}`;
      if (bookMap.has(key)) {
        // Merge shelves if the book already exists
        const existing = bookMap.get(key);
        existing.shelves = [...new Set([...existing.shelves, ...(book.shelves || [])])];
      } else {
        bookMap.set(key, book);
      }
    });
    const uniqueBooks = Array.from(bookMap.values());

    console.log(`Total unique books found: ${uniqueBooks.length}`);

    // Update books in Supabase
    let processed = 0;
    const booksToReturn = [];
    
    for (const book of uniqueBooks) {
      // Send progress update for saving books
      sendSSE({
        progress: {
          stage: 'saving',
          current: processed + 1,
          total: uniqueBooks.length,
          message: `Saving book: ${book.title} (${processed + 1}/${uniqueBooks.length})`
        }
      });

      const bookData = {
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

    // Send final completion message with statistics
    const stats = {
      totalBooks: booksToReturn.length,
      totalShelves: shelves.length,
      averageRating: calculateAverageRating(booksToReturn),
      booksPerShelf: calculateBooksPerShelf(booksToReturn),
      readingProgress: calculateReadingProgress(booksToReturn),
      topAuthors: calculateTopAuthors(booksToReturn),
      ratingDistribution: calculateRatingDistribution(booksToReturn)
    };

    console.log('Sending final response with stats:', stats);
    
    const finalResponse = {
      books: booksToReturn,
      stats,
      progress: {
        stage: 'complete',
        current: booksToReturn.length,
        total: booksToReturn.length,
        message: `Successfully synced ${booksToReturn.length} books from ${shelves.length} shelves`
      }
    };

    sendSSE(finalResponse);
    console.log('Response sent successfully');
    res.end();
  } catch (error) {
    console.error('Error in handler:', error);
    sendSSE({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
    res.end();
  }
});

// Statistics calculation functions
function calculateAverageRating(books) {
  const ratedBooks = books.filter(book => book.rating > 0);
  if (ratedBooks.length === 0) return 0;
  const sum = ratedBooks.reduce((acc, book) => acc + book.rating, 0);
  return (sum / ratedBooks.length).toFixed(2);
}

function calculateBooksPerShelf(books) {
  const shelfCounts = {};
  books.forEach(book => {
    if (book.shelves) {
      book.shelves.forEach(shelf => {
        shelfCounts[shelf] = (shelfCounts[shelf] || 0) + 1;
      });
    }
  });
  return shelfCounts;
}

function calculateReadingProgress(books) {
  const readBooks = books.filter(book => book.shelves?.includes('read')).length;
  const currentlyReading = books.filter(book => book.shelves?.includes('currently-reading')).length;
  const toRead = books.filter(book => book.shelves?.includes('to-read')).length;
  
  return {
    read: readBooks,
    reading: currentlyReading,
    toRead: toRead,
    total: books.length
  };
}

function calculateTopAuthors(books) {
  const authorCounts = {};
  books.forEach(book => {
    if (book.author) {
      authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    }
  });
  
  return Object.entries(authorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([author, count]) => ({ author, count }));
}

function calculateRatingDistribution(books) {
  const distribution = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  };
  
  books.forEach(book => {
    if (book.rating > 0) {
      distribution[book.rating] = (distribution[book.rating] || 0) + 1;
    }
  });
  
  return distribution;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Ready to handle requests...');
}); 