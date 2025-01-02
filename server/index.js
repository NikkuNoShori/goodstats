import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize OAuth
const oauth = new OAuth({
  consumer: {
    key: process.env.GOODREADS_API_KEY,
    secret: process.env.GOODREADS_API_SECRET
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64');
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    path: req.path
  });
});

// 404 handler
app.use((req, res) => {
  console.error('Route not found:', req.method, req.path);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Auth Routes
app.get('/api/auth/goodreads', async (req, res) => {
  try {
    const requestData = {
      url: 'https://www.goodreads.com/oauth/request_token',
      method: 'POST',
      data: { 
        oauth_callback: `${process.env.VITE_APP_URL}/auth/goodreads/callback`
      }
    };

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: oauth.toHeader(oauth.authorize(requestData))
    });

    if (!response.ok) {
      throw new Error('Failed to get request token');
    }

    const data = await response.text();
    const params = new URLSearchParams(data);
    const token = params.get('oauth_token');

    // Redirect to Goodreads authorization page
    res.redirect(`https://www.goodreads.com/oauth/authorize?oauth_token=${token}`);
  } catch (error) {
    console.error('Auth initialization failed:', error);
    res.redirect(`${process.env.VITE_APP_URL}/dashboard?error=auth_failed`);
  }
});

app.get('/api/auth/callback', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;

    if (!oauth_token || !oauth_verifier) {
      throw new Error('Missing OAuth token or verifier');
    }

    const requestData = {
      url: 'https://www.goodreads.com/oauth/access_token',
      method: 'POST',
      data: { 
        oauth_token,
        oauth_verifier
      }
    };

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: oauth.toHeader(oauth.authorize(requestData))
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.text();
    const params = new URLSearchParams(data);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');

    // Get Goodreads user ID
    const userRequestData = {
      url: 'https://www.goodreads.com/api/auth_user',
      method: 'GET',
      data: {}
    };

    const userResponse = await fetch(userRequestData.url, {
      headers: oauth.toHeader(oauth.authorize(userRequestData, { key: accessToken, secret: accessTokenSecret }))
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userXml = await userResponse.text();
    const userId = userXml.match(/<user id="(\d+)">/)?.[1];
    const username = userXml.match(/<name>([^<]+)<\/name>/)?.[1];

    if (!userId || !username) {
      throw new Error('Failed to parse user info');
    }

    // Store the connection in Supabase
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1]);
    if (!user) {
      throw new Error('Not authenticated');
    }

    await supabase
      .from('profiles')
      .update({
        goodreads_username: username,
        goodreads_id: userId,
        goodreads_token: accessToken,
        goodreads_token_secret: accessTokenSecret
      })
      .eq('id', user.id);

    res.redirect(`${process.env.VITE_APP_URL}/dashboard`);
  } catch (error) {
    console.error('Auth callback failed:', error);
    res.redirect(`${process.env.VITE_APP_URL}/dashboard?error=auth_failed`);
  }
});

// Sync Route
app.post('/api/sync-goodreads', async (req, res) => {
  try {
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1]);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('goodreads_username')
      .eq('id', user.id)
      .single();

    if (!profile?.goodreads_username) {
      return res.status(400).json({ error: 'Goodreads account not connected' });
    }

    // Use Crawlbase to scrape Goodreads
    const url = `https://www.goodreads.com/review/list/${profile.goodreads_username}?shelf=read`;
    const crawlbaseUrl = `https://api.crawlbase.com/?token=${process.env.CRAWLBASE_TOKEN}&url=${encodeURIComponent(url)}`;
    
    const response = await fetch(crawlbaseUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch Goodreads data');
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const books = [];

    $('.bookalike').each((_, element) => {
      const book = {
        goodreads_id: $(element).attr('id'),
        title: $('.title a', element).text().trim(),
        author: $('.author a', element).text().trim(),
        rating: parseInt($('.rating', element).text().trim()) || 0,
        date_read: $('.date_read span', element).attr('title'),
        cover_image: $('.cover img', element).attr('src'),
        user_id: user.id
      };
      books.push(book);
    });

    // Store books in Supabase
    const { error: upsertError } = await supabase
      .from('books')
      .upsert(books, { onConflict: 'goodreads_id,user_id' });

    if (upsertError) {
      throw upsertError;
    }

    // Update last sync time
    await supabase
      .from('profiles')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', user.id);

    res.json({ success: true, count: books.length });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 