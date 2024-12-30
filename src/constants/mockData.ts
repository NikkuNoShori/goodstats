import { MockData } from './types';

export const mockReadingData: MockData = {
  monthlyProgress: [
    { month: 'Jan', books: 3 },
    { month: 'Feb', books: 4 },
    { month: 'Mar', books: 2 },
    { month: 'Apr', books: 5 },
    { month: 'May', books: 3 },
    { month: 'Jun', books: 4 },
  ],

  genreDistribution: [
    { name: 'Fiction', value: 45 },
    { name: 'Non-Fiction', value: 25 },
    { name: 'Science', value: 15 },
    { name: 'History', value: 15 },
  ],

  readingPace: [
    { date: 'Mon', pages: 30 },
    { date: 'Tue', pages: 45 },
    { date: 'Wed', pages: 25 },
    { date: 'Thu', pages: 60 },
    { date: 'Fri', pages: 35 },
    { date: 'Sat', pages: 50 },
    { date: 'Sun', pages: 40 },
  ],

  mockBook: {
    id: '1',
    title: 'Sample Book',
    author: 'John Doe',
    isbn: '1234567890',
    isbn13: '1234567890123',
    rating: 4,
    dateRead: '2024-01-01',
    dateStarted: '2023-12-15',
    shelves: ['read', 'favorites'],
    pageCount: 300,
    format: 'Paperback',
    publisher: 'Sample Publisher',
    publishedDate: '2023-01-01',
    genres: ['Fiction', 'Fantasy'],
    description: 'A sample book description',
    coverImage: 'https://example.com/cover.jpg',
    link: 'https://example.com/book'
  }
};

export const CHART_COLORS = ['#7C3AED', '#EC4899', '#9F67FF', '#F472B6'] as const; 