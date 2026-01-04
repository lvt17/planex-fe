'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/utils/api';
import AdminDashboard from '@/components/AdminDashboard';
import { LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function SecretvtPage() {
    const [code, setCode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminToken, setAdminToken] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/api/feedback/admin/login', { code });
            setAdminToken(response.data.token);
            setIsAuthenticated(true);
            toast.success('Admin Authenticated');
        } catch (error) {
            toast.error('Mã truy cập không đúng');
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated) {
        return <AdminDashboard token={adminToken} onLogout={() => setIsAuthenticated(false)} />;
    }

    return (
        <div className="min-h-screen bg-page flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                        <LockClosedIcon className="w-10 h-10 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold text-primary mb-2 italic tracking-tighter">SECRET<span className="text-accent underline">VT</span></h1>
                    <p className="text-secondary">Đi ra chổ khác chơi đi, chổ này không dành cho bro!!!</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <input
                            type="password"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-page border border-border text-primary text-center text-2xl tracking-[0.5em] sm:tracking-[1em] focus:border-accent focus:outline-none transition-all placeholder:tracking-normal placeholder:text-lg"
                            placeholder="••••••••"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-accent text-page font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 rounded-full animate-spin border-page border-t-transparent" />
                        ) : (
                            <>
                                <ShieldCheckIcon className="w-6 h-6" />
                                Xác nhận truy cập
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center mt-12 text-muted text-xs">
                    Planex Administrator Interface v1.0.0 © 2026
                </p>
            </div>
        </div>
    );
}
