'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { UserGroupIcon, ArrowRightIcon, CheckCircleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

export default function JoinTeamPage() {
    const router = useRouter();
    const { token } = useParams();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [teamInfo, setTeamInfo] = useState<any>(null);
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        if (!token) return;

        const fetchTokenInfo = async () => {
            try {
                const res = await api.get(`/api/teams/join/${token}`);
                setTeamInfo(res.data);
            } catch (error: any) {
                console.error("DEBUG: Join Team Error:", error);
                if (error.response) {
                    const msg = error.response.data.message || error.response.data.error || 'Link mời không hợp lệ hoặc đã hết hạn';
                    toast.error(msg);
                } else if (error.request) {
                    toast.error('Không thể kết nối tới server. Vui lòng kiểm tra cấu hình API URL.');
                } else {
                    toast.error('Đã xảy ra lỗi khi tham gia Team.');
                }
                setTimeout(() => router.push('/dashboard'), 3000);
            } finally {
                setLoading(false);
            }
        };

        fetchTokenInfo();
    }, [token, router]);

    const handleJoin = async () => {
        if (!user) {
            router.push(`/login?next=/join-team/${token}`);
            return;
        }
        setJoining(true);
        try {
            await api.post(`/api/teams/join/${token}`);
            setJoined(true);
            toast.success('Đã gửi yêu cầu tham gia! Chờ leader duyệt nhé.');
            setTimeout(() => router.push('/dashboard'), 3000);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể tham gia team');
        } finally {
            setJoining(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (joined) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 text-center shadow-xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-syntax-green" />
                    <div className="w-20 h-20 bg-syntax-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-12 h-12 text-syntax-green" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">Đã gửi yêu cầu!</h1>
                    <p className="text-secondary mb-8 leading-relaxed">
                        Yêu cầu tham gia team <strong>{teamInfo?.team_name}</strong> của bạn đã được gửi. Bạn sẽ nhận được thông báo khi leader duyệt.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-4 bg-accent text-page font-bold rounded-2xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/20"
                    >
                        Về Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 text-center shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserGroupIcon className="w-12 h-12 text-accent" />
                </div>
                <h1 className="text-2xl font-bold text-primary mb-2">Lời mời tham gia Team</h1>
                <p className="text-secondary mb-8 leading-relaxed">
                    Bạn được mời tham gia vào team <strong className="text-accent">{teamInfo?.team_name}</strong>. Hãy nhấn nút bên dưới để bắt đầu cộng tác nhé!
                </p>

                <div className="space-y-4">
                    {user ? (
                        <button
                            onClick={handleJoin}
                            disabled={joining}
                            className="w-full py-4 bg-accent text-page font-bold rounded-2xl hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 shadow-lg shadow-accent/20"
                        >
                            {joining ? 'Đang xử lý...' : 'Tham gia ngay'}
                            {!joining && <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    ) : (
                        <button
                            onClick={handleJoin}
                            className="w-full py-4 bg-accent text-page font-bold rounded-2xl hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 group shadow-lg shadow-accent/20"
                        >
                            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                            Đăng nhập để tham gia
                        </button>
                    )}

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-4 bg-page text-secondary border border-border font-bold rounded-2xl hover:bg-hover transition-all cursor-pointer"
                    >
                        {user ? 'Bỏ qua' : 'Về trang chủ'}
                    </button>
                </div>

                <p className="mt-8 text-[10px] text-muted uppercase tracking-widest font-bold">Planex - Team Management System</p>
            </div>
        </div>
    );
}
