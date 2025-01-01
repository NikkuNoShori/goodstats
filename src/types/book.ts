export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  isbn?: string;
  isbn13?: string;
  asin?: string;
  num_pages?: number;
  avg_rating?: number;
  user_rating?: number;
  date_read?: string;
  date_added?: string;
  date_started?: string;
  date_updated?: string;
  shelves?: string[];
  format?: string;
  review?: string;
  goodreads_id: string;
  cover_url?: string;
  cover_storage_path?: string;
  updated_at: string;
}

export interface BookDetails extends Book {
  series?: {
    name: string;
    position: number;
  };
  awards?: string[];
  similar_books?: string[];
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
