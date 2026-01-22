import axios from 'axios';
import { tokenStorage } from './tokenStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth header
api.interceptors.request.use(
    (config) => {
        const token = tokenStorage.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            tokenStorage.clearTokens();
            if (typeof window !== 'undefined' &&
                !window.location.pathname.includes('/login') &&
                !window.location.pathname.includes('/secretvt')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
export { API_URL };
