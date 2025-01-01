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
  console.log('Received request:', {
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  const { userId, goodreadsId } = req.body;

  if (!userId || !goodreadsId) {
    console.log('Missing required fields:', { userId, goodreadsId });
    return res.status(400).json({ message: 'User ID and Goodreads ID are required' });
  }

  try {
    // First try to fetch the profile
    console.log('Fetching profile from Supabase for user:', userId);
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Initial profile query result:', { profile, error: profileError });

    // If profile doesn't exist, create it
    if (profileError?.code === 'PGRST116') {
      console.log('Profile not found, attempting to create new profile with data:', {
        id: userId,
        goodreads_user_id: goodreadsId,
        updated_at: new Date().toISOString()
      });

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            goodreads_user_id: goodreadsId,
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Failed to create profile:', {
          error: createError,
          code: createError.code,
          message: createError.message,
          details: createError.details
        });
        return res.status(500).json({ 
          message: 'Failed to create profile',
          error: createError.message,
          details: createError.details
        });
      }

      console.log('Successfully created new profile:', newProfile);
      profile = newProfile;
    } else if (profileError) {
      console.error('Supabase error:', profileError);
      return res.status(500).json({ message: 'Failed to fetch profile' });
    }

    // Update the Goodreads ID if it's different
    if (profile && profile.goodreads_user_id !== goodreadsId) {
      console.log('Updating Goodreads ID in profile from', profile.goodreads_user_id, 'to', goodreadsId);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          goodreads_user_id: goodreadsId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update profile:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details
        });
        return res.status(500).json({ message: 'Failed to update profile' });
      }
      console.log('Successfully updated profile with new Goodreads ID');
    }

    // Make the request to Crawlbase
    const goodreadsUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=read&sort=date_read&order=d&per_page=200&view=table`;
    const crawlbaseUrl = `https://api.crawlbase.com/?token=${process.env.CRAWLBASE_TOKEN}&url=${encodeURIComponent(goodreadsUrl)}&format=html`;

    console.log('Making request to Crawlbase:', {
      goodreadsUrl,
      crawlbaseUrlStart: crawlbaseUrl.substring(0, 50) + '...'
    });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 second timeout

      const response = await fetch(crawlbaseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal,
        timeout: 30000
      });

      clearTimeout(timeout);
      console.log('Crawlbase response status:', response.status);

      const text = await response.text();
      console.log('Crawlbase response preview:', text.substring(0, 200));

      if (!response.ok) {
        console.error('Crawlbase error:', text);
        return res.status(response.status).json({
          message: 'Failed to fetch Goodreads data',
          error: text
        });
      }

      // Parse the HTML response
      const $ = cheerio.load(text);
      const books = [];

      // Find the table rows containing book data
      $('tr.bookalike').each((i, element) => {
        const $row = $(element);
        const title = $row.find('td.field.title a').text().trim();
        const author = $row.find('td.field.author a').text().trim();
        const rating = parseInt($row.find('td.field.rating .staticStars').attr('title')?.split(' ')[1] || '0');
        const dateRead = $row.find('td.field.date_read span').attr('title');
        const isbn = $row.find('td.field.isbn span').text().trim();
        const review = $row.find('td.field.review span').text().trim();

        if (title) {
          books.push({
            title,
            author,
            rating,
            dateRead,
            isbn,
            review
          });
        }
      });

      // Update the profile with last sync time
      await supabase
        .from('profiles')
        .update({ 
          last_sync: new Date().toISOString()
        })
        .eq('id', userId);

      return res.json({
        message: 'Success',
        books,
        totalBooks: books.length
      });

    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({
        message: 'Failed to fetch from Crawlbase',
        error: fetchError.message,
        code: fetchError.code
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Ready to handle requests...');
}); 