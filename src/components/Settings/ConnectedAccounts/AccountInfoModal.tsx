import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../../../services/supabase';

interface AccountInfoModalProps {
  open: boolean;
  onClose: () => void;
}

interface BookStats {
  total_books: number;
  books_this_year: number;
  avg_rating: number;
  last_sync: string;
}

export const AccountInfoModal = ({ open, onClose }: AccountInfoModalProps) => {
  const { data: stats } = useQuery({
    queryKey: ['bookStats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data } = await supabase.rpc('get_book_stats', { p_user_id: user.id });
      return data as BookStats;
    },
    enabled: open
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Account Information</DialogTitle>
      <DialogContent>
        <List>
          <ListItem>
            <ListItemText primary="Total Books" secondary={stats?.total_books || 0} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Books Read This Year" secondary={stats?.books_this_year || 0} />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Average Rating"
              secondary={stats?.avg_rating?.toFixed(1) || 'N/A'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Last Sync"
              secondary={stats?.last_sync ? new Date(stats.last_sync).toLocaleString() : 'Never'}
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
