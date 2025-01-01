import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { crawlbaseService } from '../services/crawlbaseService';
import Header from './common/Header';
import BookList from './Dashboard/BookList';
import { Book } from '../types/book';
import { Session } from '@supabase/supabase-js';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goodreadsUrl, setGoodreadsUrl] = useState('');
  const queryClient = useQueryClient();

  // Get the base URL based on environment
  const baseUrl = import.meta.env.DEV 
    ? 'http://localhost:3000' 
    : (import.meta.env.VITE_APP_URL || 'https://goodstats.vercel.app');

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session as Session | null;
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);

      // If we have a user ID, ensure they have a profile
      if (currentUserId) {
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error fetching profile:', fetchError);
          return;
        }

        // If profile doesn't exist, create it
        if (!existingProfile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: currentUserId,
              updated_at: new Date().toISOString()
            }]);

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
        }
      }
    };
    checkSession();
  }, []);

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['books', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .order('date_read', { ascending: false });
      
      if (error) throw error;
      return data as Book[];
    },
    enabled: !!userId
  });

  const extractGoodreadsId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      // Handle different Goodreads URL formats
      const pathParts = urlObj.pathname.split('/');
      // Look for a numeric ID in the path
      for (const part of pathParts) {
        if (/^\d+$/.test(part)) {
          return part;
        }
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const handleUrlSubmit = async () => {
    const goodreadsId = extractGoodreadsId(goodreadsUrl);
    if (!goodreadsId) {
      setError('Invalid Goodreads URL. Please provide a valid profile URL.');
      return;
    }

    try {
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        throw new Error(`Failed to fetch profile: ${fetchError.message}`);
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              goodreads_user_id: goodreadsId,
              updated_at: new Date().toISOString()
            }
          ]);

        if (insertError) {
          console.error('Error inserting profile:', insertError);
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            goodreads_user_id: goodreadsId,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }
      }

      setDialogOpen(false);
      setGoodreadsUrl('');
      handleCrawlbaseSync(goodreadsId);
    } catch (err) {
      console.error('Profile operation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleCrawlbaseSync = async (existingGoodreadsId?: string) => {
    if (!userId) {
      setError('Please sign in to sync your books');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // If we have an existing ID from the parameter, use it directly
      if (existingGoodreadsId) {
        console.log('Using provided Goodreads ID:', existingGoodreadsId);
        
        // Check API usage limit
        const canMakeCall = await crawlbaseService.checkUsageLimit(userId, 'javascript');
        if (!canMakeCall) {
          setError('You have reached your API usage limit for today');
          return;
        }

        // Make the API call with the provided ID
        await makeApiCall(userId, existingGoodreadsId);
        return;
      }

      // Otherwise, check the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('goodreads_user_id')
        .eq('id', userId)
        .single();

      console.log('Profile from database:', profile);

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch profile');
      }

      // If no Goodreads ID in profile, show the dialog
      if (!profile?.goodreads_user_id) {
        console.log('No Goodreads ID found in profile, showing dialog');
        setDialogOpen(true);
        setIsLoading(false);
        return;
      }

      // Use the ID from profile
      console.log('Using Goodreads ID from profile:', profile.goodreads_user_id);

      // Check API usage limit
      const canMakeCall = await crawlbaseService.checkUsageLimit(userId, 'javascript');
      if (!canMakeCall) {
        setError('You have reached your API usage limit for today');
        return;
      }

      // Make the API call
      await makeApiCall(userId, profile.goodreads_user_id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync with Goodreads');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to make the API call
  const makeApiCall = async (userId: string, goodreadsId: string) => {
    console.log('Making API call with:', { userId, goodreadsId });

    const response = await fetch(`${baseUrl}/api/crawl-goodreads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, goodreadsId })
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('API Error:', data);
      throw new Error(data.message || 'Failed to sync with Goodreads');
    }

    const result = await response.json();
    console.log('Sync result:', result);

    // Increment API usage
    await crawlbaseService.incrementUsage(userId, 'javascript');

    // Invalidate books query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['books', userId] });
  };

  return (
    <>
      <Header title="" />
      <Box sx={{ 
        background: '#1a1f2e', 
        minHeight: '100vh',
        pt: '88px',
        px: 2
      }}>
        <Box sx={{ 
          maxWidth: '1200px',
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {/* Header Section */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mt: 3,
          }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  Home
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  /
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  Dashboard
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  mb: 0.5,
                  lineHeight: 1.2,
                }}
              >
                Dashboard
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.2,
                }}
              >
                View and manage your reading statistics
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={() => handleCrawlbaseSync()}
              disabled={isLoading}
              sx={{ minWidth: 200 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sync with Goodreads'
              )}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <BookList books={books || []} isLoading={booksLoading} />
        </Box>
      </Box>

      {/* Goodreads URL Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => {
          setDialogOpen(false);
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Connect Your Goodreads Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please enter your Goodreads profile URL to sync your reading history.
          </Typography>
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
          <Button onClick={() => {
            setDialogOpen(false);
            setError(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleUrlSubmit} variant="contained">
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Dashboard;
