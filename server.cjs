const express = require('express');
const cors = require('cors');
const { handler } = require('./api/crawl-goodreads');
require('dotenv').config();

const app = express();
const port = 3000;

// Enable CORS for development
app.use(cors());
app.use(express.json());

// Forward /api/crawl-goodreads requests to the handler
app.post('/api/crawl-goodreads', async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 