interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export async function makeApiCall(endpoint: string, options: ApiOptions = {}) {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : '';
  
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`API Call to ${endpoint} completed in ${duration.toFixed(2)}ms`);

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`API Call to ${endpoint} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
} 