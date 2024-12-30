export interface Book {
  id: string;
  title: string;
  author: string;
  rating?: number;
  dateRead?: string;
  coverImage?: string;
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
