'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';

interface IncomeStats {
    total_income: number;
    task_count: number;
    average_per_task: number;
    range: string;
    daily_stats: { date: string; total: number; count: number }[];
}

export function useIncome() {
    const [stats, setStats] = useState<IncomeStats | null>(null);
    const [loading, setLoading] = useState(false);

    const getAuthHeader = () => {
        const token = sessionStorage.getItem('access_token');
        return { Authorization: `Bearer ${token}` };
    };

    const fetchStats = useCallback(async (range: 'week' | 'month' | 'year' = 'month') => {
        try {
            setLoading(true);
            const response = await axios.get<IncomeStats>(`${API_URL}/api/income?range=${range}`, {
                headers: getAuthHeader()
            });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch income stats:', error);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { stats, loading, fetchStats };
}
