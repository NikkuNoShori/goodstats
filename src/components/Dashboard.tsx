import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '../hooks/useSupabase';
import { useProfile } from '../hooks/useProfile';
import { useImageCache } from '../hooks/useImageCache';
import {
  Box,
  Typography,
  Paper,
  Rating,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Skeleton,
  Pagination,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  SelectChangeEvent
} from '@mui/material';
import Header from './common/Header';
import debounce from 'lodash/debounce';

interface Book {
  id?: number;
  user_id: string;
  goodreads_id: string;
  title: string;
  author: string;
  rating: number;
  date_read?: string;
  isbn: string;
  review: string;
  shelves?: string[];
  page_count?: number;
  cover_image?: string;
  created_at?: string;
  uniqueKey?: string;
}

interface TopAuthor {
  author: string;
  count: number;
}

interface ReadingProgress {
  read: number;
  reading: number;
  toRead: number;
  total: number;
}

interface Stats {
  totalBooks: number;
  totalShelves: number;
  averageRating: number;
  booksPerShelf: Record<string, number>;
  readingProgress: {
    read: number;
    reading: number;
    toRead: number;
    total: number;
  };
  topAuthors: Array<{
    author: string;
    count: number;
  }>;
  ratingDistribution: Record<string, number>;
  ratedBooksCount: number;
}

interface SyncProgress {
  stage: 'fetching' | 'parsing' | 'saving' | 'complete';
  current: number;
  total: number;
  message: string;
}

type SortOption = 'title_asc' | 'title_desc' | 'author_asc' | 'author_desc' | 'rating_desc' | 'rating_asc';

interface QueryError {
  message: string;
  [key: string]: any;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Image loading utility function
const getBookCoverUrl = (book: Book): string | null => {
  if (!book.isbn && !book.title) return null;

  const isbn = book.isbn?.replace(/-/g, '');
  const cleanTitle = encodeURIComponent(book.title);
  const cleanAuthor = encodeURIComponent(book.author || '');

  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  return `https://books.google.com/books/content?q=${cleanTitle}+${cleanAuthor}&zoom=1&img=1`;
};

const BookCard = ({ book }: { book: Book }) => {
  const { getCachedUrl, updateCache, shouldRetry } = useImageCache();
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      if (!book.isbn) {
        setImageUrl(getBookCoverUrl(book));
        return;
      }

      const cachedEntry = getCachedUrl(book.isbn);
      
      if (cachedEntry && cachedEntry.success) {
        setImageUrl(cachedEntry.url);
        return;
      }

      if (!shouldRetry(book.isbn)) {
        setImageError(true);
        return;
      }

      const url = getBookCoverUrl(book);
      setImageUrl(url);
    };

    setImageError(false);
    loadImage();
  }, [book, getCachedUrl, shouldRetry]);

  const handleImageError = () => {
    if (book.isbn) {
      updateCache(book.isbn, false);
    }
    setImageError(true);
  };

  const handleImageLoad = () => {
    if (book.isbn) {
      updateCache(book.isbn, true);
    }
  };

  return (
    <Paper 
      elevation={1}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
    >
      <Box 
        sx={{ 
          position: 'relative',
          paddingTop: '150%',
          width: '100%',
          overflow: 'hidden',
          bgcolor: 'grey.100'
        }}
      >
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={`Cover of ${book.title}`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'grey.200',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2
            }}
          >
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                textAlign: 'center',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                width: '100%',
                fontWeight: 500
              }}
            >
              {book.title}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                textAlign: 'center',
                fontStyle: 'italic'
              }}
            >
              by {book.author}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography 
          variant="h6" 
          component="h3" 
          sx={{ 
            fontSize: '0.95rem',
            fontWeight: 600,
            mb: 0.5,
            lineHeight: 1.2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {book.title}
        </Typography>

        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 1,
            fontSize: '0.85rem'
          }}
        >
          {book.author}
        </Typography>

        {book.rating > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating 
              value={book.rating} 
              readOnly 
              size="small" 
              precision={1}
              sx={{ 
                color: 'primary.main',
                '& .MuiRating-icon': {
                  fontSize: '0.9rem'
                }
              }}
            />
          </Box>
        )}

        {book.shelves && book.shelves.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5,
            mt: 'auto'
          }}>
            {book.shelves
              .filter(shelf => shelf.toLowerCase() !== 'all')
              .map(shelf => (
                <Chip
                  key={shelf}
                  label={shelf}
                  size="small"
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.7rem',
                    height: '20px'
                  }}
                />
              ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const LoadingSkeleton = () => (
  <Box sx={{ 
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, 1fr)',
      sm: 'repeat(3, 1fr)',
      md: 'repeat(4, 1fr)',
      lg: 'repeat(6, 1fr)'
    },
    gap: 2
  }}>
    {Array.from({ length: 24 }).map((_, i) => (
      <Skeleton 
        key={i}
        variant="rectangular"
        sx={{ 
          paddingTop: '150%',
          borderRadius: 1
        }}
      />
    ))}
  </Box>
);

