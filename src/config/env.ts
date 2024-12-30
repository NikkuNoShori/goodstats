interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  goodreads: {
    apiKey: string;
    apiSecret: string;
    callbackUrl: string;
  };
  app: {
    name: string;
    url: string;
  };
}

const validateEnv = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GOODREADS_API_KEY',
    'VITE_GOODREADS_API_SECRET',
    'VITE_GOODREADS_CALLBACK_URL'
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n` +
      'Please check your .env file and make sure all required variables are set.'
    );
  }

  // Validate URL formats
  try {
    new URL(import.meta.env.VITE_SUPABASE_URL);
    new URL(import.meta.env.VITE_GOODREADS_CALLBACK_URL);
    new URL(import.meta.env.VITE_APP_URL || 'http://localhost:5173');
  } catch (error) {
    throw new Error('Invalid URL format in environment variables');
  }
};

// Run validation immediately
validateEnv();

export const env: EnvConfig = {
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
    name: import.meta.env.VITE_APP_NAME || 'GoodStats',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  },
}; 