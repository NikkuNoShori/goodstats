import { Book } from '../types/book';

export interface MonthlyProgress {
  month: string;
  books: number;
}

export interface GenreDistribution {
  name: string;
  value: number;
}

export interface ReadingPace {
  date: string;
  pages: number;
}

export interface MockData {
  monthlyProgress: MonthlyProgress[];
  genreDistribution: GenreDistribution[];
  readingPace: ReadingPace[];
  mockBook: Book;
}
