import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface YearlyData {
  year: number;
  booksRead: number;
  pagesRead: number;
}

const YearlyStats: React.FC = () => {
  const [yearlyData, setYearlyData] = React.useState<YearlyData[]>([]);

  React.useEffect(() => {
    // TODO: Implement Goodreads API call
    setYearlyData([
      { year: 2021, booksRead: 24, pagesRead: 7200 },
      { year: 2022, booksRead: 32, pagesRead: 9600 },
      { year: 2023, booksRead: 28, pagesRead: 8400 },
    ]);
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Yearly Reading Progress
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearlyData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="booksRead" fill="#8B4513" name="Books Read" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default YearlyStats; 