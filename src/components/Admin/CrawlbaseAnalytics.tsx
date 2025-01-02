import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
  LinearProgress
} from '@mui/material';
import { crawlbaseService } from '../../services/crawlbaseService';

const CrawlbaseAnalytics = () => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['crawlbase-analytics'],
    queryFn: () => crawlbaseService.getAnalytics()
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 3 }}>
        Error loading analytics: {error.message}
      </Typography>
    );
  }

  if (!analytics) {
    return (
      <Typography sx={{ p: 3 }}>
        No analytics data available
      </Typography>
    );
  }

  const apiTypes = ['javascript', 'screenshots', 'storage', 'leads'] as const;

  return (
    <Stack spacing={3} direction={{ xs: 'column', md: 'row' }} flexWrap="wrap">
      {apiTypes.map((type) => (
        <Box key={type} flex={1} minWidth={300}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                {type} API
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  API Calls Used
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(analytics[type].total_calls / 10000) * 100}
                  sx={{ mt: 1, mb: 0.5 }}
                />
                <Typography variant="body2">
                  {analytics[type].total_calls} / 10,000
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Remaining Calls
                </Typography>
                <Typography variant="h6">
                  {analytics[type].remaining_calls.toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last API Call
                </Typography>
                <Typography>
                  {analytics[type].last_call 
                    ? new Date(analytics[type].last_call).toLocaleString()
                    : 'Never'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Stack>
  );
};

export default CrawlbaseAnalytics; 