import { useState, useMemo } from 'react';
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
  LinearProgress
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

export default function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goodreadsUrl, setGoodreadsUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const user = useUser();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

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

  // Fetch books from Supabase
  const { data: books = [], isLoading: isBooksLoading } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user?.id)
        .order('date_read', { ascending: false });

      if (error) throw error;
      return data as Book[];
    },
    enabled: !!user?.id
  });

  // Group books by shelf
  const booksByShelf = useMemo(() => {
    const shelves = new Map<string, Book[]>();
    shelves.set('all', books); // Add "All" shelf

    // Group books by each shelf they belong to
    books.forEach(book => {
      if (book.shelves) {
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
    return ['all', ...Array.from(booksByShelf.keys()).filter(shelf => shelf !== 'all')];
  }, [booksByShelf]);

  // Get books for current shelf
  const currentShelfBooks = useMemo(() => {
    return booksByShelf.get(selectedShelf) || [];
  }, [booksByShelf, selectedShelf]);

  const handleGoodreadsUrlSubmit = () => {
    const goodreadsId = extractGoodreadsId(goodreadsUrl);
    if (goodreadsId) {
      handleCrawlbaseSync(goodreadsId);
      setDialogOpen(false);
      setGoodreadsUrl('');
    } else {
      setError('Invalid Goodreads URL. Please enter a valid profile URL.');
    }
  };

  const extractGoodreadsId = (url: string) => {
    try {
      // Accept any goodreads.com URL containing a numeric ID
      const match = url.match(/goodreads\.com.*?(\d+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting Goodreads ID:', error);
      return null;
    }
  };

  const handleCrawlbaseSync = async (goodreadsId?: string | null) => {
    if (!user?.id) return;

    const idToUse = goodreadsId || profile?.goodreads_user_id;
    if (!idToUse) {
      setDialogOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStats(null); // Reset stats before new sync

    try {
      console.log('Starting sync with Goodreads ID:', idToUse);
      
      // Use the API server port (3000) instead of Vite's dev server port (5173)
      const API_URL = import.meta.env.DEV 
        ? 'http://localhost:3000'
        : window.location.origin;
        
      const response = await fetch(`${API_URL}/api/crawl-goodreads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ userId: user.id, goodreadsId: idToUse })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to initialize stream reader');
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('Received SSE data:', data);
              
              if (data.error) {
                console.error('Received error:', data.error);
                setError(data.error);
                break;
              }

              if (data.progress) {
                console.log('Progress update:', data.progress);
                setSyncProgress(data.progress);
              }

              if (data.stats) {
                console.log('Received stats:', data.stats);
                setStats(data.stats);
              }

              if (data.books) {
                console.log('Received books:', data.books.length);
                // Update the books cache directly with the new data
                queryClient.setQueryData(['books', user.id], data.books);
                
                // Also invalidate to ensure we're in sync with the server
                await queryClient.invalidateQueries({ queryKey: ['books', user.id] });
                
                // Update profile cache to reflect the new goodreads_user_id
                queryClient.setQueryData(['profile', user.id], (old: any) => ({
                  ...(old || {}),
                  goodreads_user_id: idToUse,
                  last_sync: new Date().toISOString()
                }));
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, '\nLine:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync with Goodreads');
    } finally {
      setIsLoading(false);
      // Keep the final progress message visible for a moment
      setTimeout(() => {
        setSyncProgress(null);
      }, 3000);
    }
  };

  return (
    <Box sx={{ 
      pt: '64px',
      px: 3,
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom color="text.primary">
              Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              View and manage your reading statistics
            </Typography>
          </Box>
          <Box>
            {syncProgress && (
              <Box sx={{ mb: 2, minWidth: 200 }}>
                <Typography variant="body2" color="text.secondary">
                  {syncProgress.message}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(syncProgress.current / syncProgress.total) * 100}
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="text.secondary" align="right" display="block">
                  {Math.round((syncProgress.current / syncProgress.total) * 100)}%
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleCrawlbaseSync()}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sync with Goodreads'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Debug info */}
        {stats && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="info">
              <pre>{JSON.stringify(stats, null, 2)}</pre>
            </Alert>
          </Box>
        )}

        {/* Statistics Overview */}
        {stats && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom color="text.primary">
              Reading Statistics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              {/* Total Books */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">{stats.totalBooks}</Typography>
                <Typography variant="body2" color="text.secondary">Total Books</Typography>
              </Paper>

              {/* Average Rating */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">{stats.averageRating} / 5</Typography>
                <Typography variant="body2" color="text.secondary">Average Rating</Typography>
              </Paper>

              {/* Reading Progress */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">
                  {stats.readingProgress.read} Read • {stats.readingProgress.reading} Reading
                </Typography>
                <Typography variant="body2" color="text.secondary">Reading Progress</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats.readingProgress.read / stats.readingProgress.total) * 100}
                  sx={{ mt: 1 }}
                />
              </Paper>

              {/* Top Authors */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Top Authors</Typography>
                {stats.topAuthors.slice(0, 5).map(({ author, count }) => (
                  <Box key={author} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{author}</Typography>
                    <Typography variant="body2" color="text.secondary">{count} books</Typography>
                  </Box>
                ))}
              </Paper>

              {/* Rating Distribution */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Rating Distribution</Typography>
                {Object.entries(stats.ratingDistribution).map(([rating, count]) => (
                  <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Rating value={parseInt(rating)} readOnly size="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">{count} books</Typography>
                  </Box>
                ))}
              </Paper>
            </Box>
          </Box>
        )}

        {isBooksLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : books.length > 0 ? (
          <>
            <Tabs
              value={selectedShelf}
              onChange={(_, newValue) => setSelectedShelf(newValue)}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              {shelfNames.map(shelf => (
                <Tab
                  key={shelf}
                  label={shelf === 'all' ? 'All Books' : shelf}
                  value={shelf}
                  sx={{
                    textTransform: 'capitalize',
                    color: 'text.secondary',
                    '&.Mui-selected': { color: 'primary.main' }
                  }}
                />
              ))}
            </Tabs>

            <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Date Read</TableCell>
                    <TableCell>ISBN</TableCell>
                    <TableCell>Review</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentShelfBooks.map((book, index) => (
                    <TableRow key={index}>
                      <TableCell>{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        <Rating value={book.rating} readOnly max={5} />
                      </TableCell>
                      <TableCell>{book.date_read}</TableCell>
                      <TableCell>{book.isbn}</TableCell>
                      <TableCell>{book.review}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            No books found. Enter your Goodreads username to load your books.
          </Typography>
        )}

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Connect Goodreads</DialogTitle>
          <DialogContent>
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
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGoodreadsUrlSubmit} variant="contained">
              Connect
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
