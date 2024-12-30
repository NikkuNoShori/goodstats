import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { userService } from '../userService';
import { goodreadsService } from '../goodreadsService';

// Extend InternalAxiosRequestConfig to include retry
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    retry?: number;
  }
}

// Create axios instance
const client: AxiosInstance = axios.create({
  baseURL: 'https://www.goodreads.com/api',
  timeout: 10000,
});

// Add retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Add token refresh interceptor
client.interceptors.response.use(
  response => {
    // Cache successful GET requests
    if (response.config.method === 'get') {
      const cacheKey = response.config.url + JSON.stringify(response.config.params);
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    // Handle token expiration
    if (error.response?.status === 401 && !error.config.retry) {
      try {
        const profile = userService.getProfile();
        if (profile?.refreshToken) {
          const tokens = await goodreadsService.refreshToken(profile.refreshToken);
          
          // Update user profile with new tokens
          userService.setProfile({
            ...profile,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: Date.now() + tokens.expiresIn * 1000
          });

          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          error.config.retry = 1;
          return client(error.config);
        }
      } catch (refreshError) {
        // If refresh fails, clear profile and redirect to login
        userService.clearProfile();
        window.location.href = '/signin';
        return Promise.reject(new Error('Session expired. Please sign in again.'));
      }
    }

    // Handle other retries
    const config = error.config;
    if (config.retry === undefined) {
      config.retry = 0;
    }

    if (typeof config.retry === 'number' && config.retry >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config.retry += 1;
    
    // Implement exponential backoff
    const delay = RETRY_DELAY * Math.pow(2, config.retry - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return client(config);
  }
);

// Add caching and API key to requests
client.interceptors.request.use(config => {
  // Try to get cached data for GET requests
  if (config.method === 'get') {
    const cacheKey = config.url + JSON.stringify(config.params);
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return Promise.resolve({ ...config, data: cachedData.data });
    }
  }

  // Add API key and auth token to all requests
  const profile = userService.getProfile();
  if (profile?.accessToken) {
    config.headers.Authorization = `Bearer ${profile.accessToken}`;
  }

  config.params = {
    ...config.params,
    key: import.meta.env.VITE_GOODREADS_API_KEY,
    format: 'json'
  };
  return config;
});

export default client; 