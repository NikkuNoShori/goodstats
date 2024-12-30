// Add secure storage utility
export const secureStorage = {
  set: (key: string, value: any) => {
    const encrypted = btoa(JSON.stringify(value)); // Simple encoding for demo
    localStorage.setItem(key, encrypted);
  },
  
  get: (key: string) => {
    const value = localStorage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(atob(value)); // Simple decoding for demo
    } catch {
      return null;
    }
  },
  
  remove: (key: string) => {
    localStorage.removeItem(key);
  }
}; 