'use client';

import { useState, useEffect } from 'react';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import PlanexLogo from './PlanexLogo';
import {
    PresentationChartBarIcon,
    LockClosedIcon,
    LockOpenIcon,
    TrashIcon,
    XMarkIcon,
    ClockIcon,
    UsersIcon,
    ClipboardDocumentCheckIcon,
    BugAntIcon,
    ArrowLeftOnRectangleIcon,
    MagnifyingGlassIcon,
    DocumentArrowDownIcon,
    AcademicCapIcon,
    PlusIcon,
    IdentificationIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Badge from './Badge';
import api from '@/utils/api';

interface AdminDashboardProps {
    token: string;
    onLogout: () => void;
}

export default function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<'users' | 'surveys' | 'reports' | 'ranking' | 'badges'>('users');
    const [users, setUsers] = useState<any[]>([]);
    const [surveys, setSurveys] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [ranking, setRanking] = useState<any[]>([]);
    const [badgeDefinitions, setBadgeDefinitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showLockModal, setShowLockModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [lockDuration, setLockDuration] = useState<'hour' | 'day' | 'permanent'>('hour');

    // Badge State
    const [isCreateBadgeOpen, setIsCreateBadgeOpen] = useState(false);
    const [isAssignBadgeOpen, setIsAssignBadgeOpen] = useState(false);
    const [newBadge, setNewBadge] = useState({
        name: '',
        icon_url: '',
        frame_style: '',
        description: '',
        condition_type: 'manual',
        condition_value: 0
    });
    const [assignForm, setAssignForm] = useState({
        user_identifier: '',
        badge_id: '',
        expires_in_days: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const config = { headers: { 'X-Admin-Token': token } };
            const [usersRes, surveysRes, reportsRes, rankingRes, badgeRes] = await Promise.all([
                api.get('/api/feedback/admin/users', config),
                api.get('/api/feedback/admin/surveys', config),
                api.get('/api/feedback/admin/reports', config),
                api.get('/api/feedback/admin/ranking', config),
                api.get('/api/admin/badges/definitions', config)
            ]);
            setUsers(usersRes.data);
            setSurveys(surveysRes.data);
            setReports(reportsRes.data);
            setRanking(rankingRes.data);
            setBadgeDefinitions(badgeRes.data);
        } catch (error) {
            console.error('Failed to fetch admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await api.get('/api/feedback/admin/surveys/export', {
                headers: { 'X-Admin-Token': token },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `planex_survey_${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success('Exported successfully!');
        } catch (error: any) {
            console.error('Export error:', error);
            toast.error(error.response?.data?.error || 'Export failed');
        }
    };

    useEffect(() => {
        fetchData();
        // Removed polling - now using SSE for realtime updates
    }, [token]);

    const getGroupedSurveys = () => {
        // Simple thematic grouping logic
        const groups: { [key: string]: any[] } = {};
        surveys.forEach(s => {
            const key = s.job || 'Unspecified';
            if (!groups[key]) groups[key] = [];
            groups[key].push(s);
        });
        return groups;
    };

    const handleLockUser = async () => {
        if (!selectedUser) return;
        try {
            await api.post(`/api/feedback/admin/users/${selectedUser.id}/lock`,
                { duration: lockDuration },
                { headers: { 'X-Admin-Token': token } }
            );
            toast.success('Đã khoá tài khoản thành công');
            setShowLockModal(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to lock user');
        }
    };

    const handleUnlockUser = async (user: any) => {
        try {
            await api.post(`/api/feedback/admin/users/${user.id}/unlock`,
                {},
                { headers: { 'X-Admin-Token': token } }
            );
            toast.success('Đã mở khoá tài khoản');
            fetchData();
        } catch (error) {
            toast.error('Failed to unlock user');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await api.delete(`/api/feedback/admin/users/${selectedUser.id}`,
                { headers: { 'X-Admin-Token': token } }
            );
            toast.success('Đã xoá tài khoản vĩnh viễn');
            setShowDeleteConfirm(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    // Supabase Realtime for instant updates
    const { isConnected: sseConnected } = useSupabaseRealtime({
        onEvent: (event) => {
            console.log('Admin Realtime event:', event);

            // Handle different event types
            switch (event.type) {
                case 'user_updated':
                    // Update user in list
                    setUsers(prev => prev.map(u =>
                        u.id === event.data.id ? event.data : u
                    ));
                    break;

                case 'user_deleted':
                    // Remove user from list
                    setUsers(prev => prev.filter(u => u.id !== event.data.id));
                    break;

                case 'survey_submitted':
                    // Add new survey to list
                    setSurveys(prev => [event.data, ...prev]);
                    break;

                case 'report_submitted':
                    // Add new report to list
                    setReports(prev => [event.data, ...prev]);
                    break;
            }
        },
        onConnect: () => {
            console.log('Admin Realtime connected');
        }
    });

    return (
        <div className="flex flex-col h-screen bg-page">
            {/* Header */}
            <header className="bg-surface border-b border-border shrink-0">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                    <PlanexLogo size="sm" />
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={fetchData}
                            className="p-2 text-secondary hover:text-primary transition-colors cursor-pointer"
                            title="Tải lại dữ liệu"
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-syntax-red/10 text-syntax-red text-sm font-bold hover:bg-syntax-red/20 transition-all cursor-pointer"
                        >
                            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Thoát</span>
                        </button>
                    </div>
                </div>
                <nav className="flex items-center gap-1 px-4 sm:px-6 pb-3 overflow-x-auto">
                    {[
                        { id: 'users', label: 'Người dùng', icon: UsersIcon },
                        { id: 'ranking', label: 'Xếp hạng', icon: PresentationChartBarIcon },
                        { id: 'badges', label: 'Danh hiệu', icon: AcademicCapIcon },
                        { id: 'surveys', label: 'Khảo sát', icon: ClipboardDocumentCheckIcon },
                        { id: 'reports', label: 'Báo cáo', icon: BugAntIcon }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-accent text-page' : 'text-secondary hover:text-primary hover:bg-hover'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 sm:p-8">
                {activeTab === 'users' && (
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold text-primary">Quản lý người dùng ({users.length})</h2>
                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface border border-border w-full sm:w-80">
                                <MagnifyingGlassIcon className="w-5 h-5 text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm user..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm text-primary w-full"
                                />
                            </div>
                        </div>

                        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="bg-page/50 border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Ngày tham gia</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Trạng thái</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {users.filter(u => u.username.includes(searchQuery) || u.email.includes(searchQuery)).map(u => (
                                            <tr key={u.id} className="hover:bg-page/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-page">
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-primary">{u.username}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-secondary">{u.email}</td>
                                                <td className="px-6 py-4 text-sm text-secondary">{new Date(u.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    {u.is_locked ? (
                                                        <div className="flex flex-col">
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-syntax-red/10 text-syntax-red border border-syntax-red/20 inline-block w-fit">
                                                                Locked
                                                            </span>
                                                            <span className="text-[9px] text-muted mt-1 whitespace-nowrap">
                                                                Đến: {new Date(u.locked_until).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-syntax-green/10 text-syntax-green border border-syntax-green/20">
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {u.is_locked ? (
                                                            <button
                                                                onClick={() => handleUnlockUser(u)}
                                                                className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all cursor-pointer"
                                                                title="Mở khoá"
                                                            >
                                                                <LockOpenIcon className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setSelectedUser(u); setShowLockModal(true); }}
                                                                className="p-1.5 rounded-lg bg-syntax-red/10 text-syntax-red hover:bg-syntax-red/20 transition-all cursor-pointer"
                                                                title="Khoá tài khoản"
                                                            >
                                                                <LockClosedIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => { setSelectedUser(u); setShowDeleteConfirm(true); }}
                                                            className="p-1.5 rounded-lg bg-page hover:bg-syntax-red/10 text-muted hover:text-syntax-red transition-all cursor-pointer border border-border"
                                                            title="Xoá vĩnh viễn"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'surveys' && (
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        {/* Header with Export Button */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-primary">Survey Analytics</h2>
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-syntax-green text-page rounded-xl font-medium hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-syntax-green/20"
                            >
                                <DocumentArrowDownIcon className="w-5 h-5" />
                                Export to Excel
                            </button>
                        </div>

                        {/* Overview Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-surface border border-border rounded-2xl p-5">
                                <p className="text-xs text-muted uppercase mb-1">Tổng khảo sát</p>
                                <p className="text-3xl font-bold text-primary">{surveys.length}</p>
                            </div>
                            <div className="bg-surface border border-border rounded-2xl p-5">
                                <p className="text-xs text-muted uppercase mb-1">Số ngành nghề</p>
                                <p className="text-3xl font-bold text-accent">{Object.keys(getGroupedSurveys()).length}</p>
                            </div>
                            <div className="bg-surface border border-border rounded-2xl p-5">
                                <p className="text-xs text-muted uppercase mb-1">Công cụ phổ biến</p>
                                <p className="text-lg font-bold text-syntax-green">
                                    {(() => {
                                        const toolCount: Record<string, number> = {};
                                        surveys.forEach((s: any) => s.tools?.forEach((t: string) => toolCount[t] = (toolCount[t] || 0) + 1));
                                        const sorted = Object.entries(toolCount).sort((a, b) => b[1] - a[1]);
                                        return sorted[0]?.[0] || 'N/A';
                                    })()}
                                </p>
                            </div>
                            <div className="bg-surface border border-border rounded-2xl p-5">
                                <p className="text-xs text-muted uppercase mb-1">Avg. Tools/User</p>
                                <p className="text-3xl font-bold text-syntax-purple">
                                    {surveys.length > 0 ? (surveys.reduce((sum: number, s: any) => sum + (s.tools?.length || 0), 0) / surveys.length).toFixed(1) : 0}
                                </p>
                            </div>
                        </div>

                        {/* Tools Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
                                <h3 className="font-bold text-primary mb-4 flex items-center justify-between">
                                    Thống kê công cụ được chọn
                                    <span className="text-xs font-normal text-muted">Phổ biến nhất</span>
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const toolCount: Record<string, number> = {};
                                        surveys.forEach((s: any) => s.tools?.forEach((t: string) => toolCount[t] = (toolCount[t] || 0) + 1));
                                        return Object.entries(toolCount).sort((a, b) => b[1] - a[1]).map(([tool, count]) => (
                                            <div key={tool} className="flex items-center gap-2 px-3 py-2 bg-page rounded-xl border border-border hover:border-accent/40 transition-colors">
                                                <span className="font-medium text-primary text-sm">{tool}</span>
                                                <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-lg text-xs font-bold">{count}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            <div className="bg-surface border border-border rounded-2xl p-6">
                                <h3 className="font-bold text-primary mb-4">Top nhu cầu</h3>
                                <div className="space-y-3">
                                    {(() => {
                                        // Simple keyword extraction for "What you want"
                                        const keywords = ["tự động", "nhanh", "giao diện", "quản lý", "team", "chat", "app", "mobile", "thống kê"];
                                        const keywordCount: Record<string, number> = {};
                                        surveys.forEach((s: any) => {
                                            keywords.forEach(k => {
                                                if (s.desires?.toLowerCase().includes(k)) {
                                                    keywordCount[k] = (keywordCount[k] || 0) + 1;
                                                }
                                            });
                                        });
                                        return Object.entries(keywordCount).sort((a, b) => b[1] - a[1]).map(([word, count]) => (
                                            <div key={word} className="flex items-center justify-between text-sm">
                                                <span className="text-secondary capitalize">{word}</span>
                                                <div className="flex items-center gap-3 flex-1 px-4">
                                                    <div className="h-1.5 flex-1 bg-page rounded-full overflow-hidden">
                                                        <div className="h-full bg-accent" style={{ width: `${(count / surveys.length) * 100}%` }} />
                                                    </div>
                                                </div>
                                                <span className="font-bold text-primary">{count}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Recent Highlight Desires */}
                        <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
                            <h3 className="font-bold text-primary mb-6 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-accent rounded-full" />
                                "Bạn muốn gì ở Planex?" — Ý kiến từ người dùng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {surveys.filter(s => s.desires && s.desires.length > 10).slice(-6).reverse().map((s, idx) => (
                                    <div key={idx} className="relative p-5 rounded-2xl bg-page border border-border/60 hover:border-accent/30 transition-all group">
                                        <div className="absolute top-4 right-4 text-accent/20 group-hover:text-accent/40 transition-colors">
                                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017V14H17.017C15.9124 14 15.017 13.1046 15.017 12V10C15.017 8.89543 15.9124 8 17.017 8H21.017V21H14.017ZM3.01697 21L3.01697 18C3.01697 16.8954 3.9124 16 5.01697 16H8.01697V14H6.01697C4.9124 14 4.01697 13.1046 4.01697 12V10C4.01697 8.89543 4.9124 8 6.01697 8H10.017V21H3.01697Z" /></svg>
                                        </div>
                                        <p className="text-sm text-primary leading-relaxed relative z-10 italic">
                                            {s.desires}
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{s.user_email.split('@')[0]}</span>
                                            <span className="text-[10px] text-muted italic">{s.job}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grouped by Job */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-primary text-lg">Phân loại theo ngành nghề</h3>
                            <span className="text-xs text-muted">Nhấn để xem chi tiết từng nhóm</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                            {Object.entries(getGroupedSurveys()).map(([key, list]: [string, any]) => (
                                <div key={key} className="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                                    <h3 className="text-lg font-bold text-primary mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-accent" />
                                            {key}
                                        </div>
                                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-tight">{list.length} phản hồi</span>
                                    </h3>
                                    <div className="space-y-4 max-h-80 overflow-auto custom-scrollbar pr-2">
                                        {list.map((s: any) => (
                                            <div key={s.id} className="p-4 rounded-xl bg-page border border-border/50 hover:bg-hover/50 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{s.user_email}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {s.tools.map((t: string) => (
                                                        <span key={t} className="px-1.5 py-0.5 rounded-md bg-syntax-purple/10 text-syntax-purple text-[9px] font-bold border border-syntax-purple/10">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-primary leading-relaxed line-clamp-3">{s.desires}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-primary">Báo cáo lỗi ({reports.length})</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {reports.map(r => (
                                <div key={r.id} className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:border-syntax-red/30 transition-all">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${r.status === 'open' ? 'bg-syntax-red/10 animate-pulse' : 'bg-syntax-green/10'
                                        }`}>
                                        <BugAntIcon className={`w-6 h-6 ${r.status === 'open' ? 'text-syntax-red' : 'text-syntax-green'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-primary">{r.title}</h3>
                                            <span className="text-xs text-muted">{new Date(r.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-secondary leading-relaxed mb-4">{r.description}</p>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-medium text-muted">Bởi: <span className="text-primary">{r.user_email}</span></span>
                                            <div className="h-3 w-px bg-border" />
                                            <span className={`text-[10px] font-bold uppercase ${r.status === 'open' ? 'text-syntax-red' : 'text-syntax-green'
                                                }`}>{r.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'ranking' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
                                <PresentationChartBarIcon className="w-8 h-8 text-accent" />
                                Bảng xếp hạng User hoạt động
                            </h2>
                            <span className="text-xs text-secondary italic">Cập nhật theo số lần đăng nhập</span>
                        </div>

                        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-page/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider w-20">Hạng</th>
                                        <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Người dùng</th>
                                        <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-center">Số lần truy cập</th>
                                        <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Danh hiệu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {ranking.map((u, idx) => (
                                        <tr key={u.id} className="hover:bg-page/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                {idx === 0 ? (
                                                    <span className="text-2xl">🥇</span>
                                                ) : idx === 1 ? (
                                                    <span className="text-2xl">🥈</span>
                                                ) : idx === 2 ? (
                                                    <span className="text-2xl">🥉</span>
                                                ) : (
                                                    <span className="text-lg font-bold text-muted ml-1">#{idx + 1}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-page">
                                                        {u.username[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-primary group-hover:text-accent transition-colors">{u.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 rounded-lg bg-page font-mono font-bold text-accent border border-accent/20">
                                                    {u.access_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex justify-end gap-1">
                                                {u.badges && u.badges.length > 0 ? (
                                                    u.badges
                                                        .filter((b: string) => b !== 'Planex Leader' && b !== 'The Best Member')
                                                        .slice(0, 3)
                                                        .map((badge: string, idx: number) => (
                                                            <Badge key={idx} title={badge} size="md" />
                                                        ))
                                                ) : (
                                                    u.title && u.title !== 'Planex Leader' && u.title !== 'The Best Member' && (
                                                        <Badge title={u.title} size="md" />
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {ranking.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center text-secondary">
                                                Chưa có dữ liệu xếp hạng.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'badges' && (
                    <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-20">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-surface border border-border p-6 rounded-2xl">
                                <p className="text-secondary text-sm mb-1">Tổng danh hiệu</p>
                                <p className="text-2xl font-bold text-primary">{badgeDefinitions.length}</p>
                            </div>
                            <button
                                onClick={() => setIsCreateBadgeOpen(true)}
                                className="bg-accent/10 hover:bg-accent/20 border border-accent/20 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
                            >
                                <PlusIcon className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold text-accent">Tạo danh hiệu mới</span>
                            </button>
                            <button
                                onClick={() => setIsAssignBadgeOpen(true)}
                                className="bg-syntax-purple/10 hover:bg-syntax-purple/20 border border-syntax-purple/20 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
                            >
                                <IdentificationIcon className="w-6 h-6 text-syntax-purple group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold text-syntax-purple">Cấp danh hiệu cho User</span>
                            </button>
                        </div>

                        {/* Badge Definitions List */}
                        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border bg-page/30 flex justify-between items-center">
                                <h3 className="font-bold text-primary">Danh sách danh hiệu hệ thống</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-page/50 border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary uppercase">Danh hiệu</th>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary uppercase">Khung</th>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary uppercase">Điều kiện</th>
                                            <th className="px-6 py-3 text-xs font-bold text-secondary uppercase text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {badgeDefinitions.map(b => (
                                            <tr key={b.id} className="hover:bg-page/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Badge title={b.name} size="md" frame={b.frame_style} />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-secondary">{b.frame_style || 'Mặc định'}</td>
                                                <td className="px-6 py-4 text-sm text-secondary">
                                                    {b.condition_type === 'manual' ? 'Cấp thủ công' : `${b.condition_type} >= ${b.condition_value}`}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Xoá danh hiệu này?')) {
                                                                await api.delete(`/api/admin/badges/definitions/${b.id}`, { headers: { 'X-Admin-Token': token } });
                                                                toast.success('Đã xoá');
                                                                fetchData();
                                                            }
                                                        }}
                                                        className="text-muted hover:text-syntax-red transition-colors cursor-pointer"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Create/Edit Modal (Simplified Overlay for now) */}
                        {isCreateBadgeOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-page/80 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-surface border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-primary">Tạo danh hiệu mới</h3>
                                        <button onClick={() => setIsCreateBadgeOpen(false)} className="cursor-pointer"><XMarkIcon className="w-6 h-6 text-secondary" /></button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-secondary uppercase mb-1.5 ml-1">Tên danh hiệu</label>
                                            <input
                                                type="text"
                                                className="w-full bg-page border border-border rounded-xl px-4 py-2.5 text-primary outline-none focus:border-accent"
                                                placeholder="VD: Star of the Week"
                                                value={newBadge.name}
                                                onChange={e => setNewBadge({ ...newBadge, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-secondary uppercase mb-1.5 ml-1">Kiểu Khung</label>
                                                <select
                                                    className="w-full bg-page border border-border rounded-xl px-4 py-2.5 text-primary outline-none"
                                                    value={newBadge.frame_style}
                                                    onChange={e => setNewBadge({ ...newBadge, frame_style: e.target.value })}
                                                >
                                                    <option value="">Không có khung</option>
                                                    {['Neon Blue', 'Solar Gold', 'Cyber Punk', 'Holographic', 'Emerald Guard', 'Void Void', 'Royal Silver', 'Vivid Flame'].map(f => (
                                                        <option key={f} value={f}>{f}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-secondary uppercase mb-1.5 ml-1">Điều kiện</label>
                                                <select
                                                    className="w-full bg-page border border-border rounded-xl px-4 py-2.5 text-primary outline-none"
                                                    value={newBadge.condition_type}
                                                    onChange={e => setNewBadge({ ...newBadge, condition_type: e.target.value })}
                                                >
                                                    <option value="manual">Cấp thủ công</option>
                                                    <option value="tasks_week">Task hoàn thành/Tuần</option>
                                                    <option value="tasks_month">Task hoàn thành/Tháng</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                await api.post('/api/admin/badges/definitions', newBadge, { headers: { 'X-Admin-Token': token } });
                                                toast.success('Đã tạo danh hiệu!');
                                                setIsCreateBadgeOpen(false);
                                                fetchData();
                                            }}
                                            className="w-full py-3 bg-accent text-page font-bold rounded-xl mt-4 cursor-pointer hover:bg-accent/90 transition-all"
                                        >
                                            Tạo ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Assign Badge Modal */}
                        {isAssignBadgeOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-page/80 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-surface border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-primary">Cấp danh hiệu cho User</h3>
                                        <button onClick={() => setIsAssignBadgeOpen(false)} className="cursor-pointer"><XMarkIcon className="w-6 h-6 text-secondary" /></button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-secondary uppercase mb-1.5 ml-1">Username hoặc Email</label>
                                            <input
                                                type="text"
                                                className="w-full bg-page border border-border rounded-xl px-4 py-2.5 text-primary outline-none focus:border-syntax-purple"
                                                placeholder="VD: lieutoan7788a@gmail.com"
                                                value={assignForm.user_identifier}
                                                onChange={e => setAssignForm({ ...assignForm, user_identifier: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-secondary uppercase mb-1.5 ml-1">Chọn danh hiệu</label>
                                            <select
                                                className="w-full bg-page border border-border rounded-xl px-4 py-2.5 text-primary outline-none"
                                                value={assignForm.badge_id}
                                                onChange={e => setAssignForm({ ...assignForm, badge_id: e.target.value })}
                                            >
                                                <option value="">-- Chọn danh hiệu --</option>
                                                {badgeDefinitions.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-secondary uppercase mb-1.5 ml-1">Hết hạn sau (ngày) - để trống nếu vĩnh viễn</label>
                                            <input
                                                type="number"
                                                className="w-full bg-page border border-border rounded-xl px-4 py-2.5 text-primary outline-none"
                                                placeholder="VD: 7"
                                                value={assignForm.expires_in_days}
                                                onChange={e => setAssignForm({ ...assignForm, expires_in_days: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await api.post('/api/admin/badges/assign', {
                                                        user_identifier: assignForm.user_identifier,
                                                        badge_id: parseInt(assignForm.badge_id),
                                                        expires_in_days: assignForm.expires_in_days ? parseInt(assignForm.expires_in_days) : null
                                                    }, { headers: { 'X-Admin-Token': token } });
                                                    toast.success('Đã cấp danh hiệu thành công!');
                                                    setIsAssignBadgeOpen(false);
                                                    fetchData();
                                                } catch (err: any) {
                                                    toast.error(err.response?.data?.error || 'Lỗi cấp danh hiệu');
                                                }
                                            }}
                                            className="w-full py-3 bg-syntax-purple text-page font-bold rounded-xl mt-4 cursor-pointer hover:bg-syntax-purple/90 transition-all"
                                        >
                                            Phê duyệt cấp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Lock Modal */}
            {showLockModal && (
                <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-primary">Khoá tài khoản</h2>
                            <button onClick={() => setShowLockModal(false)} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover cursor-pointer">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-secondary mb-6">
                            Chọn thời gian khoá cho tài khoản <span className="font-bold text-primary">@{selectedUser?.username}</span>:
                        </p>
                        <div className="space-y-2 mb-8">
                            {[
                                { id: 'hour', label: '1 giờ', icon: ClockIcon },
                                { id: 'day', label: '1 ngày', icon: ClockIcon },
                                { id: 'permanent', label: 'Vĩnh viễn', icon: LockClosedIcon }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setLockDuration(opt.id as any)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${lockDuration === opt.id ? 'bg-accent/10 border-accent text-accent' : 'bg-page border-border text-primary hover:border-accent/30'}`}
                                >
                                    <opt.icon className="w-5 h-5" />
                                    <span className="font-medium">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLockModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-secondary font-bold hover:bg-hover transition-all cursor-pointer">Huỷ</button>
                            <button onClick={handleLockUser} className="flex-1 py-2.5 rounded-xl bg-syntax-red text-page font-bold hover:opacity-90 transition-all cursor-pointer text-sm">Xác nhận khoá</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-fade-in text-center">
                        <div className="w-16 h-16 rounded-full bg-syntax-red/10 flex items-center justify-center mx-auto mb-4">
                            <TrashIcon className="w-8 h-8 text-syntax-red" />
                        </div>
                        <h2 className="text-xl font-bold text-primary mb-2">Xoá vĩnh viễn?</h2>
                        <p className="text-sm text-secondary mb-8">
                            Bạn có chắc muốn xoá tài khoản <span className="font-bold text-primary">@{selectedUser?.username}</span>? Hành động này không thể hoàn tác và toàn bộ dữ liệu sẽ bị mất.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-secondary font-bold hover:bg-hover transition-all cursor-pointer">Huỷ</button>
                            <button onClick={handleDeleteUser} className="flex-1 py-2.5 rounded-xl bg-syntax-red text-page font-bold hover:opacity-90 transition-all cursor-pointer">Xoá ngay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
