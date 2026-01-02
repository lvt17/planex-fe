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

export default api;
export { API_URL };
