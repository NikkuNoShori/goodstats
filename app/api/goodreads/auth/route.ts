import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

const oauth = new OAuth({
  consumer: {
    key: process.env.GOODREADS_API_KEY!,
    secret: process.env.GOODREADS_API_SECRET!
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64');
  }
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get('callbackUrl');

    if (!callbackUrl) {
      return NextResponse.json(
        { error: 'Callback URL is required' },
        { status: 400 }
      );
    }

    const requestData = {
      url: 'https://www.goodreads.com/oauth/request_token',
      method: 'POST',
      data: { oauth_callback: callbackUrl }
    };

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: oauth.toHeader(oauth.authorize(requestData)) as unknown as Record<string, string>
    });

    const data = await response.text();
    const params = new URLSearchParams(data);
    const token = params.get('oauth_token');

    return NextResponse.json({
      token,
      redirectUrl: `https://www.goodreads.com/oauth/authorize?oauth_token=${token}`
    });
  } catch (error) {
    console.error('Auth initialization failed:', error);
    return NextResponse.json(
      { error: 'Failed to initialize authentication' },
      { status: 500 }
    );
  }
} 