require('dotenv').config();

const goodreadsId = '146517206';
const goodreadsUrl = `https://www.goodreads.com/review/list/${goodreadsId}?shelf=read&sort=date_read&order=d&per_page=200&view=table`;
const crawlbaseUrl = `https://api.crawlbase.com/?token=${process.env.CRAWLBASE_TOKEN}&url=${encodeURIComponent(goodreadsUrl)}`;

console.log('Environment check:', {
  hasCrawlbaseToken: !!process.env.CRAWLBASE_TOKEN,
  token: process.env.CRAWLBASE_TOKEN?.substring(0, 5) + '...',
});

console.log('Testing Crawlbase API...');
console.log('URL:', crawlbaseUrl);

fetch(crawlbaseUrl)
  .then(response => {
    console.log('Response status:', response.status);
    return response.text();
  })
  .then(text => {
    console.log('Response text (first 200 chars):', text.substring(0, 200));
    if (text.includes('table')) {
      console.log('Success: Response contains table data');
    } else {
      console.log('Warning: Response does not contain expected table data');
    }
  })
  .catch(error => {
    console.error('Error:', error);
  }); 