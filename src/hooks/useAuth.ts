'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { tokenStorage } from '@/utils/tokenStorage';
import api from '@/utils/api';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = tokenStorage.getAccessToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await api.get('/api/users/me');
            setUser(response.data);
        } catch {
            tokenStorage.clearTokens();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await api.post('/api/auth/login', { email, password });
        const { access_token, user: userData } = response.data;
        tokenStorage.setTokens(access_token);
        setUser(userData);
        return userData;
    };

    const register = async (username: string, email: string, password: string, full_name?: string) => {
        const response = await api.post('/api/auth/register', {
            username, email, password, full_name
        });
        return response.data;
    };

    const verifyOtp = async (email: string, otp: string, signupToken?: string) => {
        const response = await api.post('/api/auth/verify-otp', {
            email,
            otp,
            signup_token: signupToken
        });
        const { access_token, user: userData } = response.data;
        tokenStorage.setTokens(access_token);
        setUser(userData);
        return userData;
    };

    const googleLogin = async (token: string) => {
        const response = await api.post('/api/auth/google', { token });
        const { access_token, user: userData } = response.data;
        tokenStorage.setTokens(access_token);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        tokenStorage.clearTokens();
        setUser(null);
        window.location.href = '/';
    };

    return { user, loading, login, googleLogin, register, verifyOtp, logout, checkAuth };
}
