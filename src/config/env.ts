export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  goodreads: {
    apiKey: import.meta.env.VITE_GOODREADS_API_KEY,
    apiSecret: import.meta.env.VITE_GOODREADS_API_SECRET,
    callbackUrl: import.meta.env.VITE_GOODREADS_CALLBACK_URL,
  },
  app: {
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  },
} as const;
