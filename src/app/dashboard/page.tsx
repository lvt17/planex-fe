'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <Dashboard />;
}

