import bcrypt from 'bcrypt';

interface UserProfile {
  id: string;
  goodreadsId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
  email?: string;
  passwordHash?: string;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const userService = {
  getProfile(): UserProfile | null {
    const profile = localStorage.getItem('user_profile');
    return profile ? JSON.parse(profile) : null;
  },

  setProfile(profile: UserProfile): void {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  },

  clearProfile(): void {
    localStorage.removeItem('user_profile');
  },

  isAuthenticated(): boolean {
    const profile = this.getProfile();
    if (!profile) return false;
    return Date.now() < profile.tokenExpiry;
  },

  hasGoodreadsToken(): boolean {
    const profile = this.getProfile();
    return !!profile?.accessToken;
  },

  getGoodreadsToken(): string | null {
    return this.getProfile()?.accessToken || null;
  },

  removeGoodreadsToken(): void {
    const profile = this.getProfile();
    if (profile) {
      delete profile.accessToken;
      delete profile.refreshToken;
      this.setProfile(profile);
    }
  },

  updateEmail: async (email: string): Promise<void> => {
    const profile = userService.getProfile();
    if (!profile) throw new Error('No user profile found');
    
    profile.email = email;
    userService.setProfile(profile);
  },

  updatePassword: async (password: string): Promise<void> => {
    const profile = userService.getProfile();
    if (!profile) throw new Error('No user profile found');
    
    profile.passwordHash = await hashPassword(password);
    userService.setProfile(profile);
  }
}; 