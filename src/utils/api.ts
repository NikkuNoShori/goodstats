interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export async function makeApiCall(endpoint: string, options: ApiOptions = {}) {
  const response = await fetch(endpoint, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
} 