import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Load environment variables
config();

const app = express();

// Configure CORS with specific origin and handle preflight
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Add express.json middleware after CORS
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

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Log environment variables on startup
console.log('Server environment check:', {
  hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY,
  hasCrawlbaseToken: !!process.env.CRAWLBASE_TOKEN,
  env: process.env.NODE_ENV,
  crawlbaseTokenPrefix: process.env.CRAWLBASE_TOKEN?.substring(0, 5) + '...'
});

// Add fetchWithRetry function
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries} to fetch from Crawlbase`);
      const response = await fetch(url, options);
      
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
    if (i < maxRetries - 1) {
      const delay = Math.pow(2, i) * 2000; // Increase backoff: 2s, 4s, 8s
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError}`);
}

// Update parseGoodreadsHtml function to capture more data
function parseGoodreadsHtml(html) {
  const $ = cheerio.load(html);
  const books = [];

  console.log('Starting to parse Goodreads HTML');
  
  // Try multiple selectors for different Goodreads layouts
  const tableRows = $('tr.bookalike, tr.review, .review--show');
  console.log(`Found ${tableRows.length} book rows in the HTML`);

  tableRows.each((index, row) => {
    const $row = $(row);
    console.log(`\nProcessing row ${index + 1}`);
    
    // Extract book ID from multiple possible locations
    let bookId = $row.attr('id')?.replace('review_', '') || 
                 $row.find('.title a, .field.title a').first().attr('href')?.match(/show\/(\d+)/)?.at(1) ||
                 $row.find('input[name="book_id"]').val();
    
    // Enhanced data extraction with multiple fallback selectors
    const title = $row.find('.title a, .field.title a, .bookTitle').first().text().trim();
    const author = $row.find('.author a, .field.author a, .authorName').first().text().trim();
    
    // Enhanced ISBN extraction
    const isbn = $row.find('.isbn13, .field.isbn13, .isbn').first().text().trim().replace('=', '') ||
                $row.find('[itemprop="isbn"]').attr('content') ||
                $row.find('.infoBoxRowItem').text().match(/\d{13}|\d{10}/)?.[0];
    
    // Enhanced rating extraction
    let rating = 0;
    const ratingElement = $row.find('.rating .value, .field.rating .value, .staticStars, [itemprop="ratingValue"]').first();
    const ratingText = ratingElement.text().trim();
    const ratingMatch = ratingText.match(/\d+/);
    if (ratingMatch) {
      rating = parseInt(ratingMatch[0]);
    } else if (ratingElement.attr('content')) {
      rating = parseInt(ratingElement.attr('content'));
    }
    
    // Enhanced date read extraction
    const dateRead = $row.find('.date_read span, .field.date_read span, .readDate').first().attr('title') ||
                    $row.find('.date_read_value').text().trim() ||
                    null;
    
    // Enhanced review extraction
    const review = $row.find('.review .readable, .field.review .readable, .reviewText').first().text().trim();
    
    // Enhanced cover URL extraction
    const coverUrl = $row.find('.cover img, .field.cover img, .bookCover').first().attr('src')?.replace(/\._.*_/, '.');
    
    // Enhanced page count extraction
    let pages = 0;
    const pagesText = $row.find('.num_pages, .field.num_pages, .pageNumberFormat').first().text().trim();
    const pagesMatch = pagesText.match(/\d+/);
    if (pagesMatch) {
      pages = parseInt(pagesMatch[0]);
    }
    
    // Enhanced shelf extraction
    const shelves = new Set();
    $row.find('.shelf, .field.shelf, .shelfStatus').each((_, shelf) => {
      const shelfName = $(shelf).text().trim().toLowerCase();
      if (shelfName) shelves.add(shelfName);
    });
    
    // Additional metadata
    const format = $row.find('.format, .field.format').first().text().trim();
    const publisher = $row.find('.publisher, .field.publisher').first().text().trim();
    const publishedDate = $row.find('.published, .field.published').first().text().trim();

    console.log('Extracted data:', {
      bookId,
      title,
      author,
      isbn: isbn || 'Not found',
      rating: rating || 'Not found',
      dateRead: dateRead || 'Not found',
      hasReview: !!review,
      hasCover: !!coverUrl,
      pages: pages || 'Not found',
      shelves: Array.from(shelves),
      format: format || 'Not found',
      publisher: publisher || 'Not found',
      publishedDate: publishedDate || 'Not found'
    });

    if (title && author) {
      books.push({
        bookId,
        title,
        author,
        isbn,
        rating,
        dateRead,
        review,
        coverUrl,
        pages,
        shelves: Array.from(shelves),
        format,
        publisher,
        publishedDate
      });
      console.log(`Added book: ${title} by ${author} (ID: ${bookId})`);
    } else {
      console.log('Skipped row - missing title or author');
      console.log('Row HTML:', $row.html());
    }
  });

  console.log(`\nFinished parsing HTML. Found ${books.length} books.`);
  return books;
}

