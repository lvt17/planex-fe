'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/utils/api';
import {
    BellIcon,
    XMarkIcon,
    CheckIcon,
    ClockIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { requestNotificationPermission, showNotification } from '@/utils/notifications';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    action_type: string | null;
    action_data: any;
    created_at: string;
}

interface NotificationPanelProps {
    onTeamJoined?: () => void;
}

export default function NotificationPanel({ onTeamJoined }: NotificationPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const lastNotificationId = useRef<number>(0);
    const bellButtonRef = useRef<HTMLButtonElement>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 60, right: 20 });

    useEffect(() => {
        if (isOpen && bellButtonRef.current) {
            const rect = bellButtonRef.current.getBoundingClientRect();
            setPopupPosition({
                top: rect.bottom + 8, // 8px below the bell
                right: window.innerWidth - rect.right
            });
        }
    }, [isOpen]);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/api/notifications');
            const newNotifications: Notification[] = res.data.notifications;

            // Show browser notifications for new unread items
            if (lastNotificationId.current > 0) {
                newNotifications.forEach(n => {
                    if (!n.is_read && n.id > lastNotificationId.current) {
                        showNotification(n.title, {
                            body: n.message,
                            tag: `notif-${n.id}`
                        });
                    }
                });
            }

            if (newNotifications.length > 0) {
                lastNotificationId.current = Math.max(...newNotifications.map(n => n.id));
            }

            setNotifications(newNotifications);
            setUnreadCount(res.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    }, []);

    // Poll for new notifications
    useEffect(() => {
        fetchNotifications();
        requestNotificationPermission();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/api/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/api/notifications/read-all', {});
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            toast.error('Không thể đánh dấu đã đọc');
        }
    };

    const handleAcceptInvite = async (inviteId: number) => {
        setLoading(true);
        try {
            await api.post(`/api/notifications/team-invite/${inviteId}/accept`, {});
            toast.success('Đã tham gia team!');
            fetchNotifications();
            onTeamJoined?.();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể tham gia team');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectInvite = async (inviteId: number) => {
        setLoading(true);
        try {
            await api.post(`/api/notifications/team-invite/${inviteId}/reject`, {});
            toast.success('Đã từ chối lời mời');
            fetchNotifications();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể từ chối');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'team_invite': return <UserGroupIcon className="w-5 h-5 text-accent" />;
            case 'task_deadline': return <ExclamationTriangleIcon className="w-5 h-5 text-syntax-yellow" />;
            case 'task_stale': return <ClockIcon className="w-5 h-5 text-syntax-red" />;
            case 'password_changed': return <ShieldCheckIcon className="w-5 h-5 text-syntax-green" />;
            default: return <BellIcon className="w-5 h-5 text-secondary" />;
        }
    };

    const formatTime = (isoString: string) => {
        // Backend stores UTC time, append Z if not present to indicate UTC
        const utcString = isoString.endsWith('Z') ? isoString : isoString + 'Z';
        const date = new Date(utcString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                ref={bellButtonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-hover transition-colors cursor-pointer"
                title="Thông báo"
            >
                <BellIcon className="w-6 h-6 text-secondary" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-syntax-red text-page text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel - Responsive positioning */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed w-[calc(100vw-2rem)] sm:w-[380px] max-h-[480px] bg-surface border border-border rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-fade-in"
                        style={{
                            top: `${popupPosition.top}px`,
                            right: window.innerWidth < 640 ? '1rem' : `${popupPosition.right}px`,
                            left: window.innerWidth < 640 ? '1rem' : 'auto'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-page/50">
                            <h3 className="font-bold text-primary">Thông báo</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-accent hover:underline cursor-pointer">
                                    Đánh dấu tất cả đã đọc
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[400px] overflow-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center text-muted">
                                    <BellIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p>Không có thông báo nào</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.is_read && markAsRead(n.id)}
                                        className={`px-4 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors ${n.is_read ? 'bg-transparent' : 'bg-accent/5'}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-primary">{n.title}</p>
                                                <p className="text-xs text-secondary line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-muted mt-1">{formatTime(n.created_at)}</p>

                                                {/* Action Buttons for Team Invite */}
                                                {n.action_type === 'accept_team_invite' && !n.is_read && n.action_data?.invite_id && (
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAcceptInvite(n.action_data.invite_id); }}
                                                            disabled={loading}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-accent text-page rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <CheckIcon className="w-3.5 h-3.5" />
                                                            Đồng ý
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRejectInvite(n.action_data.invite_id); }}
                                                            disabled={loading}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-page border border-border text-secondary rounded-lg hover:text-primary cursor-pointer"
                                                        >
                                                            <XMarkIcon className="w-3.5 h-3.5" />
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {!n.is_read && <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
