'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '@/types';
import { tokenStorage } from '@/utils/tokenStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';

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

            const response = await axios.get(`${API_URL}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
        } catch (error) {
            tokenStorage.clearTokens();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        const { access_token, user: userData } = response.data;
        tokenStorage.setTokens(access_token);
        setUser(userData);
        return userData;
    };

    const register = async (username: string, email: string, password: string, full_name?: string) => {
        const response = await axios.post(`${API_URL}/api/auth/register`, {
            username, email, password, full_name
        });
        return response.data;
    };

    const verifyOtp = async (email: string, otp: string, signupToken?: string) => {
        const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
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
        const response = await axios.post(`${API_URL}/api/auth/google`, { token });
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