// Update fetchBooksFromShelf to provide more detailed progress updates
async function fetchBooksFromShelf(goodreadsId, shelf, sendSSE) {
  const booksPerPage = 100;
  let page = 1;
  let allBooksFromShelf = [];
  let hasMoreBooks = true;
  let totalBooks = 0;

  // First, try to get the total number of books
  const firstPageUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=${shelf}&per_page=1&page=1`;
  try {
    const result = await fetchWithRetry(
      `https://api.crawlbase.com/?token=${process.env.CRAWLBASE_TOKEN}&url=${encodeURIComponent(firstPageUrl)}&format=raw`
    );
    if (result.ok) {
      const $ = cheerio.load(result.text);
      const countText = $('.selectedShelf, .selectedBookShelf').text();
      const match = countText.match(/\((\d+).*?\)/);
      if (match) {
        totalBooks = parseInt(match[1]);
        console.log(`Found ${totalBooks} total books on shelf "${shelf}"`);
      }
    }
  } catch (error) {
    console.error('Error getting total book count:', error);
  }

  while (hasMoreBooks) {
    const shelfUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=${shelf}&per_page=${booksPerPage}&page=${page}&view=table&sort=date_read&order=d`;
    console.log(`\nFetching page ${page} of shelf ${shelf} from:`, shelfUrl);
    
    sendSSE({
      progress: {
        stage: 'fetching',
        message: `Fetching page ${page} of shelf: ${shelf}${totalBooks ? ` (${allBooksFromShelf.length}/${totalBooks} books)` : ''}`,
        current: allBooksFromShelf.length,
        total: totalBooks || 100, // Use 100 as fallback if we couldn't get total
        shelf
      }
    });

    try {
      const result = await fetchWithRetry(
        `https://api.crawlbase.com/?token=${process.env.CRAWLBASE_TOKEN}&url=${encodeURIComponent(shelfUrl)}&format=raw`,
        {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      );

      if (result.ok && result.text) {
        const $ = cheerio.load(result.text);
        const booksOnPage = parseGoodreadsHtml(result.text);
        console.log(`Found ${booksOnPage.length} books on page ${page}`);

        if (booksOnPage.length === 0) {
          hasMoreBooks = false;
          console.log('No more books found on this page');
        } else {
          // Add the current shelf to each book's shelves array
          booksOnPage.forEach(book => {
            if (!book.shelves) book.shelves = [];
            if (!book.shelves.includes(shelf)) {
              book.shelves.push(shelf);
            }
          });
          allBooksFromShelf = allBooksFromShelf.concat(booksOnPage);

          // Check if there's a next page
          const hasNextPage = $('.next_page').length > 0 && !$('.next_page.disabled').length;
          if (!hasNextPage) {
            hasMoreBooks = false;
            console.log('No next page link found');
          } else {
            page++;
          }
        }
      } else {
        console.error(`Failed to fetch page ${page} of shelf ${shelf}`);
        hasMoreBooks = false;
      }
    } catch (error) {
      console.error(`Error fetching page ${page} of shelf ${shelf}:`, error);
      hasMoreBooks = false;
    }
  }

  console.log(`Total books found in shelf ${shelf}: ${allBooksFromShelf.length}`);
  return allBooksFromShelf;
}

