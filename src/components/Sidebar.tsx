'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import api from '@/utils/api';
import PlanexLogo from './PlanexLogo';
import Badge from './Badge';
import {
    HomeIcon,
    ChartBarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowRightOnRectangleIcon,
    Cog6ToothIcon,
    PlusIcon,
    LockClosedIcon,
    Square2StackIcon,
    DocumentTextIcon,
    TableCellsIcon,
    MoonIcon,
    ShoppingBagIcon,
    QuestionMarkCircleIcon,
    UserGroupIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
    activeView: 'tasks' | 'income' | 'settings' | 'storage' | 'whiteboard' | 'portfolio' | 'documents' | 'spreadsheets' | 'sales' | 'team' | 'chat';
    setActiveView: (view: 'tasks' | 'income' | 'settings' | 'storage' | 'whiteboard' | 'portfolio' | 'documents' | 'spreadsheets' | 'sales' | 'team' | 'chat') => void;
    onLogout: () => void;
    onNewTask: () => void;
    onSupport: () => void;
    user: User | null;
    selectedTeamId: number | null;
    setSelectedTeamId: (id: number | null) => void;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ activeView, setActiveView, onLogout, onNewTask, onSupport, user, selectedTeamId, setSelectedTeamId, isMobileOpen, setIsMobileOpen }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [teams, setTeams] = useState<any[]>([]);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await api.get('/api/teams');
                setTeams(res.data);
            } catch (e) {
                // Silent fail
            }
        };
        fetchTeams();

        // Refetch teams every 30 seconds to catch approvals
        const interval = setInterval(fetchTeams, 30000);
        return () => clearInterval(interval);
    }, [activeView]); // Refetch when view changes

    const [creatingTeam, setCreatingTeam] = useState(false);

    const createTeam = async () => {
        if (!newTeamName.trim() || creatingTeam) return;
        setCreatingTeam(true);
        try {
            const res = await api.post('/api/teams', { name: newTeamName });
            setTeams(prev => [...prev, res.data]);
            setNewTeamName('');
            setShowCreateTeam(false);
            setSelectedTeamId(res.data.id);
            setActiveView('team');
        } catch (e) {
            // Error handling
        } finally {
            setCreatingTeam(false);
        }
    };

    const navItems = [
        { id: 'tasks', label: 'Tasks', icon: HomeIcon },
        { id: 'income', label: 'Doanh thu', icon: ChartBarIcon },
        { id: 'sales', label: 'Bán hàng', icon: ShoppingBagIcon },
        { id: 'documents', label: 'Tài liệu', icon: DocumentTextIcon },
        { id: 'spreadsheets', label: 'Bảng tính', icon: TableCellsIcon },
        { id: 'storage', label: 'Tài khoản', icon: LockClosedIcon },
        { id: 'whiteboard', label: 'Bảng trắng', icon: Square2StackIcon },
        { id: 'settings', label: 'Profile', icon: Cog6ToothIcon },
    ];

    const handleNavClick = (id: string) => {
        setActiveView(id as any);
        if (setIsMobileOpen) setIsMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen?.(false)}
                />
            )}

            <aside className={`
                ${isCollapsed ? 'md:w-20' : 'md:w-64'} 
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                fixed md:sticky top-0 left-0 h-screen z-50
                w-72 md:w-64
                transition-all duration-300 
                flex flex-col flex-shrink-0 
                bg-surface border-r border-border 
                overflow-hidden
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className={`flex items-center gap-2 px-2 ${isCollapsed ? 'md:justify-center' : ''}`}>
                        <PlanexLogo size={isCollapsed ? 'sm' : 'md'} />
                    </div>
                    {/* Close button on mobile */}
                    <button
                        onClick={() => setIsMobileOpen?.(false)}
                        className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors md:hidden cursor-pointer"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    {/* Collapse button on desktop */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors hidden md:block cursor-pointer"
                    >
                        {isCollapsed ? (
                            <ChevronRightIcon className="w-5 h-5" />
                        ) : (
                            <ChevronLeftIcon className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Create Button */}
                <div className="px-3 mt-4">
                    <button
                        onClick={onNewTask}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-accent text-page hover:opacity-90 transition-all cursor-pointer ${isCollapsed ? 'px-0' : 'px-4'}`}
                    >
                        <PlusIcon className="w-5 h-5" />
                        {!isCollapsed && <span>Tạo Task</span>}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 mt-4 overflow-y-auto custom-scrollbar">
                    {!isCollapsed && (
                        <div className="text-xs font-semibold uppercase tracking-wider px-3 mb-2 text-muted">
                            Menu
                        </div>
                    )}
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all cursor-pointer ${isCollapsed ? 'justify-center' : ''} ${activeView === item.id ? 'bg-elevated text-accent border-l-2 border-accent' : 'text-secondary hover:text-primary hover:bg-hover'}`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span className="font-medium">{item.label}</span>}
                        </button>
                    ))}

                    {/* Teams Section */}
                    {!isCollapsed && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between px-3 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Teams</span>
                                <button
                                    onClick={() => setShowCreateTeam(true)}
                                    className="p-1 rounded text-muted hover:text-accent transition-colors cursor-pointer"
                                    title="Tạo team mới"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                            {teams.length === 0 ? (
                                <p className="px-3 text-xs text-muted italic">Chưa có team nào</p>
                            ) : (
                                teams.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setSelectedTeamId(t.id); setActiveView('team'); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-all cursor-pointer ${activeView === 'team' && selectedTeamId === t.id
                                            ? 'bg-elevated text-accent border-l-2 border-accent'
                                            : 'text-secondary hover:text-primary hover:bg-hover'
                                            }`}
                                    >
                                        <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm font-medium truncate">{t.name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Create Team Modal (inline) */}
                    {showCreateTeam && !isCollapsed && (
                        <div className="mt-2 px-3 py-3 bg-page rounded-xl border border-border">
                            <input
                                type="text"
                                value={newTeamName}
                                onChange={e => setNewTeamName(e.target.value)}
                                placeholder="Tên team mới..."
                                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-primary focus:border-accent focus:outline-none mb-2"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && createTeam()}
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setShowCreateTeam(false)} disabled={creatingTeam} className="flex-1 py-1.5 text-xs text-secondary border border-border rounded-lg hover:bg-hover cursor-pointer disabled:opacity-50">Hủy</button>
                                <button onClick={createTeam} disabled={creatingTeam || !newTeamName.trim()} className="flex-1 py-1.5 text-xs bg-accent text-page rounded-lg font-bold hover:opacity-90 cursor-pointer disabled:opacity-50">
                                    {creatingTeam ? 'Đang tạo...' : 'Tạo'}
                                </button>
                            </div>
                        </div>
                    )}
                </nav>

                {/* User & Theme */}
                <div className="p-3 border-t border-border">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${user.avatar_url}`}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-semibold text-sm text-page flex-shrink-0">
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            {!isCollapsed && (
                                <div className="min-w-0">
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium text-primary truncate leading-tight">{user?.full_name || user?.username || 'User'}</p>
                                    </div>
                                    <p className="text-[10px] text-muted truncate mt-0.5">{user?.email}</p>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                <button
                                    onClick={() => {
                                        const html = document.documentElement;
                                        const isDark = html.classList.contains('dark');
                                        if (isDark) {
                                            html.classList.remove('dark');
                                            localStorage.setItem('theme', 'light');
                                        } else {
                                            html.classList.add('dark');
                                            localStorage.setItem('theme', 'dark');
                                        }
                                    }}
                                    className="p-2 rounded-lg text-secondary hover:text-accent hover:bg-hover transition-colors cursor-pointer"
                                    title="Đổi theme"
                                >
                                    <MoonIcon className="w-5 h-5 block dark:hidden" />
                                </button>
                                <button
                                    onClick={onSupport}
                                    className="p-2 rounded-lg text-secondary hover:text-accent hover:bg-hover transition-colors cursor-pointer"
                                    title="Hỗ trợ & Báo lỗi"
                                >
                                    <QuestionMarkCircleIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={onLogout}
                                    className="p-2 rounded-lg text-secondary hover:text-syntax-red hover:bg-hover transition-colors cursor-pointer"
                                    title="Đăng xuất"
                                >
                                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
