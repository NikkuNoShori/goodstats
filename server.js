import express from 'express';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';
import { createRequire } from 'module';
import cors from 'cors';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const app = express();

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from Vite dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Handle Goodreads crawling
app.post('/api/crawl-goodreads', async (req, res) => {
  try {
    const { default: handler } = await import('./dist/api/crawl-goodreads.js');
    await handler(req, res);
  } catch (error) {
    console.error('Error in crawl-goodreads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Development server running on port ${PORT}`);
}); 