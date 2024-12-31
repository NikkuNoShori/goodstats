import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req) {
  const origin = req.headers.get('origin') || 'https://goodstats.vercel.app'
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true'
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response(JSON.stringify({ 
        authenticated: false,
        message: 'No token provided'
      }), {
        headers: corsHeaders
      })
    }

    // Verify the session with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return new Response(JSON.stringify({ 
        authenticated: false,
        message: error?.message || 'Invalid token'
      }), {
        headers: corsHeaders
      })
    }

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    return new Response(JSON.stringify({ 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      },
      session: {
        access_token: session?.access_token,
        expires_at: session?.expires_at,
        refresh_token: session?.refresh_token
      }
    }), {
      headers: corsHeaders
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      authenticated: false,
      message: error.message || 'Internal server error'
    }), {
      headers: corsHeaders
    })
  }
} 