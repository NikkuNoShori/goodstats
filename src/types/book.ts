export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  isbn13: string;
  rating: number;
  dateRead: string | null;
  dateStarted: string | null;
  shelves: string[];
  pageCount: number;
  format: string;
  publisher: string;
  publishedDate: string;
  genres: string[];
  description: string;
  coverImage: string;
  link: string;
}

export interface BookDetails extends Book {
  series?: {
    name: string;
    position: number;
  };
  awards?: string[];
  similarBooks?: string[];
  quotes?: string[];
  reviews?: {
    id: string;
    rating: number;
    text: string;
    user: {
      id: string;
      name: string;
    };
    date: string;
  }[];
} 