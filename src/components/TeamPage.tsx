'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
// import { useRealtime } from '@/contexts/RealtimeContext';
import { toast } from 'react-hot-toast';
import Badge from './Badge';
import {
    UsersIcon,
    PlusIcon,
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon,
    UserPlusIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ClockIcon,
    XMarkIcon,
    LinkIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    XCircleIcon,
    ArrowRightStartOnRectangleIcon,
    TrashIcon,
    StarIcon,
    TrophyIcon,
    FolderIcon,
    ClipboardDocumentListIcon,
    EyeIcon,
    Cog6ToothIcon,
    PhotoIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import { requestNotificationPermission, showNotification } from '@/utils/notifications';
import { useAuth } from '@/hooks/useAuth';
import api, { API_URL } from '@/utils/api';
import ConfirmModal from './ConfirmModal';
import TaskDetail from './TaskDetail';

interface Team {
    id: number;
    name: string;
    owner_id: number;
    owner_name: string;
    member_count: number;
    created_at: string;
    members?: any[];
    my_role?: string;
    pending_requests?: any[];
    avatar_url?: string;
}

interface TeamPageProps {
    teamId: number;
    onBack: () => void;
    onOpenChat?: (teamId: number) => void;
}

export default function TeamPage({ teamId, onBack, onOpenChat }: TeamPageProps) {
    const { user: currentUser } = useAuth();
    const [team, setTeam] = useState<Team | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteTab, setInviteTab] = useState<'direct' | 'link'>('direct');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'members' | 'rating' | 'projects' | 'settings'>('members');
    const [projects, setProjects] = useState<any[]>([]);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectPrice, setProjectPrice] = useState('');
    const [editingTeamName, setEditingTeamName] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const teamAvatarRef = useRef<HTMLInputElement>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [taskName, setTaskName] = useState('');
    const [taskContent, setTaskContent] = useState('');
    const [taskDeadline, setTaskDeadline] = useState('');
    const [taskAssignee, setTaskAssignee] = useState('');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [ratingMember, setRatingMember] = useState<any>(null);
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [taskPrice, setTaskPrice] = useState('');
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [viewingMemberTasks, setViewingMemberTasks] = useState<{ member: any, tasks: any[] } | null>(null);
    const [processingRequests, setProcessingRequests] = useState<Set<number>>(new Set());
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
    const [selectedTaskDetail, setSelectedTaskDetail] = useState<any>(null);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastMessageId = useRef<number>(0);

    const fetchTeamData = useCallback(async (initial = false) => {
        try {
            const [teamRes, tasksRes, messagesRes, projectsRes] = await Promise.all([
                api.get(`/api/teams/${teamId}`),
                api.get(`/api/teams/${teamId}/tasks`),
                api.get(`/api/teams/${teamId}/chat`),
                api.get(`/api/teams/${teamId}/projects`)
            ]);
            setTeam(teamRes.data);
            setTasks(tasksRes.data);
            setMessages(messagesRes.data);
            setProjects(projectsRes.data);

            if (initial) {
                setEditingTeamName(teamRes.data.name);
            }

            if (messagesRes.data.length > 0) {
                lastMessageId.current = messagesRes.data[messagesRes.data.length - 1].id;
            } else {
                lastMessageId.current = -1;
            }
        } catch (error) {
            // Only show error on initial load to avoid toast spam
            if (initial) {
                toast.error('Không thể tải dữ liệu team');
            }
        } finally {
            if (initial) {
                setLoading(false);
            }
        }
    }, [teamId]);

    useEffect(() => {
        fetchTeamData(true);
        requestNotificationPermission();

        // Polling fallback when Realtime is disabled
        let pollInterval: NodeJS.Timeout;
        if (!sseConnected) {
            pollInterval = setInterval(() => {
                // Only poll if tab is active
                if (!document.hidden) {
                    fetchTeamData(false);
                }
            }, 5000); // 5 seconds
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [fetchTeamData, sseConnected]);


    // TEMPORARILY DISABLED: Supabase Realtime causing too many errors
    // Use global Realtime subscription (1 connection for entire app)
    // const { isConnected: sseConnected, addEventListener } = useRealtime();
    const sseConnected = false; // Disabled

    // useEffect(() => {
    //     // Subscribe to global Realtime events
    //     const unsubscribe = addEventListener((event) => {
    //         console.log('TeamPage Realtime event:', event);

    //         // Handle chat message events for this team only
    //         if (event.type === 'chat_message' && event.data.team_id === teamId) {
    //             setMessages(prev => {
    //                 // Check if message already exists
    //                 if (prev.some((m: any) => m.id === event.data.id)) {
    //                     return prev;
    //                 }

    //                 // Show notification for messages from others
    //                 if (event.data.user_id !== currentUser?.id) {
    //                     showNotification(`Tin nhắn mới từ ${event.data.username}`, {
    //                         body: event.data.content || '[Hình ảnh]',
    //                         icon: '/logo.png'
    //                     });
    //                 }

    //                 // Add new message and update lastMessageId
    //                 lastMessageId.current = event.data.id;
    //                 return [...prev, event.data];
    //             });
    //         }
    //     });

    //     return () => unsubscribe();
    // }, [teamId, currentUser?.id, addEventListener]);


    // Scroll to bottom only when user sends a new message (not on initial load or polling)
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || sendingMessage) return;
        setSendingMessage(true);
        try {
            const res = await api.post(`/api/teams/${teamId}/chat`, { content: newMessage });
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
            lastMessageId.current = res.data.id;
            setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            toast.error('Không thể gửi tin nhắn');
        } finally {
            setSendingMessage(false);
        }
    };

    const sendImage = async (file: File) => {
        if (sendingMessage) return;
        setSendingMessage(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post(
                `/api/teams/${teamId}/chat/image`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setMessages(prev => [...prev, res.data]);
            lastMessageId.current = res.data.id;
            setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            toast.error('Không thể gửi ảnh');
        } finally {
            setSendingMessage(false);
        }
    };

    const inviteMember = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            await api.post(`/api/teams/${teamId}/invite`, { username: inviteEmail });
            toast.success('Đã gửi lời mời!');
            setInviteEmail('');
            setShowInviteModal(false);
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể mời thành viên');
        } finally {
            setInviting(false);
        }
    };

    const generateInviteLink = async () => {
        try {
            const res = await api.post(`/api/teams/${teamId}/invite-link`);
            const fullLink = `${window.location.origin}/join-team/${res.data.token}`;
            setInviteLink(fullLink);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể tạo link');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleApprove = async (requestId: number) => {
        if (processingRequests.has(requestId)) return;

        setProcessingRequests(prev => new Set(prev).add(requestId));
        try {
            await api.post(`/api/teams/${teamId}/requests/${requestId}/approve`);
            toast.success('Đã duyệt yêu cầu!');
            fetchTeamData();
        } catch (error) {
            toast.error('Không thể duyệt yêu cầu');
        } finally {
            setProcessingRequests(prev => {
                const updated = new Set(prev);
                updated.delete(requestId);
                return updated;
            });
        }
    };

    const handleReject = async (requestId: number) => {
        if (processingRequests.has(requestId)) return;

        setProcessingRequests(prev => new Set(prev).add(requestId));
        try {
            await api.post(`/api/teams/${teamId}/requests/${requestId}/reject`);
            toast.success('Đã từ chối yêu cầu');
            fetchTeamData();
        } catch (error) {
            toast.error('Không thể từ chối yêu cầu');
        } finally {
            setProcessingRequests(prev => {
                const updated = new Set(prev);
                updated.delete(requestId);
                return updated;
            });
        }
    };

    const handleRemoveMember = async (memberId: number, memberName: string) => {
        if (team?.my_role !== 'owner') {
            toast.error('Chỉ owner mới có thể xóa thành viên');
            return;
        }

        setConfirmConfig({
            isOpen: true,
            title: 'Xóa thành viên',
            message: `Bạn có chắc muốn xóa ${memberName} khỏi team?`,
            isDanger: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/api/teams/${teamId}/members/${memberId}`);
                    toast.success('Đã xóa thành viên khỏi team');
                    fetchTeamData();
                } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Không thể xóa thành viên');
                }
            }
        });
    };

    const leaveTeam = async () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Rời Team',
            message: 'Bạn có chắc chắn muốn rời team này?',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await api.post(`/api/teams/${teamId}/leave`);
                    toast.success('Đã rời team');
                    onBack();
                } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Không thể rời team');
                }
            }
        });
    };

    const dissolveTeam = async () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Giải tán Team',
            message: 'GIẢ TÁN TEAM? Thao tác này không thể hoàn tác và toàn bộ dữ liệu sẽ bị mất!',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await api.post(`/api/teams/${teamId}/dissolve`);
                    toast.success('Đã giải tán team');
                    window.location.href = '/dashboard'; // Force reload to dashboard
                } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Không thể giải tán team');
                }
            }
        });
    };

    const removeMember = async (memberId: number, username: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Xóa thành viên',
            message: `Bạn có chắc muốn xóa ${username} khỏi team?`,
            isDanger: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/api/teams/${teamId}/members/${memberId}`);
                    toast.success('Đã xóa thành viên');
                    fetchTeamData();
                } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Không thể xóa thành viên');
                }
            }
        });
    };

    const updateTeam = async () => {
        if (!editingTeamName.trim()) return;
        try {
            await api.put(`/api/teams/${teamId}`, { name: editingTeamName });
            toast.success('Đã cập nhật tên team!');
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể cập nhật tên team');
        }
    };

    const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setUploadingAvatar(true);
        try {
            await api.post(`${API_URL}/api/teams/${teamId}/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Đã cập nhật avatar!');
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể cập nhật avatar');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const changeRole = async (memberId: number, newRole: 'member' | 'admin') => {
        try {
            await api.put(`/api/teams/${teamId}/members/${memberId}/role`, { role: newRole });
            toast.success('Đã cập nhật vai trò!');
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể cập nhật vai trò');
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get(`/api/teams/${teamId}/ratings`);
            setLeaderboard(res.data);
        } catch (e) { }
    };

    const rateMember = async () => {
        if (!ratingMember) return;
        try {
            await api.post(`/api/teams/${teamId}/members/${ratingMember.user_id}/ratings`,
                { score: ratingScore, comment: ratingComment }
            );
            toast.success('Đã đánh giá!');
            setRatingMember(null);
            setRatingScore(5);
            setRatingComment('');
            fetchLeaderboard();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể đánh giá');
        }
    };

    const createProject = async () => {
        if (!projectName.trim()) return;
        try {
            await api.post(`/api/teams/${teamId}/projects`, {
                name: projectName,
                price: projectPrice ? parseFloat(projectPrice) : 0
            });
            toast.success('Đã tạo project!');
            setProjectName('');
            setProjectPrice('');
            setShowProjectModal(false);
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể tạo project');
        }
    };

    const createTask = async () => {
        if (!taskName.trim() || !selectedProject || !taskAssignee) {
            toast.error('Vui lòng điền đủ thông tin');
            return;
        }
        setIsCreatingTask(true);
        try {
            await api.post(`/api/tasks`, {
                name: taskName,
                content: taskContent,
                deadline: taskDeadline,
                user_id: parseInt(taskAssignee),
                project_id: selectedProject.id,
                team_id: teamId,
                price: parseFloat(taskPrice) || 0
            });
            toast.success('Đã tạo task');
            setTaskName('');
            setTaskContent('');
            setTaskDeadline('');
            setTaskAssignee('');
            setTaskPrice('');
            setShowTaskModal(false);
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể tạo task');
        } finally {
            setIsCreatingTask(false);
        }
    };

    const updateTaskInTeam = async (id: number, data: any) => {
        try {
            const res = await api.put(`/api/tasks/${id}`, data);
            fetchTeamData();
            return res.data;
        } catch (error: any) {
            toast.error('Không thể cập nhật task');
            throw error;
        }
    };

    const deleteTaskInTeam = async (id: number) => {
        try {
            await api.delete(`/api/tasks/${id}`);
            toast.success('Đã xóa task');
            fetchTeamData();
            setShowTaskDetailModal(false);
        } catch (error: any) {
            toast.error('Không thể xóa task');
        }
    };

    useEffect(() => {
        if (activeTab === 'rating') fetchLeaderboard();
    }, [activeTab]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-12 h-12 border-4 rounded-full animate-spin border-accent border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-hover transition-all cursor-pointer">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary">{team?.name}</h1>
                        <p className="text-sm text-secondary">{team?.member_count} thành viên • {team?.my_role}</p>
                    </div>
                </div>
                {(team?.my_role === 'owner' || team?.my_role === 'admin') && (
                    <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-accent text-page rounded-xl font-bold text-sm hover:opacity-90 transition-all cursor-pointer">
                        <UserPlusIcon className="w-4 h-4" />
                        Thêm thành viên
                    </button>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Left Column */}
                <div className="lg:col-span-2 flex flex-col gap-6 overflow-auto custom-scrollbar pr-2">
                    {/* Pending Requests */}
                    {(team?.my_role === 'owner' || team?.my_role === 'admin') && team?.pending_requests && team.pending_requests.length > 0 && (
                        <div className="bg-syntax-yellow/10 border border-syntax-yellow/30 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <ClockIcon className="w-5 h-5 text-syntax-yellow" />
                                <h2 className="font-bold text-primary">Yêu cầu tham gia ({team.pending_requests.length})</h2>
                            </div>
                            <div className="space-y-2">
                                {team.pending_requests.map(r => (
                                    <div key={r.id} className="flex items-center justify-between p-3 bg-page rounded-xl border border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-page">
                                                {r.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <span className="font-medium text-primary">{r.username}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(r.id)}
                                                disabled={processingRequests.has(r.id)}
                                                className="p-2 rounded-lg bg-syntax-green/10 text-syntax-green hover:bg-syntax-green/20 cursor-pointer disabled:opacity-50"
                                            >
                                                {processingRequests.has(r.id) ? (
                                                    <div className="w-4 h-4 border-2 border-syntax-green border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <CheckIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleReject(r.id)}
                                                disabled={processingRequests.has(r.id)}
                                                className="p-2 rounded-lg bg-syntax-red/10 text-syntax-red hover:bg-syntax-red/20 cursor-pointer disabled:opacity-50"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-surface border border-border rounded-2xl p-6">
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => setActiveTab('members')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'members' ? 'bg-accent text-page' : 'text-secondary hover:text-primary'}`}>
                                <UsersIcon className="w-4 h-4" />
                                Thành viên
                            </button>
                            <button onClick={() => setActiveTab('rating')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'rating' ? 'bg-accent text-page' : 'text-secondary hover:text-primary'}`}>
                                <TrophyIcon className="w-4 h-4" />
                                Bảng xếp hạng
                            </button>
                            <button onClick={() => setActiveTab('projects')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'projects' ? 'bg-accent text-page' : 'text-secondary hover:text-primary'}`}>
                                <FolderIcon className="w-4 h-4" />
                                Projects
                            </button>
                            {(team?.my_role === 'owner' || team?.my_role === 'admin') && (
                                <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-accent text-page' : 'text-secondary hover:text-primary'}`}>
                                    <Cog6ToothIcon className="w-4 h-4" />
                                    Cài đặt
                                </button>
                            )}
                        </div>

                        {activeTab === 'members' ? (
                            <div className="flex flex-wrap gap-3">
                                {team?.members?.map(m => (
                                    <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-page rounded-xl border border-border group">
                                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-page overflow-hidden">
                                            {m.avatar_url ? (
                                                <img src={m.avatar_url} alt={m.username} className="w-full h-full object-cover" />
                                            ) : (
                                                m.username[0].toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-primary truncate">{m.username}</p>
                                                <div className="flex flex-wrap gap-1 scale-75 origin-left">
                                                    {m.badges && m.badges.length > 0 ? (
                                                        m.badges.slice(0, 3).map((badge: string, idx: number) => (
                                                            <Badge key={idx} title={badge} size="sm" />
                                                        ))
                                                    ) : (
                                                        <Badge title={m.title} size="sm" />
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-muted uppercase">{m.role}</p>
                                        </div>
                                        {(team?.my_role === 'owner' || team?.my_role === 'admin') && m.user_id !== team.owner_id && (
                                            <>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await api.get(`/api/teams/${teamId}/members/${m.user_id}/tasks`);
                                                            setViewingMemberTasks({ member: m, tasks: res.data });
                                                        } catch (e) {
                                                            toast.error('Không thể tải tasks');
                                                        }
                                                    }}
                                                    className="ml-auto p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-all cursor-pointer"
                                                    title="Xem tasks"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                                {team?.my_role === 'owner' && (
                                                    <button
                                                        onClick={() => handleRemoveMember(m.user_id, m.username)}
                                                        className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                                                        title="Xóa khỏi team"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'rating' ? (
                            <div className="space-y-3">
                                {leaderboard.map((m, idx) => {
                                    const colorMap: any = { gold: 'bg-yellow-500', green: 'bg-syntax-green', yellow: 'bg-yellow-400', red: 'bg-syntax-red', gray: 'bg-muted' };
                                    return (
                                        <div key={m.id} className="flex items-center gap-3 p-3 bg-page rounded-xl border border-border">
                                            <span className="text-lg font-bold text-muted w-6">#{idx + 1}</span>
                                            <div className={`w-3 h-3 rounded-full ${colorMap[m.rank_color] || 'bg-muted'}`} />
                                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-page">
                                                {m.username[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-primary">{m.username}</p>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <StarIconSolid key={s} className={`w-3 h-3 ${s <= m.avg_score ? 'text-yellow-400' : 'text-muted/30'}`} />
                                                    ))}
                                                    <span className="text-[10px] text-muted ml-1">({m.avg_score})</span>
                                                </div>
                                            </div>
                                            {(team?.my_role === 'owner' || team?.my_role === 'admin') && m.user_id !== team?.owner_id && (
                                                <button onClick={() => setRatingMember(m)} className="px-2 py-1 text-xs bg-accent/10 text-accent rounded-lg hover:bg-accent/20 cursor-pointer">
                                                    Đánh giá
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : activeTab === 'projects' ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-primary">Các Project của Team</h3>
                                    {(team?.my_role === 'owner' || team?.my_role === 'admin') && (
                                        <button onClick={() => setShowProjectModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-bold hover:bg-accent/20 cursor-pointer transition-all">
                                            <PlusIcon className="w-3.5 h-3.5" />
                                            Project mới
                                        </button>
                                    )}
                                </div>
                                {projects.length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed border-border rounded-xl text-secondary text-sm">
                                        Chưa có project nào.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {projects.map(p => (
                                            <div key={p.id} className="p-4 bg-page rounded-xl border border-border hover:border-accent/30 transition-all flex justify-between items-center group">
                                                <div>
                                                    <h4 className="font-bold text-primary flex items-center gap-2">
                                                        <FolderIcon className="w-4 h-4 text-accent" />
                                                        {p.name}
                                                    </h4>
                                                    <p className="text-xs text-muted mt-1">{p.task_count} tasks trong project</p>
                                                </div>
                                                {(team?.my_role === 'owner' || team?.my_role === 'admin') && (
                                                    <button
                                                        onClick={() => { setSelectedProject(p); setShowTaskModal(true); }}
                                                        className="px-3 py-1.5 bg-accent text-page rounded-lg text-xs font-bold hover:opacity-90 transition-all cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                    >
                                                        Giao task
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'settings' ? (
                            <div className="space-y-6">
                                {/* Team Profile Settings */}
                                <div className="p-4 bg-page rounded-2xl border border-border">
                                    <h4 className="text-sm font-bold text-primary mb-4">Thông tin Team</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-2xl font-bold text-page overflow-hidden">
                                                {team?.avatar_url ? (
                                                    <img src={`${API_URL}${team.avatar_url}`} alt={team.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    team?.name ? team.name[0].toUpperCase() : 'T'
                                                )}
                                                {uploadingAvatar && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => teamAvatarRef.current?.click()}
                                                className="absolute -bottom-2 -right-2 p-1.5 bg-surface border border-border rounded-lg text-accent hover:scale-110 transition-all cursor-pointer shadow-lg"
                                            >
                                                <PhotoIcon className="w-4 h-4" />
                                            </button>
                                            <input
                                                type="file"
                                                ref={teamAvatarRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={uploadAvatar}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-xs text-muted font-medium">Tên nhóm</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editingTeamName}
                                                    onChange={e => setEditingTeamName(e.target.value)}
                                                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-all"
                                                />
                                                <button
                                                    onClick={updateTeam}
                                                    className="px-4 py-2 bg-accent text-page rounded-xl text-sm font-bold hover:opacity-90 transition-all cursor-pointer"
                                                >
                                                    Lưu
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Members Management */}
                                <div className="p-4 bg-page rounded-2xl border border-border">
                                    <h4 className="text-sm font-bold text-primary mb-4">Quản lý thành viên</h4>
                                    <div className="space-y-3">
                                        {team?.members?.map(m => (
                                            <div key={m.id} className="flex items-center justify-between p-3 bg-surface border border-border/50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-page overflow-hidden">
                                                        {m.avatar_url ? (
                                                            <img src={m.avatar_url} alt={m.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            m.username[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-primary">{m.username}</p>
                                                            <div className="flex flex-wrap gap-1 scale-75 origin-left">
                                                                {m.badges && m.badges.length > 0 ? (
                                                                    m.badges.slice(0, 3).map((badge: string, idx: number) => (
                                                                        <Badge key={idx} title={badge} size="sm" />
                                                                    ))
                                                                ) : (
                                                                    <Badge title={m.title} size="sm" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-muted">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {team.my_role === 'owner' && m.user_id !== team.owner_id ? (
                                                        <select
                                                            value={m.role}
                                                            onChange={(e) => changeRole(m.user_id, e.target.value as any)}
                                                            className="bg-page border border-border rounded-lg px-2 py-1 text-xs text-primary focus:outline-none focus:border-accent cursor-pointer"
                                                        >
                                                            <option value="member">Member</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    ) : (
                                                        <span className="text-xs text-muted uppercase font-medium">{m.role}</span>
                                                    )}

                                                    {team.my_role === 'owner' && m.user_id !== team.owner_id && (
                                                        <button
                                                            onClick={() => removeMember(m.user_id, m.username)}
                                                            className="p-1.5 text-muted hover:text-syntax-red hover:bg-syntax-red/10 rounded-lg transition-all cursor-pointer"
                                                            title="Kick member"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Danger Zone - Only for owner */}
                                {team?.my_role === 'owner' && (
                                    <div className="p-4 bg-syntax-red/5 rounded-2xl border border-syntax-red/20">
                                        <h4 className="text-sm font-bold text-syntax-red mb-2">Giải tán team</h4>
                                        <p className="text-xs text-secondary mb-4">
                                            Giải tán team sẽ xóa tất cả dữ liệu, dự án, và thành viên. Hành động này không thể hoàn tác.
                                        </p>
                                        <button
                                            onClick={dissolveTeam}
                                            className="px-4 py-2 rounded-xl bg-syntax-red text-white text-sm font-bold hover:opacity-90 transition-all cursor-pointer flex items-center gap-2"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            Giải tán
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Team Tasks (Current Active Tasks) */}
                    <div className="bg-surface border border-border rounded-2xl p-6 flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ClipboardDocumentListIcon className="w-5 h-5 text-accent" />
                                <h2 className="font-bold text-primary">Tasks đang thực hiện</h2>
                            </div>
                            <span className="text-xs text-muted">{tasks.length} tasks</span>
                        </div>
                        {tasks.length === 0 ? (
                            <div className="text-center py-8 text-secondary">
                                <ClockIcon className="w-10 h-10 mx-auto mb-2 text-muted" />
                                <p>Chưa có task nào.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tasks.map(t => (
                                    <div
                                        key={t.id}
                                        className="p-4 bg-page rounded-xl border border-border hover:border-accent/50 transition-all cursor-pointer"
                                        onClick={() => {
                                            setSelectedTaskDetail(t);
                                            setShowTaskDetailModal(true);
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-medium text-primary">{t.name}</h3>
                                            {t.is_done && <span className="text-[10px] px-2 py-0.5 bg-syntax-green/20 text-syntax-green rounded-full">Hoàn thành</span>}
                                        </div>
                                        <p className="text-xs text-secondary line-clamp-1">{t.content}</p>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                <span>Tiến độ</span>
                                                <span>{t.state || 0}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-page rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent transition-all duration-500"
                                                    style={{ width: `${t.state || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {t.user_id && (
                                                <span className="text-[10px] text-muted flex items-center gap-1">
                                                    <UsersIcon className="w-3 h-3" />
                                                    {team?.members?.find(m => m.user_id === t.user_id)?.username || 'User'}
                                                </span>
                                            )}
                                            {t.deadline && (
                                                <span className="text-[10px] text-muted flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {new Date(t.deadline).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mini Chat Column */}
                <div className="flex flex-col bg-surface border border-border rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-page/50">
                        <div className="flex items-center gap-2">
                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-accent" />
                            <h2 className="font-bold text-primary">Group Chat</h2>
                        </div>
                        {onOpenChat && (
                            <button
                                onClick={() => onOpenChat(teamId)}
                                className="p-2 rounded-lg text-muted hover:text-accent hover:bg-hover transition-all cursor-pointer"
                                title="Mở rộng chat"
                            >
                                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="overflow-auto p-4 space-y-4 custom-scrollbar h-[400px]">
                        {messages.length === 0 ? (
                            <div className="text-center py-8 text-muted text-sm">Chưa có tin nhắn nào.</div>
                        ) : (
                            messages.map(m => {
                                const isSelf = m.user_id === currentUser?.id;
                                return (
                                    <div key={m.id} className={`flex gap-3 group animate-fade-in ${isSelf ? 'flex-row-reverse' : ''}`}>
                                        <button
                                            onClick={() => setSelectedUserProfile(m)}
                                            className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-page flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-accent/50 transition-all cursor-pointer"
                                        >
                                            {m.avatar_url ? (
                                                <img src={m.avatar_url.startsWith('http') ? m.avatar_url : `${API_URL}${m.avatar_url}`} alt={m.username} className="w-full h-full object-cover" />
                                            ) : (
                                                m.username[0].toUpperCase()
                                            )}
                                        </button>
                                        <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <button
                                                    onClick={() => setSelectedUserProfile(m)}
                                                    className="text-xs font-bold text-primary hover:text-accent transition-colors cursor-pointer"
                                                >
                                                    {isSelf ? 'Bạn' : (m.full_name || m.username)}
                                                </button>
                                                <span className="text-[10px] text-muted">
                                                    {new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {m.image_url ? (
                                                <div className="relative group mt-1">
                                                    <a
                                                        href={m.image_url.startsWith('http') ? m.image_url : `${API_URL}${m.image_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <img
                                                            src={m.image_url.startsWith('http') ? m.image_url : `${API_URL}${m.image_url}`}
                                                            alt="Chat image"
                                                            className="max-w-full rounded-xl border border-border shadow-sm group-hover:opacity-95 transition-all"
                                                            style={{ maxHeight: '200px', width: 'auto', objectFit: 'contain' }}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.parentElement?.insertAdjacentHTML('afterend', '<p class="text-[10px] text-muted italic">Không thể tải ảnh</p>');
                                                            }}
                                                        />
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className={`text-sm p-2.5 rounded-2xl break-words max-w-full ${isSelf
                                                    ? 'bg-accent text-page rounded-tr-none'
                                                    : 'bg-page/40 text-secondary border border-border/50 rounded-tl-none'
                                                    }`}>
                                                    {m.content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 border-t border-border bg-page/30">
                        <div className="flex items-end gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        sendImage(e.target.files[0]);
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 sm:p-2.5 rounded-xl bg-page border border-border text-muted hover:text-accent hover:border-accent transition-all cursor-pointer mb-0.5"
                                title="Gửi ảnh"
                            >
                                <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            <div className="flex-1 flex items-end gap-2 bg-page border border-border rounded-2xl p-2 focus-within:border-accent transition-all">
                                <textarea
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 px-3 py-1 bg-transparent text-primary text-sm focus:outline-none transition-all resize-none min-h-[40px] max-h-[80px] custom-scrollbar"
                                    rows={1}
                                    style={{ height: 'auto' }}
                                    onInput={(e: any) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                                    }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={sendingMessage || !newMessage.trim()}
                                    className="p-2 sm:p-2.5 rounded-xl bg-accent text-page hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer mb-0.5"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            {
                showInviteModal && (
                    <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-primary">Thêm thành viên</h2>
                                <button onClick={() => { setShowInviteModal(false); setInviteLink(''); }} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover cursor-pointer">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex gap-2 mb-6">
                                <button onClick={() => setInviteTab('direct')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${inviteTab === 'direct' ? 'bg-accent text-page' : 'bg-page text-secondary border border-border hover:text-primary'}`}>Add trực tiếp</button>
                                <button onClick={() => setInviteTab('link')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${inviteTab === 'link' ? 'bg-accent text-page' : 'bg-page text-secondary border border-border hover:text-primary'}`}>Link mời</button>
                            </div>
                            {inviteTab === 'direct' ? (
                                <>
                                    <input type="text" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Username hoặc email..." className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none mb-4" />
                                    <button onClick={inviteMember} disabled={inviting} className="w-full py-3 bg-accent text-page font-bold rounded-xl hover:opacity-90 disabled:opacity-50 cursor-pointer">{inviting ? 'Đang gửi...' : 'Gửi lời mời'}</button>
                                </>
                            ) : (
                                <>
                                    {!inviteLink ? (
                                        <button onClick={generateInviteLink} className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-page font-bold rounded-xl hover:opacity-90 cursor-pointer"><LinkIcon className="w-5 h-5" />Tạo link mời</button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input type="text" value={inviteLink} readOnly className="flex-1 px-3 py-2 rounded-lg bg-page border border-border text-sm text-primary" />
                                            <button onClick={copyLink} className="px-4 py-2 rounded-lg bg-accent text-page font-medium text-sm hover:opacity-90 cursor-pointer">{linkCopied ? 'Đã copy' : 'Copy'}</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Project Modal */}
            {
                showProjectModal && (
                    <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-primary">Tạo Project mới</h2>
                                <button onClick={() => setShowProjectModal(false)} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover cursor-pointer">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-xs font-semibold text-secondary uppercase mb-2 block">Tên Project</label>
                                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Tên project..." className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none" autoFocus />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-secondary uppercase mb-2 block">Giá Project (VNĐ)</label>
                                    <input type="number" value={projectPrice} onChange={e => setProjectPrice(e.target.value)} placeholder="Nhập giá..." className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none" />
                                </div>
                            </div>
                            <button onClick={createProject} className="w-full py-3 bg-accent text-page font-bold rounded-xl hover:opacity-90 cursor-pointer">Tạo Project</button>
                        </div>
                    </div>
                )
            }

            {/* Task Assign Modal */}
            {
                showTaskModal && (
                    <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-primary">Giao Task mới</h2>
                                    <p className="text-xs text-muted">Project: {selectedProject?.name}</p>
                                </div>
                                <button onClick={() => setShowTaskModal(false)} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover cursor-pointer">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Tên Task" className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-sm text-primary focus:border-accent focus:outline-none" />
                                <textarea value={taskContent} onChange={e => setTaskContent(e.target.value)} placeholder="Mô tả" className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-sm text-primary focus:border-accent focus:outline-none h-24 resize-none" />
                                <input type="datetime-local" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-sm text-primary focus:border-accent focus:outline-none" />
                                <div className="relative">
                                    <div
                                        onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-sm text-primary focus:border-accent focus:outline-none cursor-pointer flex items-center justify-between"
                                    >
                                        <span className={taskAssignee ? 'text-primary' : 'text-muted'}>
                                            {taskAssignee
                                                ? team?.members?.find((m: any) => m.user_id == taskAssignee)?.username || 'Chọn thành viên...'
                                                : 'Chọn thành viên...'
                                            }
                                        </span>
                                        <svg className={`w-4 h-4 text-muted transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {showMemberDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                                            <div className="p-2 border-b border-border">
                                                <input
                                                    type="text"
                                                    value={memberSearchQuery}
                                                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                    placeholder="Tìm kiếm thành viên..."
                                                    className="w-full px-3 py-2 rounded-lg bg-page border border-border text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {team?.members
                                                    ?.filter((m: any) =>
                                                        m.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                                                        (m.full_name && m.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                                                    )
                                                    .map((m: any) => (
                                                        <div
                                                            key={m.user_id}
                                                            onClick={() => {
                                                                setTaskAssignee(m.user_id.toString());
                                                                setShowMemberDropdown(false);
                                                                setMemberSearchQuery('');
                                                            }}
                                                            className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-hover transition-all ${taskAssignee == m.user_id ? 'bg-accent/10' : ''}`}
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-page text-sm font-bold overflow-hidden flex-shrink-0">
                                                                {m.avatar_url ? (
                                                                    <img src={m.avatar_url} alt={m.username} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    m.username[0].toUpperCase()
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-primary truncate">{m.username}</p>
                                                                {m.full_name && <p className="text-xs text-muted truncate">{m.full_name}</p>}
                                                            </div>
                                                            {taskAssignee == m.user_id && (
                                                                <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
                                                            )}
                                                        </div>
                                                    ))
                                                }
                                                {team?.members?.filter((m: any) =>
                                                    m.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                                                    (m.full_name && m.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                                                ).length === 0 && (
                                                        <p className="px-4 py-3 text-sm text-muted text-center">Không tìm thấy thành viên</p>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted">Giá:</span>
                                    <input
                                        type="number"
                                        value={taskPrice}
                                        onChange={e => setTaskPrice(e.target.value)}
                                        placeholder="0"
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-page border border-border text-sm text-primary focus:border-accent focus:outline-none"
                                    />
                                    <span className="text-sm text-muted">đ</span>
                                </div>
                                <button
                                    onClick={createTask}
                                    disabled={isCreatingTask}
                                    className={`w-full py-3 bg-accent text-page font-bold rounded-xl hover:opacity-90 cursor-pointer ${isCreatingTask ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isCreatingTask ? 'Đang tạo...' : 'Giao Task'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Rating Modal */}
            {
                ratingMember && (
                    <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-primary">Đánh giá {ratingMember.username}</h2>
                                <button onClick={() => setRatingMember(null)} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover cursor-pointer">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} onClick={() => setRatingScore(s)} className="cursor-pointer">
                                        <StarIconSolid className={`w-10 h-10 transition-all ${s <= ratingScore ? 'text-yellow-400' : 'text-muted/30'}`} />
                                    </button>
                                ))}
                            </div>
                            <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Nhận xét..." className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary resize-none h-24 focus:border-accent focus:outline-none mb-4" />
                            <button onClick={rateMember} className="w-full py-3 bg-accent text-page font-bold rounded-xl hover:opacity-90 cursor-pointer">Gửi đánh giá</button>
                        </div>
                    </div>
                )
            }

            {/* Member Tasks Modal */}
            {
                viewingMemberTasks && (
                    <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-page font-bold overflow-hidden">
                                        {viewingMemberTasks.member.avatar_url ? (
                                            <img src={viewingMemberTasks.member.avatar_url} alt={viewingMemberTasks.member.username} className="w-full h-full object-cover" />
                                        ) : (
                                            viewingMemberTasks.member.username[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-primary">Tasks của {viewingMemberTasks.member.username}</h2>
                                        <p className="text-xs text-muted">{viewingMemberTasks.tasks.length} tasks</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingMemberTasks(null)} className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-hover cursor-pointer">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {viewingMemberTasks.tasks.length === 0 ? (
                                    <p className="text-center text-muted py-8">Chưa có task nào được giao.</p>
                                ) : (
                                    viewingMemberTasks.tasks.map((task: any) => (
                                        <div key={task.id} className="bg-page border border-border rounded-xl p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-semibold text-primary">{task.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${task.is_done ? 'bg-syntax-green/20 text-syntax-green' : task.state >= 100 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-accent/20 text-accent'}`}>
                                                        {task.is_done ? 'Hoàn thành' : `${task.state || 0}%`}
                                                    </span>
                                                </div>
                                            </div>
                                            {task.content && (
                                                <p className="text-sm text-secondary mb-3">{task.content}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-muted mb-3">
                                                {task.deadline && (
                                                    <span>Deadline: {new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
                                                )}
                                                {task.price > 0 && (
                                                    <span>Giá: {task.price.toLocaleString('vi-VN')}đ</span>
                                                )}
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-3">
                                                <div
                                                    className={`h-full rounded-full transition-all ${task.is_done ? 'bg-syntax-green' : 'bg-accent'}`}
                                                    style={{ width: `${task.state || 0}%` }}
                                                />
                                            </div>
                                            {/* Images */}
                                            {task.images && task.images.length > 0 && (
                                                <div className="grid grid-cols-3 gap-2 mt-3">
                                                    {task.images.map((img: any) => (
                                                        <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                                                            <img src={img.url} alt="Task image" className="w-full h-20 object-cover rounded-lg border border-border hover:opacity-80 transition-all" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* User Profile Modal */}
            {
                selectedUserProfile && (
                    <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-2xl animate-fade-in text-center relative overflow-hidden">
                            {/* Background Decor */}
                            <div className="absolute top-0 left-0 w-full h-24 bg-accent/10 -z-10" />

                            <button onClick={() => setSelectedUserProfile(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-hover text-secondary hover:text-primary transition-all cursor-pointer">
                                <XMarkIcon className="w-5 h-5" />
                            </button>

                            <div className="w-24 h-24 rounded-full bg-accent mx-auto mb-4 border-4 border-surface shadow-xl flex items-center justify-center text-3xl font-bold text-page overflow-hidden">
                                {selectedUserProfile.avatar_url ? (
                                    <img src={selectedUserProfile.avatar_url} alt={selectedUserProfile.username} className="w-full h-full object-cover" />
                                ) : (
                                    selectedUserProfile.username[0].toUpperCase()
                                )}
                            </div>

                            <h2 className="text-xl font-bold text-primary mb-1">{selectedUserProfile.full_name || 'Chưa đặt tên'}</h2>
                            <p className="text-sm text-accent font-medium mb-2">@{selectedUserProfile.username}</p>
                            {selectedUserProfile.email && (
                                <p className="text-xs text-muted mb-4">{selectedUserProfile.email}</p>
                            )}

                            {/* Team Badges Section */}
                            {selectedUserProfile.badges && selectedUserProfile.badges.length > 0 && (
                                <div className="mb-4 p-4 bg-page/50 rounded-xl border border-border/50">
                                    <h3 className="text-xs font-bold text-muted uppercase mb-3 text-left">Thành tích trong team</h3>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {selectedUserProfile.badges.map((badge: string, idx: number) => (
                                            <Badge key={idx} title={badge} size="md" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Global Badges Section - would need API endpoint to fetch */}
                            <div className="mb-4 p-4 bg-page/50 rounded-xl border border-border/50">
                                <h3 className="text-xs font-bold text-muted uppercase mb-3 text-left"></h3>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {selectedUserProfile.title && (
                                        <Badge title={selectedUserProfile.title} size="md" />
                                    )}
                                    <p className="text-xs text-muted w-full mt-2"></p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border/50 text-left">
                                {selectedUserProfile.role && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted">Vai trò:</span>
                                        <span className="text-primary font-medium uppercase">{selectedUserProfile.role}</span>
                                    </div>
                                )}
                                {selectedUserProfile.joined_at && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted">Tham gia:</span>
                                        <span className="text-primary">{new Date(selectedUserProfile.joined_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-secondary justify-center pt-2">
                                    <div className="w-2 h-2 rounded-full bg-syntax-green" />
                                    <span className="text-sm">Đang hoạt động</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedUserProfile(null)}
                                className="w-full mt-6 py-3 bg-accent text-page font-bold rounded-2xl hover:opacity-90 transition-all cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Task Detail Modal */}
            {showTaskDetailModal && selectedTaskDetail && (
                <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-lg h-[80vh]">
                        <TaskDetail
                            task={selectedTaskDetail}
                            onClose={() => {
                                setShowTaskDetailModal(false);
                                setSelectedTaskDetail(null);
                            }}
                            onTaskUpdated={(id, data) => updateTaskInTeam(id, data)}
                            onTaskDeleted={(id) => deleteTaskInTeam(id)}
                        />
                    </div>
                </div>
            )}
        </div >
    );
}
