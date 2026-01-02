'use client';

import { useState, useCallback } from 'react';
import api from '@/utils/api';

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

    const fetchStats = useCallback(async (range: 'week' | 'month' | 'year' = 'month') => {
        try {
            setLoading(true);
            const response = await api.get<IncomeStats>(`/api/income?range=${range}`);
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
