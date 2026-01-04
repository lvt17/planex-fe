'use client';

import { useState, useEffect } from 'react';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useIncome } from '@/hooks/useIncome';
import { useProjects } from '@/hooks/useProjects';
import Sidebar from './Sidebar';
import Badge from './Badge';
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import CreateTaskModal from './CreateTaskModal';
import IncomeDashboard from './IncomeDashboard';
import SettingsPage from './SettingsPage';
import WhiteboardPage from './WhiteboardPage';
import AccountPage from './AccountPage';
import PortfolioPage from './PortfolioPage';
import DocumentsPage from './DocumentsPage';
import SpreadsheetPage from './SpreadsheetPage';
import SalesPage from './SalesPage';
import SurveyModal from './SurveyModal';
import SupportModal from './SupportModal';
import TeamPage from './TeamPage';
import ChatPage from './ChatPage';
import NotificationPanel from './NotificationPanel';
import ConfirmModal from './ConfirmModal';
import { Task } from '@/types';
import { toast } from 'react-hot-toast';
import api from '@/utils/api';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon,
    Bars3Icon,
    FolderPlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { tasks, loading, pagination, filters, fetchTasks, applyFilters, goToPage, createTask, updateTask, deleteTask, stats } = useTasks();
    const { stats: incomeStats, loading: incomeLoading, fetchStats: fetchIncome } = useIncome();
    const { projects, createProject, deleteProject, fetchProjects } = useProjects();

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeView, setActiveView] = useState<'tasks' | 'income' | 'settings' | 'storage' | 'whiteboard' | 'portfolio' | 'documents' | 'spreadsheets' | 'sales' | 'team' | 'chat'>('tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
    const [projectFilter, setProjectFilter] = useState<string>('all');
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [chatTeamId, setChatTeamId] = useState<number | null>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        if (activeView === 'income') {
            fetchIncome('month');
        }
    }, [activeView, fetchIncome]);

    // Check survey status
    useEffect(() => {
        const checkSurvey = async () => {
            try {
                const response = await api.get('/api/feedback/survey/check');
                if (!response.data.completed) {
                    setIsSurveyOpen(true);
                }
            } catch (error) {
                console.error('Failed to check survey status', error);
            }
        };

        checkSurvey();
    }, []);

    // Supabase Realtime for instant task updates
    const { isConnected: sseConnected } = useSupabaseRealtime({
        onEvent: (event) => {
            console.log('Dashboard Realtime event:', event);

            // Handle task events - refresh tasks to get latest data
            if (event.type === 'task_created' || event.type === 'task_updated' || event.type === 'task_deleted') {
                fetchTasks();
            }
        }
    });

    const handleApplyFilters = () => {
        const newFilters: any = {};
        if (statusFilter !== 'all') newFilters.status = statusFilter;
        if (deadlineFilter !== 'all') newFilters.deadline = deadlineFilter;
        if (projectFilter !== 'all') {
            newFilters.project_id = projectFilter === 'none' ? 0 : parseInt(projectFilter);
        }
        applyFilters(newFilters);
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            toast.error('Vui lòng nhập tên project');
            return;
        }
        try {
            await createProject(newProjectName);
            setNewProjectName('');
            setIsCreateProjectModalOpen(false);
        } catch (error) {
            // Error already handled in hook
        }
    };

    const handleTaskCreated = async (taskData: Partial<Task>) => {
        try {
            await createTask(taskData);
            setIsCreateModalOpen(false);
            toast.success('Tạo task thành công!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể tạo task');
        }
    };

    const handleTaskUpdated = async (id: number, taskData: Partial<Task>) => {
        try {
            const updated = await updateTask(id, taskData);
            if (selectedTask?.id === id) {
                setSelectedTask(updated);
            }
        } catch (error: any) {
            toast.error('Không thể cập nhật task');
        }
    };

    const handleTaskDeleted = async (id: number) => {
        try {
            await deleteTask(id);
            if (selectedTask?.id === id) {
                setSelectedTask(null);
            }
            toast.success('Đã xóa task');
        } catch (error: any) {
            toast.error('Không thể xóa task');
        }
    };

    const handleTaskReceived = async (task: Task) => {
        try {
            // Add to income
            await api.post('/api/income/add', {
                name: task.name,
                amount: task.price,
                source: 'job'
            });

            // Delete the task
            await deleteTask(task.id);
            if (selectedTask?.id === task.id) {
                setSelectedTask(null);
            }

            toast.success(`+${task.price?.toLocaleString('vi-VN')}đ - Đã nhận tiền từ "${task.name}"`);

            // Refresh income stats
            fetchIncome('month');
        } catch (error: any) {
            toast.error('Lỗi khi ghi nhận thu nhập');
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (!searchQuery) return true;
        return task.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.content?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex h-screen bg-page overflow-hidden">
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                onLogout={logout}
                user={user}
                onNewTask={() => setIsCreateModalOpen(true)}
                onSupport={() => setIsSupportOpen(true)}
                selectedTeamId={selectedTeamId}
                setSelectedTeamId={setSelectedTeamId}
                isMobileOpen={isMobileSidebarOpen}
                setIsMobileOpen={setIsMobileSidebarOpen}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-surface border-b border-border">
                    {/* Left: Mobile menu + Title */}
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger menu */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors md:hidden cursor-pointer"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-primary">
                                {activeView === 'tasks' && 'Quản lý Tasks'}
                                {activeView === 'income' && 'Thống kê Thu nhập'}
                                {activeView === 'portfolio' && 'Portfolio'}
                                {activeView === 'documents' && 'Tài liệu'}
                                {activeView === 'spreadsheets' && 'Bảng tính'}
                                {activeView === 'settings' && 'Cài đặt'}
                            </h1>
                            {activeView === 'tasks' && (
                                <p className="text-sm text-secondary mt-1">
                                    Tổng: {pagination.total} tasks
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Search + Create + Notification + Avatar */}
                    <div className="flex items-center gap-3 ml-auto">
                        {activeView === 'tasks' && (
                            <>
                                {/* Search - Desktop inline, Mobile icon button */}
                                <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-page border border-border">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-secondary" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-primary w-40 placeholder:text-muted"
                                    />
                                </div>

                                {/* Mobile Search Icon */}
                                <button
                                    onClick={() => setIsSearchModalOpen(true)}
                                    className="lg:hidden p-2 rounded-lg hover:bg-hover transition-colors cursor-pointer"
                                    title="Tìm kiếm"
                                >
                                    <MagnifyingGlassIcon className="w-5 h-5 text-secondary" />
                                </button>

                                {/* Create Button */}
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-accent text-page hover:opacity-90 transition-all cursor-pointer"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">Tạo Task</span>
                                </button>
                            </>
                        )}

                        {/* Notifications */}
                        <NotificationPanel />

                        {/* Avatar & Title Badge */}
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex flex-col items-end mr-1">
                                <span className="text-xs font-bold text-primary leading-tight">{user?.username}</span>
                                <div className="mt-0.5 flex flex-wrap gap-1 justify-end scale-90 origin-right">
                                    {user?.badges && user.badges.length > 0 ? (
                                        user.badges
                                            .filter(b => b !== 'Planex Leader' && b !== 'The Best Member')
                                            .slice(0, 3)
                                            .map((badge, idx) => (
                                                <Badge key={idx} title={badge} size="sm" />
                                            ))
                                    ) : (
                                        user?.title && user.title !== 'Planex Leader' && user.title !== 'The Best Member' && (
                                            <Badge title={user.title} size="sm" />
                                        )
                                    )}
                                </div>
                            </div>
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full object-cover border border-border"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-medium text-sm text-page">
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className={`flex-1 ${activeView === 'chat' ? 'p-0 sm:p-6' : 'p-6'} overflow-auto`}>
                    {activeView === 'tasks' ? (
                        loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4 border-border border-t-accent"></div>
                                    <p className="text-secondary">Đang tải...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Categories Tabs */}
                                <div className="flex items-center gap-2 p-1 rounded-xl bg-elevated border border-border mb-6 w-fit">
                                    <button
                                        onClick={() => {
                                            setProjectFilter('all');
                                            setStatusFilter('all'); // Reset status to all to show everything
                                            applyFilters({ project_id: undefined, status: undefined });
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${projectFilter === 'all' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary hover:bg-hover'}`}
                                    >
                                        Tất cả
                                    </button>
                                    <button
                                        onClick={() => {
                                            setProjectFilter('none');
                                            setStatusFilter('all'); // Reset status to all to show everything
                                            applyFilters({ project_id: 0, status: undefined });
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${projectFilter === 'none' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary hover:bg-hover'}`}
                                    >
                                        Task lẻ (Global)
                                    </button>
                                    <div className="h-4 w-[1px] bg-border mx-1"></div>
                                    <select
                                        value={projectFilter !== 'all' && projectFilter !== 'none' ? projectFilter : 'disabled'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'disabled') return;
                                            setProjectFilter(val);
                                            setStatusFilter('all'); // Reset status to all to show everything
                                            applyFilters({ project_id: parseInt(val), status: undefined });
                                        }}
                                        className={`px-3 py-2 text-sm rounded-lg bg-transparent border-none text-primary cursor-pointer focus:outline-none font-medium ${projectFilter !== 'all' && projectFilter !== 'none' ? 'text-accent' : 'text-secondary'}`}
                                    >
                                        <option value="disabled" disabled>Chọn Dự án...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id.toString()}>{p.name}</option>
                                        ))}
                                    </select>

                                    {/* Delete Project Button */}
                                    {projectFilter !== 'all' && projectFilter !== 'none' && (
                                        <button
                                            onClick={() => {
                                                setConfirmConfig({
                                                    isOpen: true,
                                                    title: 'Xóa Project',
                                                    message: 'Bạn có chắc chắn muốn xóa project này? Các task sẽ không bị xóa nhưng sẽ không còn thuộc project nào.',
                                                    isDanger: true,
                                                    onConfirm: async () => {
                                                        await deleteProject(parseInt(projectFilter));
                                                        setProjectFilter('all');
                                                        applyFilters({ status: undefined });
                                                    }
                                                });
                                            }}
                                            className="p-1.5 rounded-lg text-secondary hover:text-syntax-red hover:bg-syntax-red/10 transition-colors cursor-pointer mr-1"
                                            title="Xóa Project này"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Filters */}
                                <div className="flex items-center gap-4 mb-6 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <FunnelIcon className="w-4 h-4 text-secondary" />
                                        <span className="text-sm text-secondary">Lọc nhanh:</span>
                                    </div>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 text-sm rounded-lg bg-surface border border-border text-primary cursor-pointer"
                                    >
                                        <option value="all">Mọi trạng thái</option>
                                        <option value="pending">Chưa bắt đầu</option>
                                        <option value="in_progress">Đang làm</option>
                                        <option value="done">Hoàn thành</option>
                                    </select>

                                    <select
                                        value={deadlineFilter}
                                        onChange={(e) => setDeadlineFilter(e.target.value)}
                                        className="px-3 py-2 text-sm rounded-lg bg-surface border border-border text-primary cursor-pointer"
                                    >
                                        <option value="all">Mọi deadline</option>
                                        <option value="today">Hôm nay</option>
                                        <option value="week">Tuần này</option>
                                        <option value="overdue">Quá hạn</option>
                                    </select>

                                    <div className="h-6 w-[1px] bg-border hidden sm:block"></div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleApplyFilters}
                                            className="px-4 py-2 text-sm rounded-lg bg-elevated border border-border text-primary font-medium hover:bg-hover cursor-pointer transition-colors"
                                        >
                                            Lọc
                                        </button>

                                        <button
                                            onClick={() => setIsCreateProjectModalOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-accent/10 border border-accent/20 text-accent font-semibold hover:bg-accent/20 transition-all cursor-pointer shadow-sm active:scale-95"
                                        >
                                            <FolderPlusIcon className="w-5 h-5" />
                                            <span>Tạo Project</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {[
                                        { label: 'Tổng Tasks', value: pagination.total, color: '#58A6FF' },
                                        { label: 'Đang làm', value: stats.inProgress, color: '#FFA657' },
                                        { label: 'Chưa bắt đầu', value: stats.pending, color: '#D2A8FF' },
                                        { label: 'Hoàn thành', value: stats.completed, color: '#7EE787' }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-surface border border-border"
                                            style={{ borderLeftWidth: '3px', borderLeftColor: stat.color }}>
                                            <span className="text-sm text-secondary">{stat.label}</span>
                                            <p className="text-2xl font-bold text-primary mt-1">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Task Content */}
                                <div className="flex gap-6">
                                    <div className={`flex-1 ${selectedTask ? 'max-w-[calc(100%-420px)]' : ''}`}>
                                        {filteredTasks.length === 0 ? (
                                            <div className="text-center py-16 rounded-xl bg-surface border border-border">
                                                <h3 className="text-lg font-semibold text-primary mb-2">Không có task nào</h3>
                                                <p className="text-secondary mb-4">Tạo task đầu tiên để bắt đầu</p>
                                                <button
                                                    onClick={() => setIsCreateModalOpen(true)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-accent text-page cursor-pointer"
                                                >
                                                    <PlusIcon className="w-5 h-5" />
                                                    Tạo Task
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <TaskList
                                                    tasks={filteredTasks}
                                                    onSelectTask={setSelectedTask}
                                                    selectedTaskId={selectedTask?.id}
                                                    onTaskUpdated={handleTaskUpdated}
                                                    onTaskDeleted={handleTaskDeleted}
                                                    onTaskReceived={handleTaskReceived}
                                                />

                                                {/* Pagination */}
                                                {pagination.pages > 1 && (
                                                    <div className="flex items-center justify-center gap-2 mt-6">
                                                        <button
                                                            onClick={() => goToPage(pagination.page - 1)}
                                                            disabled={pagination.page <= 1}
                                                            className="p-2 rounded-lg bg-surface border border-border disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <ChevronLeftIcon className="w-5 h-5" />
                                                        </button>
                                                        <span className="text-sm text-secondary px-4">
                                                            Trang {pagination.page} / {pagination.pages}
                                                        </span>
                                                        <button
                                                            onClick={() => goToPage(pagination.page + 1)}
                                                            disabled={pagination.page >= pagination.pages}
                                                            className="p-2 rounded-lg bg-surface border border-border disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <ChevronRightIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Task Detail Panel */}
                                    {selectedTask && (
                                        <div className="w-[400px] flex-shrink-0">
                                            <TaskDetail
                                                task={selectedTask}
                                                onTaskUpdated={handleTaskUpdated}
                                                onTaskDeleted={handleTaskDeleted}
                                                onClose={() => setSelectedTask(null)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )
                    ) : activeView === 'income' ? (
                        <IncomeDashboard stats={incomeStats} loading={incomeLoading} onRangeChange={fetchIncome} />
                    ) : activeView === 'sales' ? (
                        <SalesPage onBack={() => setActiveView('tasks')} />
                    ) : activeView === 'storage' ? (
                        <AccountPage onBack={() => setActiveView('tasks')} />
                    ) : activeView === 'whiteboard' ? (
                        <WhiteboardPage onBack={() => setActiveView('tasks')} />
                    ) : activeView === 'portfolio' ? (
                        <PortfolioPage onBack={() => setActiveView('tasks')} />
                    ) : activeView === 'documents' ? (
                        <DocumentsPage onBack={() => setActiveView('tasks')} />
                    ) : activeView === 'spreadsheets' ? (
                        <SpreadsheetPage onBack={() => setActiveView('tasks')} />
                    ) : activeView === 'team' && selectedTeamId ? (
                        <TeamPage
                            teamId={selectedTeamId}
                            onBack={() => setActiveView('tasks')}
                            onOpenChat={(teamId) => {
                                setChatTeamId(teamId);
                                setActiveView('chat');
                            }}
                        />
                    ) : activeView === 'chat' && chatTeamId ? (
                        <ChatPage
                            teamId={chatTeamId}
                            onBack={() => {
                                setSelectedTeamId(chatTeamId);
                                setActiveView('team');
                            }}
                        />
                    ) : (
                        <SettingsPage user={user} onUserUpdated={(updated) => window.location.reload()} />
                    )}
                </div>
            </main >

            {/* Mobile Search Modal */}
            {
                isSearchModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsSearchModalOpen(false)}>
                        <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-page border border-border">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-secondary flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm tasks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-base text-primary placeholder:text-muted"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={() => setIsSearchModalOpen(false)}
                                    className="w-full mt-3 py-2 text-sm text-secondary hover:text-primary transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Create Task Modal */}
            {
                isCreateModalOpen && (
                    <CreateTaskModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onTaskCreated={handleTaskCreated}
                        projects={projects}
                    />
                )
            }

            {/* Create Project Modal */}
            {
                isCreateProjectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-primary mb-4">Tạo Project mới</h2>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Tên project..."
                                className="w-full px-4 py-3 rounded-lg bg-page border border-border text-primary placeholder:text-muted focus:border-accent focus:outline-none mb-4"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => { setIsCreateProjectModalOpen(false); setNewProjectName(''); }}
                                    className="px-4 py-2 rounded-lg bg-page border border-border text-secondary hover:text-primary cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    className="px-4 py-2 rounded-lg bg-accent text-page font-medium hover:opacity-90 cursor-pointer"
                                >
                                    Tạo Project
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* User Survey Modal */}
            {
                isSurveyOpen && (
                    <SurveyModal onClose={() => setIsSurveyOpen(false)} />
                )
            }

            {/* Support/Bug Report Modal */}
            {
                isSupportOpen && (
                    <SupportModal onClose={() => setIsSupportOpen(false)} />
                )
            }

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                isDanger={confirmConfig.isDanger}
            />
        </div >
    );
}
