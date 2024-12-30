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

export async function POST(request: NextRequest) {
  try {
    const { oauthToken, oauthVerifier } = await request.json();

    if (!oauthToken || !oauthVerifier) {
      return NextResponse.json(
        { error: 'OAuth token and verifier are required' },
        { status: 400 }
      );
    }

    const requestData = {
      url: 'https://www.goodreads.com/oauth/access_token',
      method: 'POST',
      data: { 
        oauth_token: oauthToken,
        oauth_verifier: oauthVerifier
      }
    };

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: oauth.toHeader(oauth.authorize(requestData)) as unknown as Record<string, string>
    });

    const data = await response.text();
    const params = new URLSearchParams(data);

    return NextResponse.json({
      accessToken: params.get('oauth_token'),
      refreshToken: params.get('oauth_token_secret'),
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    console.error('Auth callback failed:', error);
    return NextResponse.json(
      { error: 'Failed to complete authentication' },
      { status: 500 }
    );
  }
} 