/**
 * Token storage utility - uses sessionStorage for tab-independent sessions
 * Each browser tab will have its own independent login session
 */

// Token keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REMEMBERED_EMAIL_KEY = 'remembered_email';

export const tokenStorage = {
    // Get token from sessionStorage (tab-specific)
    getAccessToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    },

    getRefreshToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    },

    // Set tokens to sessionStorage (tab-specific)
    setTokens: (accessToken: string, refreshToken?: string): void => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
            sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    },

    // Clear tokens (logout)
    clearTokens: (): void => {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    // Remember email for auto-fill (uses localStorage - persists across sessions)
    getRememberedEmail: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(REMEMBERED_EMAIL_KEY);
    },

    setRememberedEmail: (email: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    },

    clearRememberedEmail: (): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    },

    // Helper to get auth header
    getAuthHeader: (): { Authorization: string } | Record<string, never> => {
        const token = tokenStorage.getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }
};

// Export individual functions for convenience
export const getAccessToken = tokenStorage.getAccessToken;
export const setTokens = tokenStorage.setTokens;
export const clearTokens = tokenStorage.clearTokens;
export const getAuthHeader = tokenStorage.getAuthHeader;
