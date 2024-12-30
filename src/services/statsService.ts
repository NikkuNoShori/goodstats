import { Book } from '../types/book';

export interface ReadingStats {
  totalBooks: number;
  totalPages: number;
  readingStreak: number;
  averageRating: number;
  monthlyProgress: { month: string; books: number }[];
  genreDistribution: { name: string; value: number }[];
  recentBooks: Book[];
  trends: {
    books: { period: string; current: number; previous: number; percentageChange: number };
    pages: { period: string; current: number; previous: number; percentageChange: number };
  };
  pace: {
    pagesPerDay: number;
    booksPerMonth: number;
    estimatedYearlyTotal: number;
  };
  topAuthors: { name: string; booksRead: number; averageRating: number }[];
  readingHours: { morning: number; afternoon: number; evening: number };
  completionRate: number;
  averageBookLength: number;
}

export interface PopularAuthor {
  name: string;
  booksRead: number;
  averageRating: number;
}

export const statsService = {
  calculateStats: (books: Book[]): ReadingStats => {
    // Sort books by date read
    const sortedBooks = [...books].sort((a, b) => 
      new Date(b.dateRead || 0).getTime() - new Date(a.dateRead || 0).getTime()
    );

    // Calculate basic stats
    const totalBooks = books.length;
    const totalPages = books.reduce((sum, book) => sum + (book.pageCount || 0), 0);
    const averageRating = books.reduce((sum, book) => sum + (book.rating || 0), 0) / totalBooks;

    // Calculate reading streak
    const readingStreak = calculateReadingStreak(sortedBooks);

    // Calculate monthly progress
    const monthlyProgress = calculateMonthlyProgress(sortedBooks);

    // Calculate genre distribution
    const genreDistribution = calculateGenreDistribution(books);

    // Calculate top authors
    const topAuthors = calculateTopAuthors(books);

    // Calculate reading pace
    const pace = calculateReadingPace(sortedBooks);

    return {
      totalBooks,
      totalPages,
      readingStreak,
      averageRating,
      monthlyProgress,
      genreDistribution,
      recentBooks: sortedBooks.slice(0, 5),
      trends: calculateTrends(sortedBooks),
      pace,
      topAuthors,
      readingHours: calculateReadingHours(books),
      completionRate: 95, // TODO: Implement actual calculation
      averageBookLength: Math.round(totalPages / totalBooks)
    };
  }
};

// Helper functions
const calculateReadingStreak = (books: Book[]): number => {
  // Implementation
  return 0;
};

const calculateMonthlyProgress = (books: Book[]): { month: string; books: number }[] => {
  // Implementation
  return [];
};

const calculateGenreDistribution = (books: Book[]): { name: string; value: number }[] => {
  // Implementation
  return [];
};

const calculateTopAuthors = (books: Book[]): PopularAuthor[] => {
  // Implementation
  return [];
};

const calculateReadingPace = (books: Book[]) => {
  // Implementation
  return {
    pagesPerDay: 0,
    booksPerMonth: 0,
    estimatedYearlyTotal: 0
  };
};

const calculateTrends = (books: Book[]) => {
  // Implementation
  return {
    books: { period: 'Last Month', current: 0, previous: 0, percentageChange: 0 },
    pages: { period: 'Last Month', current: 0, previous: 0, percentageChange: 0 }
  };
};

const calculateReadingHours = (books: Book[]) => {
  // Implementation
  return { morning: 0, afternoon: 0, evening: 0 };
}; 