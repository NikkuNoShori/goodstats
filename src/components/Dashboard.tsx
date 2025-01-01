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
  Tab
} from '@mui/material';
import { makeApiCall } from '../utils/api';

interface Book {
  title: string;
  author: string;
  rating: number;
  date_read?: string;
  isbn: string;
  review: string;
  shelves?: string[];
}

export default function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goodreadsUrl, setGoodreadsUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

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
      const match = url.match(/goodreads\.com\/user\/show\/(\d+)/);
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

    try {
      await makeApiCall('/api/crawl-goodreads', {
        method: 'POST',
        body: { userId: user.id, goodreadsId: idToUse }
      });

      // Invalidate and refetch books query
      queryClient.invalidateQueries({ queryKey: ['books', user.id] });
    } catch (error) {
      console.error('API Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync with Goodreads');
    } finally {
      setIsLoading(false);
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
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleCrawlbaseSync()}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Sync with Goodreads'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
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
