import { Container, Grid, TextField, Button, Alert, Box, Typography, Paper } from '@mui/material';
import { AutoStories, ArrowForward, ImportContacts } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import BookList from './Dashboard/BookList';
import Header from './common/Header';
import { usePageTitle } from '../utils/usePageTitle';
import { goodreadsService } from '../services/goodreadsService';
import { supabase } from '../services/supabase';
import type { Book } from '../types/book';

const Dashboard = () => {
  const location = useLocation();
  const emailPending = location.state?.emailPending;
  const message = location.state?.message;

  usePageTitle('Dashboard');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Query for stored books
  const { data: storedBooks, isLoading: isLoadingStored } = useQuery({
    queryKey: ['stored-books'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('date_read', { ascending: false });

      return data as Book[];
    }
  });

  // Check if Goodreads is connected
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data } = await supabase
        .from('profiles')
        .select('goodreads_username')
        .eq('id', user.id)
        .single();

      return data;
    }
  });

  // Mutation for syncing books
  const syncMutation = useMutation({
    mutationFn: async (books: Book[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the latest sync date
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_sync')
        .eq('id', user.id)
        .single();

      // Filter books that were read after the last sync
      const lastSync = profile?.last_sync ? new Date(profile.last_sync) : new Date(0);
      const newBooks = books.filter(book => {
        const dateRead = book.dateRead ? new Date(book.dateRead) : new Date(0);
        return dateRead > lastSync;
      });

      // Insert new books
      if (newBooks.length > 0) {
        const { error } = await supabase
          .from('books')
          .upsert(newBooks.map(book => ({
            ...book,
            user_id: user.id
          })));

        if (error) throw error;

        // Update last sync date
        await supabase
          .from('profiles')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', user.id);
      }

      return newBooks.length;
    },
    onSuccess: (count) => {
      if (count > 0) {
        setError(`Successfully synced ${count} new books`);
      } else {
        setError('No new books to sync');
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to sync books');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username) {
      try {
        const books = await goodreadsService.getUserBooks(username);
        syncMutation.mutate(books);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch books');
      }
    }
  };

  return (
    <Box sx={{ background: '#1a1f2e', minHeight: '100vh' }}>
      <Header 
        title="Dashboard" 
        subtitle="Track your reading progress and insights"
      />
      
      {emailPending && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
        >
          {message || 'Please verify your email to access all features'}
        </Alert>
      )}

      {!profile?.goodreads_username ? (
        <Paper 
          sx={{ 
            p: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2 
                }}
              >
                Connect Your Goodreads Account
              </Typography>
              <Typography 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 3,
                  lineHeight: 1.6
                }}
              >
                Link your Goodreads account to automatically import your reading history 
                and track your progress. You'll be able to:
              </Typography>
              <Box component="ul" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                pl: 2,
                '& > li': { mb: 1 }
              }}>
                <li>Sync your reading history and current books</li>
                <li>Get insights about your reading habits</li>
                <li>Track your reading goals</li>
                <li>Generate reading statistics</li>
              </Box>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      fullWidth
                      label="Goodreads Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      autoComplete="off"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#7e3af2',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': {
                            color: '#7e3af2',
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'white',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Button 
                      variant="contained" 
                      type="submit"
                      fullWidth
                      disabled={!username || syncMutation.isPending}
                      startIcon={<ImportContacts />}
                      endIcon={<ArrowForward />}
                      sx={{
                        py: 1.7,
                        backgroundColor: '#7e3af2',
                        '&:hover': {
                          backgroundColor: '#6c2bd9',
                        },
                      }}
                    >
                      {syncMutation.isPending ? 'Connecting...' : 'Connect Now'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
            <Grid item xs={12} md={6} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Box 
                component="img"
                src="/reading-illustration.svg" // You'll need to add this illustration
                alt="Reading Illustration"
                sx={{ 
                  maxWidth: '100%',
                  height: 'auto',
                  opacity: 0.9
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Box sx={{ mb: 4, textAlign: 'right' }}>
          <Button
            variant="outlined"
            onClick={() => syncMutation.mutate([])}
            disabled={syncMutation.isPending}
            startIcon={<AutoStories />}
            sx={{
              py: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                borderColor: '#7e3af2',
                backgroundColor: 'rgba(126, 58, 242, 0.08)',
              },
            }}
          >
            {syncMutation.isPending ? 'Syncing...' : 'Sync Books'}
          </Button>
        </Box>
      )}

      {error && (
        <Alert 
          severity={error.includes('Successfully') ? 'success' : 'error'}
          sx={{ mt: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Show BookList only when connected */}
      {profile?.goodreads_username && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <BookList 
              books={storedBooks || []} 
              isLoading={isLoadingStored || syncMutation.isPending} 
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
