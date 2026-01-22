'use client';

import { useState, useRef } from 'react';
import { User } from '@/types';
import { toast } from 'react-hot-toast';
import api from '@/utils/api';
import {
    UserCircleIcon,
    CameraIcon,
    KeyIcon,
    EnvelopeIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

interface SettingsPageProps {
    user: User | null;
    onUserUpdated: (user: User) => void;
}

export default function SettingsPage({ user, onUserUpdated }: SettingsPageProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profileData, setProfileData] = useState({
        username: user?.username || '',
        full_name: user?.full_name || '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put('/api/users/me', profileData);
            onUserUpdated(response.data);
            toast.success('Cập nhật thành công!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể cập nhật');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            await api.post('/api/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Avatar đã cập nhật!');
            // Refresh user data
            const userResponse = await api.get('/api/users/me');
            onUserUpdated(userResponse.data);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể upload avatar');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }
        if (passwordData.new_password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            await api.put('/api/auth/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });

            toast.success('Đổi mật khẩu thành công!');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    // For avatar URL display, we still use the env variable for direct image linking
    const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-primary mb-6">Cài đặt tài khoản</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
                {[
                    { id: 'profile', label: 'Thông tin', icon: UserCircleIcon },
                    { id: 'password', label: 'Mật khẩu', icon: KeyIcon },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${activeTab === tab.id
                            ? 'border-accent text-accent'
                            : 'border-transparent text-secondary hover:text-primary'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'profile' ? (
                <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6 p-6 rounded-xl bg-surface border border-border">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-2xl font-bold text-page overflow-hidden">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `${BASE_API_URL}${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user?.username?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-accent text-page hover:opacity-90 transition-all cursor-pointer"
                            >
                                <CameraIcon className="w-4 h-4" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold text-primary">{user?.full_name || user?.username}</h3>
                            <p className="text-sm text-secondary">{user?.email}</p>
                            <p className="text-xs text-muted mt-1">Click vào icon máy ảnh để đổi avatar</p>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleUpdateProfile} className="p-6 rounded-xl bg-surface border border-border space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">Username</label>
                            <input
                                type="text"
                                value={profileData.username}
                                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg bg-page border border-border text-primary focus:border-accent focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">Họ và tên</label>
                            <input
                                type="text"
                                value={profileData.full_name}
                                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg bg-page border border-border text-primary focus:border-accent focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">Email</label>
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-page border border-border">
                                <EnvelopeIcon className="w-5 h-5 text-secondary" />
                                <span className="text-secondary">{user?.email}</span>
                                <span className="text-xs text-muted ml-auto">(không thể thay đổi)</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium bg-accent text-page hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 rounded-full animate-spin border-page border-t-transparent" />
                            ) : (
                                <>
                                    <CheckIcon className="w-5 h-5" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <form onSubmit={handleChangePassword} className="p-6 rounded-xl bg-surface border border-border space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg bg-page border border-border text-primary focus:border-accent focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Mật khẩu mới</label>
                        <input
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg bg-page border border-border text-primary focus:border-accent focus:outline-none"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg bg-page border border-border text-primary focus:border-accent focus:outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium bg-accent text-page hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 rounded-full animate-spin border-page border-t-transparent" />
                        ) : (
                            <>
                                <KeyIcon className="w-5 h-5" />
                                Đổi mật khẩu
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
