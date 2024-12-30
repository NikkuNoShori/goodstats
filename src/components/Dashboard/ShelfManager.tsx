import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Autocomplete,
  Chip,
  TextField,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import { Shelf, shelfService } from '../../services/shelfService';
import { AppTheme } from '../../theme/types';

interface ShelfManagerProps {
  onShelvesSelected: (shelves: string[]) => void;
}

const ShelfManager: React.FC<ShelfManagerProps> = ({ onShelvesSelected }) => {
  const theme = useTheme<AppTheme>();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedShelves, setSelectedShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShelves = async () => {
      setLoading(true);
      try {
        const userShelves = await shelfService.getUserShelves('current-user-id');
        setShelves(userShelves);
      } catch (err) {
        setError('Failed to load shelves');
      } finally {
        setLoading(false);
      }
    };

    fetchShelves();
  }, []);

  const handleShelfChange = (event: any, newValue: Shelf[]) => {
    setSelectedShelves(newValue);
    onShelvesSelected(newValue.map(shelf => shelf.id));
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Shelf Selection
      </Typography>
      
      {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Autocomplete
        multiple
        options={shelves}
        value={selectedShelves}
        onChange={handleShelfChange}
        getOptionLabel={(option) => option.name}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder="Select shelves to view"
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={`${option.name} (${option.bookCount})`}
              {...getTagProps({ index })}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: 'white',
              }}
            />
          ))
        }
      />
    </Paper>
  );
};

export default ShelfManager; 