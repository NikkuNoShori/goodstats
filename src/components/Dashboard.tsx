import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '../hooks/useSupabase';
import { useProfile } from '../hooks/useProfile';
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
  const processImageUrl = (url: string) => {
    if (!url) return '';
    // Keep the base URL structure but request a larger size
    return url.replace(/\._SX\d+_|._SY\d+_/g, '._SX300_');
  };

  return (
    <Paper sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 3
      }
    }}>
      {/* Cover Image Section - adjusted aspect ratio and size */}
      <Box sx={{ 
        position: 'relative',
        paddingTop: '150%',
        width: '100%',
        overflow: 'hidden',
        bgcolor: 'grey.100'
      }}>
        {book.cover_image ? (
          <img
            src={processImageUrl(book.cover_image)}
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
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement?.querySelector('.no-cover-fallback')?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Box 
          className={`no-cover-fallback ${book.cover_image ? 'hidden' : ''}`}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            visibility: book.cover_image ? 'hidden' : 'visible'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No Cover
          </Typography>
        </Box>
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
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isSyncing, setIsSyncing] = useState(false);

  const { profile } = useProfile();
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
    const startIndex = (page - 1) * itemsPerPage;
    return books.slice(startIndex, startIndex + itemsPerPage);
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
    if (process.env.NODE_ENV === 'development' && profile) {
      console.debug('[Auth] User session initialized');
    }
  }, [profile]);

  // Update the books query with better deduplication
  const { data: books = [], isLoading: isBooksLoading, error: booksError } = useQuery({
    queryKey: ['books', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', profile.id)
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
    enabled: !!profile?.id
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

    return shelves;
  }, [books]);

  // Get unique shelf names for tabs
  const shelfNames = useMemo(() => {
    const defaultShelves = ['all', 'read', 'currently-reading', 'to-read'];
    const customShelves = Array.from(booksByShelf.keys())
      .filter(shelf => !defaultShelves.includes(shelf))
      .sort((a, b) => a.localeCompare(b));
    
    // Ensure we only include default shelves that actually have books
    const availableDefaultShelves = defaultShelves.filter(shelf => 
      shelf === 'all' || booksByShelf.has(shelf)
    );
    
    return [...availableDefaultShelves, ...customShelves];
  }, [booksByShelf]);

  // Get books for current shelf with logging
  const currentShelfBooks = useMemo(() => {
    const shelfBooks = booksByShelf.get(selectedShelf) || [];
    const sortedBooks = sortBooks(shelfBooks);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedBooks.slice(startIndex, endIndex);
  }, [booksByShelf, selectedShelf, sortBy, page, itemsPerPage]);

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
    if (!profile?.id) {
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
          userId: profile.id, 
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
      queryClient.setQueryData(['books', profile.id], finalBooks);

      // Update profile
      queryClient.setQueryData(['profile', profile.id], (old: any) => ({
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
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call cleanup endpoint with user ID
      const response = await fetch(`http://localhost:3000/api/cleanup?user_id=${profile.id}`, {
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
      queryClient.removeQueries(['books', profile.id]);
      queryClient.removeQueries(['profile', profile.id]);

      // Reset all state
      setStats(null);
      setError(null);
      setSyncProgress(null);
      setSelectedShelf('all');
      setDialogOpen(false);
      setGoodreadsUrl('');

      // Set empty data for this user
      queryClient.setQueryData(['books', profile.id], []);
      queryClient.setQueryData(['profile', profile.id], old => ({
        ...(old || {}),
        goodreads_user_id: null,
        last_sync: null
      }));

      // Force refetch to ensure UI updates
      await Promise.all([
        queryClient.refetchQueries(['books', profile.id]),
        queryClient.refetchQueries(['profile', profile.id])
      ]);

    } catch (error) {
      console.error('Error disconnecting from Goodreads:', error);
      setError(error instanceof Error ? error.message : 'Failed to disconnect from Goodreads');
    } finally {
      setIsLoading(false);
    }
  };

  // Update pagination controls
  const totalPages = Math.ceil((booksByShelf.get(selectedShelf)?.length || 0) / itemsPerPage);

  // Calculate stats whenever books change
  useEffect(() => {
    if (!books?.length) {
      setStats(null);
      return;
    }

    const totalBooks = books.length;
    const uniqueShelves = new Set(books.flatMap(book => book.shelves || []));
    const totalShelves = uniqueShelves.size;
    
    // Calculate average rating
    const totalRating = books.reduce((sum, book) => sum + (book.rating || 0), 0);
    const averageRating = totalRating / books.filter(book => book.rating > 0).length;

    // Calculate books per shelf
    const booksPerShelf: Record<string, number> = {};
    books.forEach(book => {
      (book.shelves || []).forEach(shelf => {
        booksPerShelf[shelf] = (booksPerShelf[shelf] || 0) + 1;
      });
    });

    // Calculate reading progress
    const readingProgress = {
      read: books.filter(book => book.shelves?.includes('read')).length,
      reading: books.filter(book => book.shelves?.includes('currently-reading')).length,
      toRead: books.filter(book => book.shelves?.includes('to-read')).length,
      total: totalBooks
    };

    // Calculate top authors
    const authorCounts: Record<string, number> = {};
    books.forEach(book => {
      authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    });
    const topAuthors = Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([author, count]) => ({ author, count }));

    // Calculate rating distribution
    const ratingDistribution: Record<string, number> = {};
    books.forEach(book => {
      if (book.rating) {
        ratingDistribution[book.rating] = (ratingDistribution[book.rating] || 0) + 1;
      }
    });

    setStats({
      totalBooks,
      totalShelves,
      averageRating,
      booksPerShelf,
      readingProgress,
      topAuthors,
      ratingDistribution
    });
  }, [books]);

  // Add the Statistics Overview component
  const StatisticsOverview = () => {
    if (!stats) return null;

    return (
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Read</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats.readingProgress.read / stats.readingProgress.total) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" align="right">
                  {stats.readingProgress.read} books
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Currently Reading</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats.readingProgress.reading / stats.readingProgress.total) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" align="right">
                  {stats.readingProgress.reading} books
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Want to Read</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats.readingProgress.toRead / stats.readingProgress.total) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" align="right">
                  {stats.readingProgress.toRead} books
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Rating Overview */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Rating Overview</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="span" sx={{ mr: 1 }}>
                {stats.averageRating.toFixed(1)}
              </Typography>
              <Rating 
                value={stats.averageRating} 
                readOnly 
                precision={0.1}
                sx={{ color: 'primary.main' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Average rating across {stats.totalBooks} books
            </Typography>
          </Paper>

          {/* Top Authors */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Top Authors</Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {stats.topAuthors.map(({ author, count }) => (
                    <TableRow key={author}>
                      <TableCell component="th" scope="row">
                        {author}
                      </TableCell>
                      <TableCell align="right">{count} books</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      pt: '80px',
      px: 3,
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      {/* Fixed Header */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          zIndex: 1000,
          px: 3,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box sx={{ 
          maxWidth: 1200, 
          width: '100%', 
          mx: 'auto', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box sx={{ position: 'relative', width: '32px', height: '32px' }}>
                <img 
                  src="/src/assets/logo.png" 
                  alt="" 
                  style={{ 
                    height: '100%',
                    width: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <Box
                  className="logo-fallback hidden"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 700
                  }}
                >
                  G
                </Box>
              </Box>
              GoodStats
            </Typography>
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="text"
              color="inherit"
              sx={{ 
                textTransform: 'none',
                fontWeight: selectedShelf === 'all' ? 700 : 400
              }}
              onClick={() => setSelectedShelf('all')}
            >
              Dashboard
            </Button>
            <Button
              variant="text"
              color="inherit"
              sx={{ textTransform: 'none' }}
              onClick={() => setDialogOpen(true)}
            >
              Manage Goodreads
            </Button>
            <Button
              variant="text"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              Settings
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          width: '100%'
        }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Your Library
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {books?.length} books in your collection
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {profile?.goodreads_user_id && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                Disconnect
              </Button>
            )}
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
              disabled={isLoading || isSyncing}
            >
              {profile?.goodreads_user_id ? 'Sync Books' : 'Connect Goodreads'}
            </Button>
          </Box>
        </Box>

        {/* Alerts Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: error ? 4 : 0 }}>
          {error && (
            <Alert severity="error" variant="filled" onClose={() => setError(null)}>
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
        {!isBooksLoading && books?.length > 0 && <StatisticsOverview />}

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
                Showing {Math.min(page * itemsPerPage, (booksByShelf.get(selectedShelf)?.length || 0))} of {booksByShelf.get(selectedShelf)?.length || 0} books
              </Typography>
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  MenuProps={{
                    PaperProps: {
                      elevation: 4
                    }
                  }}
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
                  value={itemsPerPage}
                  onChange={(e) => {
                    const newItemsPerPage = Number(e.target.value);
                    const currentFirstItem = (page - 1) * itemsPerPage;
                    const newPage = Math.floor(currentFirstItem / newItemsPerPage) + 1;
                    setPage(newPage);
                    setItemsPerPage(newItemsPerPage);
                  }}
                  MenuProps={{
                    PaperProps: {
                      elevation: 4
                    }
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
