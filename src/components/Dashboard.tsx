import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser, useSupabaseClient } from '../hooks/useSupabase';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  Container,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { makeApiCall } from '../utils/api';

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
  updated_at?: string;
}

interface SyncProgress {
  stage: 'fetching' | 'parsing' | 'saving' | 'complete';
  current: number;
  total: number;
  message: string;
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
  topAuthors: Array<{ author: string; count: number }>;
  ratingDistribution: Record<string, number>;
}

interface BookCardProps {
  book: Book;
}

type SortOption = 'title_asc' | 'title_desc' | 'author_asc' | 'author_desc' | 'rating_desc' | 'rating_asc';

const BookCard = ({ book }: BookCardProps) => {
  return (
    <Paper sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6
      }
    }}>
      {/* Cover Image Section - reduced size */}
      <Box sx={{ 
        position: 'relative',
        paddingTop: '112.5%', // Reduced from 150% to 112.5% (25% smaller)
        width: '100%',
        overflow: 'hidden',
        bgcolor: 'grey.100'
      }}>
        {book.cover_image ? (
          <img
            src={book.cover_image.replace(/._SX\d+_|._SY\d+_/g, '')}
            alt={`Cover of ${book.title}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              imageRendering: '-webkit-optimize-contrast'
            }}
            loading="lazy"
          />
        ) : (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="body2" color="text.secondary">
              No Cover
            </Typography>
          </Box>
        )}
      </Box>

      {/* Book Details Section - adjusted spacing */}
      <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography 
          variant="h6" 
          component="h3" 
          sx={{ 
            fontSize: '0.95rem', // Reduced from 1.1rem
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
            fontSize: '0.85rem' // Reduced font size
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
                  fontSize: '0.9rem' // Made stars slightly smaller
                }
              }}
            />
          </Box>
        )}

        {/* Shelves Tags */}
        {book.shelves && book.shelves.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5,
            mt: 'auto'
          }}>
            {book.shelves
              .filter(shelf => shelf.toLowerCase() !== 'all')
              .map((shelf) => (
                <Chip
                  key={shelf}
                  label={shelf}
                  size="small"
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.7rem', // Reduced from 0.75rem
                    height: '20px' // Reduced from 24px
                  }}
                />
              ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goodreadsUrl, setGoodreadsUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('title_asc');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [isSyncing, setIsSyncing] = useState(false);

  const user = useUser();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const sortBooks = (books: Book[]) => {
    return [...books].sort((a, b) => {
      switch (sortBy) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'author_asc':
          return a.author.localeCompare(b.author);
        case 'author_desc':
          return b.author.localeCompare(a.author);
        case 'rating_desc':
          return (b.rating || 0) - (a.rating || 0);
        case 'rating_asc':
          return (a.rating || 0) - (b.rating || 0);
        default:
          return 0;
      }
    });
  };

  const paginateBooks = (books: Book[]) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return books.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const organizeShelfNames = (shelves: string[]) => {
    const defaultShelves = ['all', 'read', 'currently-reading', 'to-read'];
    const customShelves = shelves.filter(shelf => !defaultShelves.includes(shelf));
    
    return [
      ...defaultShelves.filter(shelf => shelves.includes(shelf)),
      ...customShelves.sort((a, b) => a.localeCompare(b))
    ];
  };

  // Remove continuous auth logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user) {
      console.debug('[Auth] User session initialized');
    }
  }, [user]);

  // Update the books query with better deduplication
  const { data: books = [], isLoading: isBooksLoading, error: booksError } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // More robust deduplication using a composite key
      const uniqueBooks = new Map();
      data?.forEach(book => {
        // Create a stable unique key for each book
        const key = `${book.goodreads_id || ''}-${book.isbn || ''}-${book.title.toLowerCase()}-${book.author.toLowerCase()}`;
        if (!uniqueBooks.has(key) || 
            new Date(book.updated_at) > new Date(uniqueBooks.get(key).updated_at)) {
          uniqueBooks.set(key, {
            ...book,
            uniqueKey: key, // Add a stable unique key to each book
            shelves: book.shelves?.filter(shelf => shelf.toLowerCase() !== 'all') || []
          });
        }
      });
      
      const booksArray = Array.from(uniqueBooks.values());
      console.log('Fetched unique books count:', booksArray.length);
      return booksArray;
    },
    enabled: !!user?.id
  });

  // Fetch user's profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Group books by shelf with better logging
  const booksByShelf = useMemo(() => {
    const shelves = new Map<string, Book[]>();
    
    if (!Array.isArray(books)) {
      console.warn('Books is not an array:', books);
      return new Map([['all', []]]);
    }

    // Initialize with all books
    shelves.set('all', books);
    
    // Group books by shelf
    books.forEach(book => {
      if (book?.shelves) {
        book.shelves.forEach(shelf => {
          if (!shelves.has(shelf)) {
            shelves.set(shelf, []);
          }
          shelves.get(shelf)!.push(book);
        });
      }
    });

    console.log('Total books:', books.length);
    shelves.forEach((books, shelf) => {
      console.log(`Shelf "${shelf}":`, books.length);
    });
    
    return shelves;
  }, [books]);

  // Get unique shelf names for tabs with logging
  const shelfNames = useMemo(() => {
    const defaultShelves = ['all', 'read', 'currently-reading', 'to-read'];
    const customShelves = Array.from(booksByShelf.keys())
      .filter(shelf => !defaultShelves.includes(shelf))
      .sort((a, b) => a.localeCompare(b));
    
    // Ensure we only include default shelves that actually have books
    const availableDefaultShelves = defaultShelves.filter(shelf => 
      shelf === 'all' || booksByShelf.has(shelf)
    );
    
    const names = [...availableDefaultShelves, ...customShelves];
    console.log('Available shelves:', names);
    return names;
  }, [booksByShelf]);

  // Get books for current shelf with logging
  const currentShelfBooks = useMemo(() => {
    const books = booksByShelf.get(selectedShelf) || [];
    const sortedBooks = sortBooks(books);
    return paginateBooks(sortedBooks);
  }, [booksByShelf, selectedShelf, sortBy, page]);

  const handleGoodreadsUrlSubmit = () => {
    const goodreadsId = extractGoodreadsId(goodreadsUrl);
    if (goodreadsId) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Sync] Starting sync with Goodreads ID:', goodreadsId);
      }
      handleCrawlbaseSync(goodreadsId);
      setDialogOpen(false);
      setGoodreadsUrl('');
    } else {
      setError('Invalid Goodreads URL. Please enter a valid profile URL.');
    }
  };

  const extractGoodreadsId = (url: string) => {
    try {
      // Handle various Goodreads URL patterns
      const patterns = [
        /goodreads\.com\/user\/show\/(\d+)/,
        /goodreads\.com\/review\/list\/(\d+)/,
        /goodreads\.com\/user\/(\d+)/,
        /\/(\d+)(?:\?|$)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('[URL] Error extracting Goodreads ID:', error);
      return null;
    }
  };

  // Add this component for sync progress
  const SyncProgress = ({ progress }: { progress: SyncProgress | null }) => {
    if (!progress || progress.stage === 'complete') return null;
    
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Syncing with Goodreads
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {progress.message}
          </Typography>
        </Box>
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={(progress.current / progress.total) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {progress.current} of {progress.total}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  const handleCrawlbaseSync = async (goodreadsId?: string | null) => {
    if (!user?.id) {
      setError('Please log in to sync with Goodreads');
      return;
    }

    const idToUse = goodreadsId || profile?.goodreads_user_id;
    if (!idToUse) {
      setDialogOpen(true);
      return;
    }

    if (isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    setIsSyncing(true);
    setIsLoading(true);
    setError(null);
    setSyncProgress(null);

    try {
      const API_URL = 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/crawl-goodreads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          userId: user.id, 
          goodreadsId: idToUse 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to sync with Goodreads (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to initialize stream reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      const uniqueBooks = new Map();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) throw new Error(data.error);
              if (data.progress) setSyncProgress(data.progress);
              if (data.stats) setStats(data.stats);

              if (data.books) {
                data.books.forEach(book => {
                  const key = `${book.goodreads_id || ''}-${book.isbn || ''}-${book.title.toLowerCase()}-${book.author.toLowerCase()}`;
                  if (!uniqueBooks.has(key) || 
                      new Date(book.updated_at) > new Date(uniqueBooks.get(key).updated_at)) {
                    uniqueBooks.set(key, {
                      ...book,
                      uniqueKey: key,
                      shelves: book.shelves?.filter(shelf => shelf.toLowerCase() !== 'all') || []
                    });
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
              throw new Error('Error processing data from Goodreads');
            }
          }
        }
      }

      // Update books once at the end
      const finalBooks = Array.from(uniqueBooks.values());
      console.log('Total unique synced books:', finalBooks.length);
      
      // Update the query cache with the new books
      queryClient.setQueryData(['books', user.id], finalBooks);

      // Update profile
      queryClient.setQueryData(['profile', user.id], (old: any) => ({
        ...(old || {}),
        goodreads_user_id: idToUse,
        last_sync: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Sync Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync with Goodreads');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
      setSyncProgress(null);
    }
  };

  // Add disconnect handler
  const handleDisconnect = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call cleanup endpoint with user ID
      const response = await fetch(`http://localhost:3000/api/cleanup?user_id=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cleanup database');
      }

      // Clear React Query cache for this user's data
      queryClient.removeQueries(['books', user.id]);
      queryClient.removeQueries(['profile', user.id]);

      // Reset all state
      setStats(null);
      setError(null);
      setSyncProgress(null);
      setSelectedShelf('all');
      setDialogOpen(false);
      setGoodreadsUrl('');

      // Set empty data for this user
      queryClient.setQueryData(['books', user.id], []);
      queryClient.setQueryData(['profile', user.id], old => ({
        ...(old || {}),
        goodreads_user_id: null,
        last_sync: null
      }));

      // Force refetch to ensure UI updates
      await Promise.all([
        queryClient.refetchQueries(['books', user.id]),
        queryClient.refetchQueries(['profile', user.id])
      ]);

    } catch (error) {
      console.error('Error disconnecting from Goodreads:', error);
      setError(error instanceof Error ? error.message : 'Failed to disconnect from Goodreads');
    } finally {
      setIsLoading(false);
    }
  };

  // Update pagination controls
  const totalPages = Math.ceil((booksByShelf.get(selectedShelf)?.length || 0) / ITEMS_PER_PAGE);

  return (
    <Box sx={{ 
      pt: '80px',
      px: 3,
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          width: '100%'
        }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage your reading statistics
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (profile?.goodreads_user_id) {
                handleCrawlbaseSync(profile.goodreads_user_id);
              } else {
                setDialogOpen(true);
              }
            }}
            disabled={isLoading}
            sx={{ height: 'fit-content' }}
          >
            Sync with Goodreads
          </Button>
        </Box>

        {/* Alerts Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: error ? 4 : 0 }}>
          {error && (
            <Alert severity="error" variant="filled">
              {error}
            </Alert>
          )}
          {booksError && (
            <Alert severity="error" variant="filled">
              Error loading books: {booksError.message}
            </Alert>
          )}
        </Box>

        {/* Sync Progress */}
        {syncProgress && <SyncProgress progress={syncProgress} />}

        {/* Statistics Overview */}
        {stats && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom color="text.primary">
              Reading Statistics
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: 2 
            }}>
              {/* Reading Progress */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Reading Progress</Typography>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="h4" sx={{ mb: 0.5 }}>{stats.totalBooks}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Books</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { label: 'Read', value: stats.readingProgress?.read || 0, color: 'success.main' },
                    { label: 'Currently Reading', value: stats.readingProgress?.reading || 0, color: 'info.main' },
                    { label: 'Want to Read', value: stats.readingProgress?.toRead || 0, color: 'warning.main' }
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 0.5
                      }}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                        <Typography variant="body2">{value}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.totalBooks ? (value / stats.totalBooks) * 100 : 0}
                        sx={{ 
                          height: 4, 
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: color
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Top Authors */}
              {stats.topAuthors?.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Top Authors</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {stats.topAuthors
                      .slice(0, 5)
                      .map(({ author, count }) => (
                        <Box key={author} sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Typography variant="body2">{author}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} {count === 1 ? 'book' : 'books'}
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                </Paper>
              )}

              {/* Ratings */}
              {stats.averageRating > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Ratings</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ mb: 0.5 }}>{stats.averageRating.toFixed(1)}</Typography>
                    <Typography variant="body2" color="text.secondary">Average Rating</Typography>
                  </Box>
                  {stats.ratingDistribution && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {Object.entries(stats.ratingDistribution)
                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                        .map(([rating, count]) => count > 0 && (
                          <Box key={rating} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={parseInt(rating)} readOnly size="small" />
                            <Box sx={{ flexGrow: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(count / stats.totalBooks) * 100}
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ minWidth: 30 }} align="right">
                              {count}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          </Box>
        )}

        {/* Shelf Tabs */}
        {books?.length > 0 && (
          <Paper 
            elevation={2} 
            sx={{ 
              mb: 4, 
              borderRadius: 2, 
              overflow: 'hidden',
              bgcolor: 'background.paper'
            }}
          >
            <Tabs
              value={selectedShelf}
              onChange={(_, newValue) => {
                setSelectedShelf(newValue);
                setPage(1); // Reset to first page when changing shelves
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                minHeight: 56,
                '& .MuiTabs-flexContainer': {
                  gap: 1, // Add spacing between tabs
                },
                '& .MuiTab-root': {
                  textTransform: 'capitalize',
                  minWidth: 'auto', // Allow tabs to be more compact
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  py: 2,
                  px: 2.5, // Add horizontal padding
                  '&.Mui-selected': {
                    color: 'primary.main',
                    fontWeight: 600
                  }
                }
              }}
            >
              {shelfNames.map(shelf => {
                const count = booksByShelf.get(shelf)?.length || 0;
                const label = shelf === 'all' 
                  ? 'All Books'
                  : shelf === 'currently-reading'
                  ? 'Reading'
                  : shelf === 'to-read'
                  ? 'Want to Read'
                  : shelf === 'read'
                  ? 'Read'
                  : shelf;

                return (
                  <Tab
                    key={shelf}
                    label={
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: 'inherit',
                        whiteSpace: 'nowrap'
                      }}>
                        <span>{label}</span>
                        <Chip
                          label={count}
                          size="small"
                          sx={{ 
                            bgcolor: 'action.selected',
                            color: 'text.secondary',
                            height: 24,
                            '& .MuiChip-label': {
                              px: 1,
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                      </Box>
                    }
                    value={shelf}
                  />
                );
              })}
            </Tabs>
          </Paper>
        )}

        {isBooksLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : books?.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {Math.min(page * ITEMS_PER_PAGE, (booksByShelf.get(selectedShelf)?.length || 0))} of {booksByShelf.get(selectedShelf)?.length || 0} books
              </Typography>
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <MenuItem value="title_asc">Title (A-Z)</MenuItem>
                  <MenuItem value="title_desc">Title (Z-A)</MenuItem>
                  <MenuItem value="author_asc">Author (A-Z)</MenuItem>
                  <MenuItem value="author_desc">Author (Z-A)</MenuItem>
                  <MenuItem value="rating_desc">Rating (High to Low)</MenuItem>
                  <MenuItem value="rating_asc">Rating (Low to High)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(6, 1fr)'  // Increased from 5 to 6 columns to make cards smaller
              },
              gap: 1.5  // Reduced gap from 2 to 1.5
            }}>
              {currentShelfBooks?.map((book) => (
                <BookCard 
                  key={book.uniqueKey}
                  book={book} 
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4, gap: 2 }}>
              <Button
                disabled={page === 1}
                onClick={() => setPage(1)}
                variant="outlined"
                size="small"
              >
                First
              </Button>
              <Button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                variant="outlined"
              >
                Previous
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mx: 2 }}>
                <Typography variant="body2">
                  Page {page} of {totalPages}
                </Typography>
              </Box>
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                variant="outlined"
              >
                Next
              </Button>
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                variant="outlined"
                size="small"
              >
                Last
              </Button>
            </Box>

            {/* Update the items per page control */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={ITEMS_PER_PAGE}
                  onChange={(e) => {
                    const newItemsPerPage = Number(e.target.value);
                    const currentFirstItem = (page - 1) * ITEMS_PER_PAGE;
                    const newPage = Math.floor(currentFirstItem / newItemsPerPage) + 1;
                    setPage(newPage);
                    setItemsPerPage(newItemsPerPage);
                  }}
                >
                  <MenuItem value={12}>12 per page</MenuItem>
                  <MenuItem value={24}>24 per page</MenuItem>
                  <MenuItem value={48}>48 per page</MenuItem>
                  <MenuItem value={96}>96 per page</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No books found. Enter your Goodreads profile URL to load your books.
            </Typography>
          </Paper>
        )}
      </Box>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: '125%',  // Make it 25% larger
            maxWidth: '600px'  // Set a reasonable max width
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.5rem', pb: 2 }}>Connect Goodreads</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Goodreads Profile URL"
            type="url"
            fullWidth
            variant="outlined"
            value={goodreadsUrl}
            onChange={(e) => setGoodreadsUrl(e.target.value)}
            placeholder="https://www.goodreads.com/user/show/YOUR_ID"
            error={!!error}
            helperText={error}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGoodreadsUrlSubmit} variant="contained">
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
