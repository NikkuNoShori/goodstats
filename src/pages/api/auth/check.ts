import { supabase } from '../../../services/supabase';

export async function GET(req: Request) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ token: session.access_token }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Authentication check failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 