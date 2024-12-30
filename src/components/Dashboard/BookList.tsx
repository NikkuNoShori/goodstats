import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Typography,
  Rating,
} from '@mui/material';
import { Book } from '../../types/book';

interface BookListProps {
  books: Book[];
  isLoading: boolean;
}

const BookList = ({ books, isLoading }: BookListProps) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!books.length) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No books found. Enter your Goodreads username to load your books.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
        '& .MuiTableCell-root': {
          borderColor: 'rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.7)',
        },
        '& .MuiTableHead-root .MuiTableCell-root': {
          color: 'white',
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.02)',
        },
        '& .MuiTableBody-root .MuiTableRow-root:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
        },
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cover</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Author</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Date Read</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {books.map((book) => (
            <TableRow key={book.id}>
              <TableCell>
                {book.coverImage && (
                  <Box
                    component="img" 
                    src={book.coverImage} 
                    alt={book.title}
                    sx={{ 
                      width: 50, 
                      height: 'auto',
                      borderRadius: 1,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                  />
                )}
              </TableCell>
              <TableCell sx={{ fontWeight: 500, color: 'white' }}>{book.title}</TableCell>
              <TableCell>{book.author}</TableCell>
              <TableCell>
                <Rating 
                  value={book.rating} 
                  readOnly 
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: '#7e3af2',
                    },
                    '& .MuiRating-iconEmpty': {
                      color: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                />
              </TableCell>
              <TableCell>
                {book.dateRead ? new Date(book.dateRead).toLocaleDateString() : 'Not set'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BookList;
