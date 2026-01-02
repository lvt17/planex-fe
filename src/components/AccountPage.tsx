'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
    PlusIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    KeyIcon,
    EyeIcon,
    EyeSlashIcon,
    LockClosedIcon,
    ShieldCheckIcon,
    ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import api from '@/utils/api';

interface Account {
    id: number;
    platform: string;
    username: string;
    content?: string;
    noted?: string;
    created_at: string;
}

const PLATFORMS = [
    { id: 'google', name: 'Google', color: '#EA4335' },
    { id: 'facebook', name: 'Facebook', color: '#1877F2' },
    { id: 'github', name: 'GitHub', color: '#24292F' },
    { id: 'instagram', name: 'Instagram', color: '#E4405F' },
    { id: 'zalo', name: 'Zalo', color: '#0068FF' },
    { id: 'whatsapp', name: 'WhatsApp', color: '#25D366' },
    { id: 'telegram', name: 'Telegram', color: '#0088CC' },
    { id: 'x', name: 'X (Twitter)', color: '#000000' },
    { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
    { id: 'tiktok', name: 'TikTok', color: '#000000' },
    { id: 'discord', name: 'Discord', color: '#5865F2' },
    { id: 'shopee', name: 'Shopee', color: '#EE4D2D' },
    { id: 'other', name: 'Khác...', color: '#6B7280' },
];

// SVG Logos for platforms
const PlatformLogo = ({ platform, size = 24 }: { platform: string; size?: number }) => {
    const logos: { [key: string]: JSX.Element } = {
        google: (
            <svg viewBox="0 0 24 24" width={size} height={size}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
        ),
        facebook: (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
        github: (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
        ),
        instagram: (
            <svg viewBox="0 0 24 24" width={size} height={size}>
                <defs>
                    <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFDC80" />
                        <stop offset="50%" stopColor="#F56040" />
                        <stop offset="100%" stopColor="#833AB4" />
                    </linearGradient>
                </defs>
                <path fill="url(#ig)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
        ),
        zalo: (
            <svg viewBox="0 0 48 48" width={size} height={size}>
                <path fill="#2196F3" d="M24,4C12.954,4,4,12.954,4,24c0,11.046,8.954,20,20,20c11.046,0,20-8.954,20-20C44,12.954,35.046,4,24,4z" />
                <path fill="#FFF" d="M32.5,16h-17c-0.828,0-1.5,0.671-1.5,1.5v1c0,0.829,0.672,1.5,1.5,1.5h10.394L14.5,31.95 c-0.415,0.415-0.54,1.039-0.317,1.583C14.406,34.077,14.935,34.5,15.5,34.5h17c0.828,0,1.5-0.671,1.5-1.5v1c0-0.829-0.672-1.5-1.5-1.5H21.895L33.5,18.55c0.415-0.415,0.54-1.039,0.317-1.583C33.594,16.423,33.065,16,32.5,16z" />
            </svg>
        ),
        whatsapp: (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
        ),
        telegram: (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="#0088CC">
                <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
            </svg>
        ),
        x: (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        linkedin: (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
        tiktok: (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
        ),
        discord: (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="#5865F2">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
        ),
        shopee: (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="#EE4D2D">
                <path d="M12.006 0C6.505 0 2 4.505 2 10.006v.412c0 .312.252.564.564.564h2.256c.312 0 .564-.252.564-.564v-.412c0-3.618 2.994-6.612 6.612-6.612s6.612 2.994 6.612 6.612c0 .492.4.892.892.892h2.608c.312 0 .564-.252.564-.564v-.338C22.672 4.505 18.168 0 12.666 0h-.66zM7.388 11.6a.824.824 0 00-.824.824v.824c0 .456.368.824.824.824h9.224a.824.824 0 00.824-.824v-.824a.824.824 0 00-.824-.824H7.388zm0 4.118a.824.824 0 00-.824.824v.824c0 .456.368.824.824.824h9.224a.824.824 0 00.824-.824v-.824a.824.824 0 00-.824-.824H7.388zm0 4.118a.824.824 0 00-.824.824v.824c0 .456.368.824.824.824h9.224a.824.824 0 00.824-.824v-.824a.824.824 0 00-.824-.824H7.388z" />
            </svg>
        ),
        other: (
            <ComputerDesktopIcon className="w-full h-full text-gray-400" />
        ),
    };

    const platformId = PLATFORMS.find(p => p.name.toLowerCase() === platform.toLowerCase())?.id || 'other';
    return logos[platformId] || logos.other;
};

interface AccountPageProps {
    onBack: () => void;
}

export default function AccountPage({ onBack }: AccountPageProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDecryptModal, setShowDecryptModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [passkey, setPasskey] = useState('');
    const [decryptedData, setDecryptedData] = useState<{ password: string, content?: string } | null>(null);
    const [newAccount, setNewAccount] = useState({
        platformId: 'google',
        customPlatform: '',
        username: '',
        password: '',
        content: '',
        passkey: '',
        noted: ''
    });

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/accounts');
            setAccounts(response.data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            toast.error('Không thể tải danh sách tài khoản');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleCreateAccount = async () => {
        const platform = newAccount.platformId === 'other' ? newAccount.customPlatform : PLATFORMS.find(p => p.id === newAccount.platformId)?.name || '';

        if (!platform || !newAccount.username || !newAccount.password || !newAccount.passkey) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            await api.post('/api/accounts', {
                platform,
                username: newAccount.username,
                password: newAccount.password,
                content: newAccount.content,
                passkey: newAccount.passkey,
                noted: newAccount.noted
            });
            toast.success('Đã thêm tài khoản mới!');
            setShowAddModal(false);
            setNewAccount({
                platformId: 'google',
                customPlatform: '',
                username: '',
                password: '',
                content: '',
                passkey: '',
                noted: ''
            });
            fetchAccounts();
        } catch (error) {
            toast.error('Không thể thêm tài khoản. Kiểm tra lại Passkey.');
        }
    };

    const handleDecrypt = async () => {
        if (!selectedAccount || !passkey) return;

        try {
            const response = await api.post(`/api/accounts/${selectedAccount.id}/decrypt`, { passkey });
            setDecryptedData({
                password: response.data.password,
                content: response.data.content
            });
            setPasskey('');
        } catch (error) {
            toast.error('Passkey không đúng');
        }
    };

    const deleteAccount = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
        try {
            await api.delete(`/api/accounts/${id}`);
            toast.success('Đã xóa tài khoản');
            fetchAccounts();
        } catch (error) {
            toast.error('Không thể xóa tài khoản');
        }
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <LockClosedIcon className="w-6 h-6 text-accent" />
                        Quản lý Tài khoản
                    </h1>
                    <p className="text-secondary text-sm">Lưu trữ mật khẩu an toàn bằng Passkey</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-primary hover:bg-hover transition-colors cursor-pointer"
                    >
                        Quay lại
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent text-page hover:opacity-90 transition-all cursor-pointer"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Thêm tài khoản
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-muted" />
                </div>
                <input
                    type="text"
                    placeholder="Tìm kiếm nền tảng, username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface border border-border text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
                </div>
            ) : filteredAccounts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-xl bg-surface border border-border">
                    <ShieldCheckIcon className="w-16 h-16 text-muted mb-4" />
                    <h2 className="text-lg font-semibold text-primary mb-2">Chưa có tài khoản nào</h2>
                    <p className="text-secondary mb-4">Mọi dữ liệu của bạn được mã hóa và bảo mật tuyệt đối</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAccounts.map((acc) => (
                        <div key={acc.id} className="p-4 rounded-xl bg-surface border border-border hover:border-accent group transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-page border border-border flex items-center justify-center p-2">
                                        <PlatformLogo platform={acc.platform} size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary">{acc.platform}</h3>
                                        <p className="text-xs text-muted">{acc.username}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteAccount(acc.id)}
                                    className="p-1.5 rounded-lg text-secondary hover:text-syntax-red hover:bg-syntax-red/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg bg-page border border-border border-dashed">
                                <span className="text-xs text-muted font-mono">••••••••••••</span>
                                <button
                                    onClick={() => {
                                        setSelectedAccount(acc);
                                        setShowDecryptModal(true);
                                        setDecryptedData(null);
                                    }}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent hover:bg-accent/20 transition-all cursor-pointer"
                                >
                                    <KeyIcon className="w-3 h-3" />
                                    Xem mật khẩu
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                            <PlusIcon className="w-6 h-6 text-accent" />
                            Thêm tài khoản mới
                        </h2>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Nền tảng</label>
                                <div className="relative">
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-page border border-border">
                                        <div className="w-6 h-6">
                                            <PlatformLogo platform={PLATFORMS.find(p => p.id === newAccount.platformId)?.name || ''} size={24} />
                                        </div>
                                        <select
                                            value={newAccount.platformId}
                                            onChange={(e) => setNewAccount({ ...newAccount, platformId: e.target.value })}
                                            className="flex-1 bg-transparent text-primary font-medium focus:outline-none cursor-pointer appearance-none"
                                        >
                                            {PLATFORMS.map(platform => (
                                                <option key={platform.id} value={platform.id}>
                                                    {platform.name}
                                                </option>
                                            ))}
                                        </select>
                                        <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {newAccount.platformId === 'other' && (
                                    <input
                                        type="text"
                                        placeholder="Nhập tên nền tảng khác..."
                                        value={newAccount.customPlatform}
                                        onChange={(e) => setNewAccount({ ...newAccount, customPlatform: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none mt-3"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Username / Email</label>
                                <input
                                    type="text"
                                    value={newAccount.username}
                                    onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Mật khẩu</label>
                                    <input
                                        type="password"
                                        value={newAccount.password}
                                        onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">2FA / Nội dung</label>
                                    <input
                                        type="text"
                                        placeholder="Mã 2FA hoặc ghi chú..."
                                        value={newAccount.content}
                                        onChange={(e) => setNewAccount({ ...newAccount, content: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                                <label className="block text-xs font-bold text-accent uppercase tracking-wider mb-1.5">Passkey bảo mật</label>
                                <input
                                    type="password"
                                    placeholder="Dùng để mã hóa dữ liệu này"
                                    value={newAccount.passkey}
                                    onChange={(e) => setNewAccount({ ...newAccount, passkey: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-page border border-accent text-primary focus:ring-2 focus:ring-accent/50 focus:outline-none shadow-lg"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-secondary hover:text-primary transition-colors cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateAccount}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-accent text-page hover:opacity-90 shadow-lg shadow-accent/20 transition-all cursor-pointer"
                            >
                                Lưu bảo mật
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decrypt Modal */}
            {showDecryptModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-xl font-bold text-primary mb-4">Xác thực Passkey</h2>
                        <p className="text-sm text-secondary mb-6">Vui lòng nhập passkey để giải mã mật khẩu cho <strong>{selectedAccount?.platform}</strong></p>

                        {decryptedData ? (
                            <div className="space-y-4 mb-6">
                                <div className="p-4 rounded-xl bg-page border border-accent border-dashed text-center">
                                    <p className="text-[10px] text-secondary uppercase tracking-widest mb-1">Mật khẩu:</p>
                                    <p className="text-xl font-mono font-bold text-accent select-all">{decryptedData.password}</p>
                                </div>
                                {decryptedData.content && (
                                    <div className="p-4 rounded-xl bg-page border border-border text-center">
                                        <p className="text-[10px] text-secondary uppercase tracking-widest mb-1">2FA / Nội dung:</p>
                                        <p className="text-sm font-medium text-primary select-all">{decryptedData.content}</p>
                                    </div>
                                )}
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] text-muted mb-1">Username:</p>
                                    <p className="text-xs font-bold text-secondary">{selectedAccount?.username}</p>
                                </div>
                            </div>
                        ) : (
                            <input
                                type="password"
                                placeholder="Nhập Passkey..."
                                autoFocus
                                value={passkey}
                                onChange={(e) => setPasskey(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                                className="w-full px-4 py-3 rounded-xl bg-page border border-accent text-primary focus:ring-2 focus:ring-accent/50 focus:outline-none mb-6 shadow-lg"
                            />
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDecryptModal(false);
                                    setPasskey('');
                                    setDecryptedData(null);
                                }}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-primary hover:bg-hover transition-all cursor-pointer"
                            >
                                Đóng
                            </button>
                            {!decryptedData && (
                                <button
                                    onClick={handleDecrypt}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-accent text-page hover:opacity-90 shadow-lg shadow-accent/20 transition-all cursor-pointer"
                                >
                                    Giải mã
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
