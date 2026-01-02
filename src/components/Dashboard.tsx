'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useIncome } from '@/hooks/useIncome';
import Sidebar from './Sidebar';
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
import { Task } from '@/types';
import { toast } from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    BellIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { tasks, loading, pagination, filters, fetchTasks, applyFilters, goToPage, createTask, updateTask, deleteTask, stats } = useTasks();
    const { stats: incomeStats, loading: incomeLoading, fetchStats: fetchIncome } = useIncome();

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeView, setActiveView] = useState<'tasks' | 'income' | 'settings' | 'storage' | 'whiteboard' | 'portfolio' | 'documents' | 'spreadsheets' | 'sales' | 'team' | 'chat'>('tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [chatTeamId, setChatTeamId] = useState<number | null>(null);

    useEffect(() => {
        if (activeView === 'income') {
            fetchIncome('month');
        }
    }, [activeView, fetchIncome]);

    // Check survey status
    useEffect(() => {
        const checkSurvey = async () => {
            const token = sessionStorage.getItem('access_token');
            if (!token) return;

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
                const response = await axios.get(`${API_URL}/api/feedback/survey/check`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.data.completed) {
                    setIsSurveyOpen(true);
                }
            } catch (error) {
                console.error('Failed to check survey status', error);
            }
        };

        checkSurvey();
    }, []);

    const handleApplyFilters = () => {
        const newFilters: any = {};
        if (statusFilter !== 'all') newFilters.status = statusFilter;
        if (deadlineFilter !== 'all') newFilters.deadline = deadlineFilter;
        applyFilters(newFilters);
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
            const token = sessionStorage.getItem('access_token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';
            await axios.post(`${API_URL}/api/income/add`, {
                name: task.name,
                amount: task.price,
                source: 'job'
            }, {
                headers: { Authorization: `Bearer ${token}` }
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
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border">
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

                    <div className="flex items-center gap-4">
                        {activeView === 'tasks' && (
                            <>
                                {/* Search */}
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-page border border-border">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-secondary" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-primary w-40 placeholder:text-muted"
                                    />
                                </div>

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

                        {/* Avatar */}
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-medium text-sm text-page">
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 p-6 overflow-auto">
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
                                {/* Filters */}
                                <div className="flex items-center gap-4 mb-6 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <FunnelIcon className="w-4 h-4 text-secondary" />
                                        <span className="text-sm text-secondary">Lọc:</span>
                                    </div>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 text-sm rounded-lg bg-surface border border-border text-primary cursor-pointer"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="pending">Chưa bắt đầu</option>
                                        <option value="in_progress">Đang làm</option>
                                        <option value="done">Hoàn thành</option>
                                    </select>

                                    <select
                                        value={deadlineFilter}
                                        onChange={(e) => setDeadlineFilter(e.target.value)}
                                        className="px-3 py-2 text-sm rounded-lg bg-surface border border-border text-primary cursor-pointer"
                                    >
                                        <option value="all">Tất cả deadline</option>
                                        <option value="today">Hôm nay</option>
                                        <option value="week">Tuần này</option>
                                        <option value="overdue">Quá hạn</option>
                                    </select>

                                    <button
                                        onClick={handleApplyFilters}
                                        className="px-4 py-2 text-sm rounded-lg bg-accent text-page font-medium hover:opacity-90 cursor-pointer"
                                    >
                                        Áp dụng
                                    </button>
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
                    ) : activeView === 'chat' ? (
                        <ChatPage
                            initialTeamId={chatTeamId || undefined}
                            onBack={() => {
                                if (chatTeamId) {
                                    setSelectedTeamId(chatTeamId);
                                    setActiveView('team');
                                } else {
                                    setActiveView('tasks');
                                }
                            }}
                        />
                    ) : (
                        <SettingsPage user={user} onUserUpdated={(updated) => window.location.reload()} />
                    )}
                </div>
            </main>

            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={handleTaskCreated}
                />
            )}

            {/* User Survey Modal */}
            {isSurveyOpen && (
                <SurveyModal onClose={() => setIsSurveyOpen(false)} />
            )}

            {/* Support/Bug Report Modal */}
            {isSupportOpen && (
                <SupportModal onClose={() => setIsSupportOpen(false)} />
            )}
        </div>
    );
}
