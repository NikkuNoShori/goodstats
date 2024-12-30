import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { supabase } from '@/services/supabase';
import { goodreadsService } from '@/services/goodreadsService';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    const tokens = await goodreadsService.refreshToken(refreshToken);
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Token refresh failed:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
} 