import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const { headers } = request;
    const { searchParams } = new URL(request.url);
    const token = headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing auth token' },
        { status: 401 }
      );
    }

    const response = await axios.get('https://www.goodreads.com/review/list', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        v: '2',
        format: 'json',
        per_page: 200,
        page: searchParams.get('page') || '1',
        shelf: 'read'
      }
    });

    return NextResponse.json({
      books: response.data.reviews,
      totalBooks: response.data.total,
      totalPages: Math.ceil(response.data.total / 200)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
} 