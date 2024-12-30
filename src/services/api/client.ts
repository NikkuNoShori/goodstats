import axios, { AxiosError, AxiosInstance } from 'axios';

import { goodreadsService } from '../goodreadsService';
import { userService } from '../userService';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

// Create axios instance
const client: AxiosInstance = axios.create({
  baseURL: 'https://www.goodreads.com/api',
  timeout: 10000,
});

// Simple in-memory cache
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Add request interceptor for caching and auth
client.interceptors.request.use(async config => {
  // Try to get cached data for GET requests
  if (config.method === 'get') {
    const cacheKey = `${config.url}${JSON.stringify(config.params)}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return Promise.resolve({ ...config, data: cachedData.data });
    }
  }

  // Add auth token
  const profile = await userService.getProfile();
  if (profile?.goodreads_token) {
    config.headers.Authorization = `Bearer ${profile.goodreads_token}`;
  }

  return config;
});

// Add response interceptor for caching and token refresh
client.interceptors.response.use(
  response => {
    // Cache successful GET requests
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params)}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    if (!error.config) return Promise.reject(error);
    
    // Handle retry logic
    const retryCount = (error.config as { retry?: number }).retry ?? 0;
    if (retryCount < MAX_RETRIES) {
      error.config.retry = retryCount + 1;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return client(error.config);
    }

    // Handle token refresh
    if (error.response?.status === 401) {
      try {
        const profile = await userService.getProfile();
        if (profile?.goodreads_refresh_token) {
          const tokens = await goodreadsService.refreshToken(profile.goodreads_refresh_token);
          await userService.updateProfile({
            goodreads_token: tokens.accessToken,
            goodreads_refresh_token: tokens.refreshToken,
            goodreads_token_expiry: Date.now() + tokens.expiresIn * 1000,
          });
          return client(error.config);
        }
      } catch {
        // If refresh fails, reject with original error
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