app.post('/api/crawl-goodreads', async (req, res) => {
  console.log('Received request to /api/crawl-goodreads');
  console.log('Request body:', req.body);
  
  // Set up SSE headers for streaming updates
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Helper function to send SSE data
  const sendSSE = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // Remove res.flush() as it's not needed and causing errors
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
    
    // Try multiple selectors to find shelves
    let shelves = [];
    
    // Check for shelves in the dropdown (old UI)
    const dropdownShelves = $('#paginatedShelfList option').map((_, el) => $(el).val()).get();
    
    // Check for shelves in the sidebar (new UI)
    const sidebarShelves = $('.userShelf').map((_, el) => $(el).data('shelf')).get();
    
    // Check for shelves in the table header (another possible location)
    const headerShelves = $('.selectedShelf').map((_, el) => $(el).data('shelf')).get();
    
    // Combine all found shelves
    shelves = [...new Set([...dropdownShelves, ...sidebarShelves, ...headerShelves])];
    
    // If no shelves found, try to at least get the current shelf
    if (!shelves.length) {
      const currentShelf = $('.selectedShelf').first().text().trim().toLowerCase();
      if (currentShelf) {
        shelves = [currentShelf];
      }
    }
    
    // Default to 'all' if still no shelves found
    if (!shelves.length) {
      shelves = ['all'];
      console.log('No explicit shelves found, defaulting to "all"');
    }

    console.log('Found shelves:', shelves);

    let allBooks = [];

    // Replace the shelf fetching loop with:
    for (let shelfIndex = 0; shelfIndex < shelves.length; shelfIndex++) {
      const shelf = shelves[shelfIndex];
      console.log(`\nProcessing shelf ${shelf} (${shelfIndex + 1}/${shelves.length})`);
      
      const shelfBooks = await fetchBooksFromShelf(goodreadsId, shelf, sendSSE);
      allBooks = allBooks.concat(shelfBooks);
      
      console.log(`Added ${shelfBooks.length} books from shelf ${shelf}`);
      console.log(`Total books so far: ${allBooks.length}`);
    }

    // Deduplicate books while preserving all shelves
    const bookMap = new Map();
    allBooks.forEach(book => {
      // Create a unique key using multiple identifiers
      const key = book.isbn 
        ? book.isbn // Use ISBN if available
        : `${book.title.toLowerCase().trim()}-${book.author.toLowerCase().trim()}`; // Fallback to normalized title-author

      if (bookMap.has(key)) {
        // Merge shelves if the book already exists
        const existing = bookMap.get(key);
        existing.shelves = [...new Set([...existing.shelves, ...(book.shelves || [])])];
        
        // Keep the highest rating if they differ
        if (book.rating > existing.rating) {
          existing.rating = book.rating;
        }
        
        // Keep the most recent date_read if they differ
        if (book.dateRead && (!existing.dateRead || new Date(book.dateRead) > new Date(existing.dateRead))) {
          existing.dateRead = book.dateRead;
        }
        
        // Keep the longest review
        if (book.review && book.review.length > (existing.review?.length || 0)) {
          existing.review = book.review;
        }
      } else {
        bookMap.set(key, { ...book });
      }
    });

    const uniqueBooks = Array.from(bookMap.values());

    console.log(`Total unique books found: ${uniqueBooks.length}`);

    // Update books in Supabase
    let processed = 0;
    const booksToReturn = [];
    
    console.log(`Starting to save ${uniqueBooks.length} books to Supabase`);
    console.log('Books to save:', uniqueBooks.map(b => `${b.title} by ${b.author}`));

    for (const book of uniqueBooks) {
      console.log(`\nProcessing book: "${book.title}" by ${book.author}`);
      console.log('Book data:', JSON.stringify(book, null, 2));

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
        goodreads_book_id: book.bookId || null,
        title: book.title.trim(),
        author: book.author.trim(),
        isbn: book.isbn,
        rating: book.rating,
        date_read: book.dateRead,
        review: book.review,
        shelves: book.shelves,
        page_count: book.pages,
        cover_image: book.coverUrl,
        format: book.format,
        publisher: book.publisher,
        published_date: book.publishedDate,
        updated_at: new Date().toISOString()
      };

      console.log('Prepared book data:', JSON.stringify(bookData, null, 2));

      try {
        // First try to find an existing book
        const { data: existingBook, error: findError } = await supabase
          .from('books')
          .select('id')
          .eq('user_id', userId)
          .eq('goodreads_book_id', book.bookId)
          .single();

        if (findError) {
          console.log('Error finding existing book:', findError);
        } else {
          console.log('Existing book check result:', existingBook);
        }

        let savedBook;
        if (existingBook) {
          console.log(`Updating existing book with ID: ${existingBook.id}`);
          const { data, error } = await supabase
            .from('books')
            .update(bookData)
            .eq('id', existingBook.id)
            .select()
            .single();
          
          if (error) {
            console.error('Error updating book:', error);
            throw error;
          }
          savedBook = data;
          console.log('Book updated successfully');
        } else {
          console.log('Inserting new book');
          const { data, error } = await supabase
            .from('books')
            .insert(bookData)
            .select()
            .single();
          
          if (error) {
            console.error('Error inserting book:', error);
            throw error;
          }
          savedBook = data;
          console.log('Book inserted successfully');
        }

        if (savedBook) {
          console.log(`Successfully saved book: ${book.title}`);
          console.log('Saved book data:', JSON.stringify(savedBook, null, 2));
          booksToReturn.push(savedBook);
        }
      } catch (error) {
        console.error(`Error saving book ${book.title}:`, error);
        sendSSE({ error: `Error saving book: ${book.title}` });
      }

      processed++;
    }

    console.log(`Finished saving books. ${booksToReturn.length} books saved successfully.`);
    console.log('Books saved:', booksToReturn.map(b => `${b.title} by ${b.author}`));

    // Update last sync timestamp
    await supabase
      .from('profiles')
      .update({
        last_sync: new Date().toISOString(),
        goodreads_user_id: goodreadsId
      })
      .eq('id', userId);

    // After saving books, get all books for this user for accurate stats
    const { data: userBooks, error: userBooksError } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId);

    if (userBooksError) {
      console.error('Error fetching user books for stats:', userBooksError);
      sendSSE({ error: 'Error calculating statistics' });
      return res.end();
    }

    // Calculate stats using all user's books
    const stats = {
      totalBooks: userBooks.length,
      totalShelves: [...new Set(userBooks.flatMap(book => book.shelves || []))].length,
      averageRating: calculateAverageRating(userBooks),
      booksPerShelf: calculateBooksPerShelf(userBooks),
      readingProgress: calculateReadingProgress(userBooks),
      topAuthors: calculateTopAuthors(userBooks),
      ratingDistribution: calculateRatingDistribution(userBooks),
      formatDistribution: calculateFormatDistribution(userBooks),
      publisherStats: calculatePublisherStats(userBooks)
    };

    console.log('Sending final response with stats:', stats);
    
    const finalResponse = {
      books: userBooks, // Send all user's books
      stats,
      progress: {
        stage: 'complete',
        current: booksToReturn.length,
        total: booksToReturn.length,
        message: `Successfully synced ${booksToReturn.length} books`
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

// Update the books endpoint to filter by user ID
app.get('/api/books', async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update statistics calculations to handle null/undefined values
function calculateAverageRating(books) {
  const ratedBooks = books.filter(book => book?.rating && book.rating > 0);
  if (ratedBooks.length === 0) return 0;
  const sum = ratedBooks.reduce((acc, book) => acc + (book.rating || 0), 0);
  return Number((sum / ratedBooks.length).toFixed(2));
}

function calculateBooksPerShelf(books) {
  const shelfCounts = {};
  books.forEach(book => {
    if (book?.shelves && Array.isArray(book.shelves)) {
      book.shelves.forEach(shelf => {
        if (shelf) {
          const normalizedShelf = shelf.toLowerCase().trim();
          shelfCounts[normalizedShelf] = (shelfCounts[normalizedShelf] || 0) + 1;
        }
      });
    }
  });
  
  // Sort shelves by count
  return Object.entries(shelfCounts)
    .sort(([,a], [,b]) => b - a)
    .reduce((acc, [shelf, count]) => ({
      ...acc,
      [shelf]: count
    }), {});
}

function calculateReadingProgress(books) {
  const total = books.length;
  const read = books.filter(book => 
    book?.shelves?.some(shelf => 
      shelf.toLowerCase().includes('read') && 
      !shelf.toLowerCase().includes('to-read') && 
      !shelf.toLowerCase().includes('currently-reading')
    )
  ).length;
  
  const reading = books.filter(book => 
    book?.shelves?.some(shelf => 
      shelf.toLowerCase().includes('currently-reading')
    )
  ).length;
  
  const toRead = books.filter(book => 
    book?.shelves?.some(shelf => 
      shelf.toLowerCase().includes('to-read') || 
      shelf.toLowerCase().includes('want-to-read')
    )
  ).length;
  
  return {
    total,
    read,
    reading,
    toRead,
    readingRate: read > 0 ? (read / total * 100).toFixed(1) : 0
  };
}

function calculateTopAuthors(books) {
  const authorStats = {};
  books.forEach(book => {
    if (book?.author) {
      const author = book.author.trim();
      if (author) {
        if (!authorStats[author]) {
          authorStats[author] = {
            count: 0,
            totalRating: 0,
            ratedBooks: 0,
            books: []
          };
        }
        authorStats[author].count++;
        if (book.rating > 0) {
          authorStats[author].totalRating += book.rating;
          authorStats[author].ratedBooks++;
        }
        authorStats[author].books.push({
          title: book.title,
          rating: book.rating,
          dateRead: book.date_read
        });
      }
    }
  });
  
  return Object.entries(authorStats)
    .map(([author, stats]) => ({
      author,
      count: stats.count,
      averageRating: stats.ratedBooks > 0 ? 
        (stats.totalRating / stats.ratedBooks).toFixed(1) : 0,
      books: stats.books
    }))
    .sort((a, b) => b.count - a.count || b.averageRating - a.averageRating)
    .slice(0, 10);
}

function calculateRatingDistribution(books) {
  const distribution = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0
  };
  
  books.forEach(book => {
    if (book?.rating && book.rating > 0 && book.rating <= 5) {
      distribution[Math.round(book.rating).toString()]++;
    }
  });
  
  return distribution;
}

// Add new statistics calculations
function calculateFormatDistribution(books) {
  const formats = {};
  books.forEach(book => {
    if (book?.format) {
      const format = book.format.trim();
      if (format) {
        formats[format] = (formats[format] || 0) + 1;
      }
    }
  });
  return formats;
}

function calculatePublisherStats(books) {
  const publishers = {};
  books.forEach(book => {
    if (book?.publisher) {
      const publisher = book.publisher.trim();
      if (publisher) {
        if (!publishers[publisher]) {
          publishers[publisher] = {
            count: 0,
            books: []
          };
        }
        publishers[publisher].count++;
        publishers[publisher].books.push(book.title);
      }
    }
  });
  
  return Object.entries(publishers)
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      books: stats.books
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Update cleanup endpoint to use POST instead of DELETE
app.post('/api/cleanup', async (req, res) => {
  try {
    console.log('Starting database cleanup...');
    
    // Get user ID from body instead of query params
    const { user_id } = req.body;
    if (!user_id) {
      throw new Error('User ID is required');
    }
    
    console.log(`Cleaning up data for user: ${user_id}`);

    // Delete all books for this user
    const { error: booksError } = await supabase
      .from('books')
      .delete()
      .eq('user_id', user_id);

    if (booksError) {
      console.error('Error deleting books:', booksError);
      throw booksError;
    }
    console.log('Successfully deleted all books for user');

    // Reset user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        goodreads_user_id: null,
        last_sync: null
      })
      .eq('id', user_id);

    if (profileError) {
      console.error('Error resetting profile:', profileError);
      throw profileError;
    }
    console.log('Successfully reset user profile');

    // Verify deletion
    const { data: remainingBooks, error: checkError } = await supabase
      .from('books')
      .select('count')
      .eq('user_id', user_id);

    if (checkError) {
      console.error('Error checking remaining books:', checkError);
    } else {
      console.log('Remaining books count:', remainingBooks?.[0]?.count || 0);
    }

    res.json({ 
      message: 'User data cleaned successfully',
      remainingBooks: remainingBooks?.[0]?.count || 0
    });
  } catch (error) {
    console.error('Error cleaning database:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 