const LoadingOverlay = () => (
  <Fade in={true} timeout={300}>
    <Box sx={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1
    }}>
      <CircularProgress />
    </Box>
  </Fade>
);

// Increase cache times and add retry configuration
const QUERY_CONFIG = {
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 60 * 60 * 1000, // 1 hour
  retry: false, // Disable automatic retries
  refetchOnWindowFocus: false, // Disable refetch on window focus
  refetchOnMount: false // Disable refetch on mount
};

const SyncDialog = ({ open, onClose, progress }: { open: boolean; onClose: () => void; progress: SyncProgress }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Syncing with Goodreads</DialogTitle>
      <DialogContent>
        <Box sx={{ minWidth: 400, py: 2 }}>
          <Typography variant="h6" gutterBottom>
            {progress.stage === 'complete' ? 'Sync Complete!' : 'Syncing...'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {progress.message}
          </Typography>
          
          {progress.stage !== 'complete' && (
            <LinearProgress 
              variant="determinate" 
              value={(progress.current / progress.total) * 100}
              sx={{ mt: 2 }}
            />
          )}
          
          <Typography variant="body2" sx={{ mt: 1 }}>
            {progress.current} of {progress.total} books processed
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function Dashboard() {
  const supabase = useSupabaseClient();
  const { profile, isLoading: isProfileLoading, error: profileError } = useProfile();
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 24, // 4x6 grid on large screens
    totalItems: 0,
    totalPages: 1
  });

  // Sort and filter state
  const [sortOption, setSortOption] = useState<SortOption>('title_asc');
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    stage: 'fetching',
    current: 0,
    total: 0,
    message: 'Preparing to sync...'
  });

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchQuery(value);
    }, 500),
    []
  );

  // Update debounced search
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // Handle sync with Goodreads
  const handleSync = async () => {
    setSyncDialogOpen(true);
    setSyncProgress({
      stage: 'fetching',
      current: 0,
      total: 0,
      message: 'Fetching books from Goodreads...'
    });

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to sync with Goodreads');
      }

      setSyncProgress(prev => ({
        ...prev,
        stage: 'complete',
        message: 'Successfully synced with Goodreads!'
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setSyncProgress(prev => ({
        ...prev,
        stage: 'complete',
        message: `Error syncing: ${errorMessage}`
      }));
    }
  };

  // Books query with pagination and caching
  const { data: books = [], isLoading, error } = useQuery<Book[], QueryError>({
    queryKey: ['books', profile?.id, pagination.page, pagination.pageSize, sortOption, selectedShelf, debouncedSearchQuery],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      let query = supabase
        .from('books')
        .select('*', { count: 'exact' })
        .eq('user_id', profile.id);

      // Apply shelf filter
      if (selectedShelf !== 'all') {
        query = query.contains('shelves', [selectedShelf]);
      }

      // Apply search filter
      if (debouncedSearchQuery) {
        query = query.or(`title.ilike.%${debouncedSearchQuery}%,author.ilike.%${debouncedSearchQuery}%`);
      }

      // Apply sorting
      const [field, direction] = sortOption.split('_');
      query = query.order(field, { ascending: direction === 'asc' });

      // Apply pagination
      query = query.range(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize - 1
      );

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      if (count !== null) {
        setPagination(prev => ({
          ...prev,
          totalItems: count,
          totalPages: Math.ceil(count / pagination.pageSize)
        }));
      }
      
      return data || [];
    },
    enabled: !!profile?.id,
    ...QUERY_CONFIG
  });

  // Stats query
  const { data: stats, isLoading: isStatsLoading } = useQuery<Stats, QueryError>({
    queryKey: ['stats', profile?.id],
    queryFn: async (): Promise<Stats> => {
      if (!profile?.id) {
        return {
          totalBooks: 0,
          totalShelves: 0,
          averageRating: 0,
          booksPerShelf: {},
          readingProgress: { read: 0, reading: 0, toRead: 0, total: 0 },
          topAuthors: [],
          ratingDistribution: {},
          ratedBooksCount: 0
        };
      }
      
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', profile.id);
      
      if (error) throw error;
      if (!books) {
        throw new Error('No books data returned');
      }

      // Calculate statistics
      const totalBooks = books.length;
      const shelvesList = books.flatMap(book => book.shelves || []);
      const uniqueShelves = new Set(shelvesList);
      const totalShelves = uniqueShelves.size;

      const ratedBooks = books.filter(book => book.rating > 0);
      const averageRating = ratedBooks.length > 0
        ? ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / ratedBooks.length
        : 0;

      const booksPerShelf = shelvesList.reduce<Record<string, number>>((acc, shelf) => {
        acc[shelf] = (acc[shelf] || 0) + 1;
        return acc;
      }, {});

      const readingProgress = {
        read: books.filter(book => book.shelves?.includes('read')).length,
        reading: books.filter(book => book.shelves?.includes('currently-reading')).length,
        toRead: books.filter(book => book.shelves?.includes('to-read')).length,
        total: totalBooks
      };

      const authorCounts = books.reduce<Record<string, number>>((acc, book) => {
        if (book.author) {
          acc[book.author] = (acc[book.author] || 0) + 1;
        }
        return acc;
      }, {});

      const topAuthors = Object.entries(authorCounts)
        .map(([author, count]): { author: string; count: number } => ({ 
          author, 
          count 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const ratingDistribution = books.reduce<Record<string, number>>((acc, book) => {
        if (book.rating > 0) {
          acc[book.rating.toString()] = (acc[book.rating.toString()] || 0) + 1;
        }
        return acc;
      }, {});

      return {
        totalBooks,
        totalShelves,
        averageRating,
        booksPerShelf,
        readingProgress,
        topAuthors,
        ratingDistribution,
        ratedBooksCount: ratedBooks.length
      };
    },
    enabled: !!profile?.id,
    ...QUERY_CONFIG
  });

  // Get unique shelves
  const shelves = useMemo(() => {
    const shelfSet = new Set<string>();
    books.forEach(book => {
      book.shelves?.forEach(shelf => shelfSet.add(shelf));
    });
    return ['all', ...Array.from(shelfSet)].sort();
  }, [books]);

  // Event handlers
  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    setSortOption(event.target.value as SortOption);
  };

  const handleShelfChange = (event: SelectChangeEvent<string>) => {
    setSelectedShelf(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Show loading state while profile is loading
  if (isProfileLoading) {
    return <LoadingSkeleton />;
  }

  // Show error if profile failed to load
  if (profileError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {profileError instanceof Error 
            ? profileError.message 
            : 'Failed to load profile. Please try logging in again.'}
        </Alert>
      </Box>
    );
  }

  // Show error if no profile is found
  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No profile found. Please log in again.
        </Alert>
      </Box>
    );
  }

  if (isLoading || isStatsLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading books: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pt: 8,
      px: 3
    }}>
      <Header />
      
      {/* Loading State */}
      {isLoading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Sync Dialog */}
      <SyncDialog
        open={syncDialogOpen}
        onClose={() => setSyncDialogOpen(false)}
        progress={syncProgress}
      />

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {/* Stats Section */}
        {stats && (
          <Box sx={{ maxWidth: 1200, mx: 'auto', mb: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Library Overview</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Total Books</Typography>
                  <Typography variant="h4">{stats.totalBooks}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Average Rating</Typography>
                  <Typography variant="h4">{stats.averageRating.toFixed(1)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Shelves</Typography>
                  <Typography variant="h4">{stats.totalShelves}</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Filters Section */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center' 
        }}>
          <TextField
            size="small"
            placeholder="Search books..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, maxWidth: 300 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortOption}
              label="Sort by"
              onChange={handleSortChange}
            >
              <MenuItem value="title_asc">Title (A-Z)</MenuItem>
              <MenuItem value="title_desc">Title (Z-A)</MenuItem>
              <MenuItem value="author_asc">Author (A-Z)</MenuItem>
              <MenuItem value="author_desc">Author (Z-A)</MenuItem>
              <MenuItem value="rating_desc">Rating (High-Low)</MenuItem>
              <MenuItem value="rating_asc">Rating (Low-High)</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Shelf</InputLabel>
            <Select
              value={selectedShelf}
              label="Shelf"
              onChange={handleShelfChange}
            >
              {shelves.map(shelf => (
                <MenuItem key={shelf} value={shelf}>
                  {shelf.charAt(0).toUpperCase() + shelf.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Books Grid */}
        <Box sx={{ position: 'relative' }}>
          {isLoading && <LoadingOverlay />}
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(6, 1fr)'
            },
            gap: 2,
            opacity: isLoading ? 0.3 : 1,
            transition: 'opacity 0.3s'
          }}>
            {books.map((book) => (
              <BookCard key={book.uniqueKey || book.id} book={book} />
            ))}
          </Box>

          {/* No Results */}
          {!isLoading && books.length === 0 && (
            <Box sx={{ 
              maxWidth: 1200, 
              mx: 'auto', 
              textAlign: 'center',
              mt: 4 
            }}>
              <Typography variant="h6" color="text.secondary">
                No books found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or search query
              </Typography>
            </Box>
          )}

          {/* Pagination Controls */}
          {!isLoading && books.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              mt: 4,
              mb: 2,
              gap: 2
            }}>
              <Typography variant="body2" color="text.secondary">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} books
              </Typography>
              
              <Pagination
                page={pagination.page}
                count={pagination.totalPages}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                siblingCount={1}
                boundaryCount={1}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
