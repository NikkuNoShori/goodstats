import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent,
  useTheme,
  alpha,
  Stack
} from '@mui/material';
import {
  MenuBook,
  Speed,
  TrendingUp,
  StarRate,
  Schedule,
  Person,
  AutoStories,
  Timeline,
  Info,
  Settings
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AppTheme } from '../theme/types';
import { statsService } from '../services/statsService';
import { goodreadsService } from '../services/goodreadsService';
import {
  Tooltip as MuiTooltip, 
  IconButton, 
  LinearProgress,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import WorkInProgress from './common/WorkInProgress';
import { ReadingStats, PopularAuthor } from '../services/statsService';
import BookList from './Dashboard/BookList';
import { mockReadingData, CHART_COLORS } from '../constants/mockData';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../utils/usePageTitle';
import LoadingScreen from './common/LoadingScreen';
import PageHeader from './common/PageHeader';
import ShelfManager from './Dashboard/ShelfManager';

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  info?: string;
  onClick?: () => void;
}> = ({ title, value, icon, trend, info, onClick }) => {
  const theme = useTheme<AppTheme>();
  
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'primary.main',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                mr: 2
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
          </Box>
          {info && (
            <MuiTooltip title={info}>
              <IconButton size="small">
                <Info fontSize="small" />
              </IconButton>
            </MuiTooltip>
          )}
        </Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {value}
        </Typography>
        {trend && (
          <Typography 
            variant="body2" 
            color={trend.startsWith('+') ? 'success.main' : 'error.main'} 
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <TrendingUp sx={{ mr: 0.5 }} fontSize="small" />
            {trend}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const ReadingPaceChart: React.FC<{ data: any[] }> = ({ data }) => {
  const theme = useTheme<AppTheme>();
  const [timeRange, setTimeRange] = React.useState('week');

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Reading Pace</Typography>
        <ToggleButtonGroup
          size="small"
          value={timeRange}
          exclusive
          onChange={(_, value) => value && setTimeRange(value)}
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="year">Year</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="paceColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area 
            type="monotone" 
            dataKey="pages" 
            stroke={theme.palette.primary.main}
            fillOpacity={1}
            fill="url(#paceColor)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

const TopAuthors: React.FC<{ authors: PopularAuthor[] }> = ({ authors }) => (
  <Paper sx={{ p: 3, height: '100%' }}>
    <Typography variant="h6" sx={{ mb: 3 }}>
      Top Authors
    </Typography>
    <List>
      {authors.map((author, index) => (
        <ListItem key={author.name}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: (theme) => theme.palette.primary.main }}>
              <Person />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={author.name}
            secondary={`${author.booksRead} books • ${author.averageRating.toFixed(1)} avg rating`}
          />
        </ListItem>
      ))}
    </List>
  </Paper>
);

const ReadingGoals: React.FC<{ goals: any }> = ({ goals }) => (
  <Paper sx={{ p: 3, height: '100%' }}>
    <Typography variant="h6" sx={{ mb: 3 }}>
      Reading Goals
    </Typography>
    <Stack spacing={3}>
      {Object.entries(goals).map(([goal, progress]: [string, any]) => (
        <Box key={goal}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {goal}
            </Typography>
            <Typography variant="body2" color="text.primary">
              {progress.current}/{progress.target}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(progress.current / progress.target) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      ))}
    </Stack>
  </Paper>
);

const Dashboard: React.FC = () => {
  usePageTitle('Dashboard');
  const theme = useTheme<AppTheme>();
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<ReadingStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedShelves, setSelectedShelves] = useState<string[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const books = await goodreadsService.getUserBooks('your-user-id', selectedShelves);
        const calculatedStats = statsService.calculateStats(books);
        setStats(calculatedStats);
      } catch (error) {
        console.error('Error fetching reading stats:', error);
        setStats({
          totalBooks: 24,
          totalPages: 5481,
          readingStreak: 12,
          averageRating: 4.2,
          monthlyProgress: mockReadingData.monthlyProgress.map(d => ({ month: d.month, books: d.books })),
          genreDistribution: mockReadingData.genreDistribution,
          recentBooks: [mockReadingData.mockBook],
          trends: {
            books: { period: 'Last Month', current: 24, previous: 22, percentageChange: 12 },
            pages: { period: 'Last Month', current: 5481, previous: 4981, percentageChange: 8 }
          },
          pace: {
            pagesPerDay: 183,
            booksPerMonth: 2,
            estimatedYearlyTotal: 24
          },
          topAuthors: [
            { name: 'Author 1', booksRead: 5, averageRating: 4.5 },
            { name: 'Author 2', booksRead: 3, averageRating: 4.2 }
          ],
          readingHours: { morning: 30, afternoon: 45, evening: 25 },
          completionRate: 95,
          averageBookLength: 228
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [selectedShelves]);

  if (isLoading) return <LoadingScreen message="Loading your reading stats..." />;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      py: 4,
      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
    }}>
      <Container maxWidth="xl">
        <PageHeader />
        
        {/* Add ShelfManager */}
        <ShelfManager onShelvesSelected={setSelectedShelves} />
        
        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Books Read"
              value={stats?.totalBooks.toString() || '24'}
              icon={<MenuBook sx={{ color: 'white' }} />}
              trend="+12% vs last year"
              info="Total books read"
              onClick={() => {}}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pages Read"
              value="5,481"
              icon={<Speed sx={{ color: 'white' }} />}
              trend="+8% vs last month"
              info="Total pages read"
              onClick={() => {}}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Reading Streak"
              value="12 days"
              icon={<TrendingUp sx={{ color: 'white' }} />}
              info="Current reading streak"
              onClick={() => {}}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Avg Rating"
              value="4.2"
              icon={<StarRate sx={{ color: 'white' }} />}
              info="Average rating"
              onClick={() => {}}
            />
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Monthly Reading Progress
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockReadingData.monthlyProgress}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="books" 
                    fill={theme.palette.primary.main}
                    background={{ fill: alpha(theme.palette.primary.main, 0.1) }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Genre Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockReadingData.genreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {CHART_COLORS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Reading Pace and Top Authors */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={8}>
            <ReadingPaceChart 
              data={mockReadingData.readingPace} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TopAuthors 
              authors={stats?.topAuthors || [
                { name: 'Author 1', booksRead: 5, averageRating: 4.5 },
                { name: 'Author 2', booksRead: 3, averageRating: 4.2 },
                { name: 'Author 3', booksRead: 2, averageRating: 4.0 },
              ]} 
            />
          </Grid>
        </Grid>

        {/* Reading Goals */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <ReadingGoals 
              goals={{
                'Yearly Books': { current: 24, target: 50 },
                'Monthly Pages': { current: 1200, target: 2000 },
                'Reading Streak': { current: 12, target: 30 },
              }} 
            />
          </Grid>
        </Grid>

        {/* Add BookList component */}
        <BookList 
          books={stats?.recentBooks || [mockReadingData.mockBook]} 
        />
      </Container>
    </Box>
  );
};

export default Dashboard; 