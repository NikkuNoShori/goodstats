import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Rating,
  Box,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import { Book } from '../../types/book';
import { alpha } from '@mui/material/styles';

interface BookListProps {
  books: Book[];
}

const BookList: React.FC<BookListProps> = ({ books }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [genreFilter, setGenreFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('dateRead');

  const genres = [...new Set(books.flatMap(book => book.genres))];

  const filteredBooks = books
    .filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (genreFilter === 'all' || book.genres.includes(genreFilter))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'dateRead':
          return new Date(b.dateRead || 0).getTime() - new Date(a.dateRead || 0).getTime();
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Your Books
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Search books"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Genre</InputLabel>
          <Select
            value={genreFilter}
            label="Genre"
            onChange={(e) => setGenreFilter(e.target.value)}
          >
            <MenuItem value="all">All Genres</MenuItem>
            {genres.map(genre => (
              <MenuItem key={genre} value={genre}>{genre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="dateRead">Date Read</MenuItem>
            <MenuItem value="rating">Rating</MenuItem>
            <MenuItem value="title">Title</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Genre</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Pages</TableCell>
              <TableCell>Date Read</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBooks.map((book) => (
              <TableRow key={book.id} hover>
                <TableCell>{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {book.genres.slice(0, 2).map(genre => (
                      <Chip 
                        key={genre}
                        label={genre} 
                        size="small"
                        sx={{ 
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main'
                        }} 
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Rating value={book.rating || 0} readOnly size="small" />
                </TableCell>
                <TableCell>{book.pageCount}</TableCell>
                <TableCell>
                  {book.dateRead ? new Date(book.dateRead).toLocaleDateString() : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default BookList; 