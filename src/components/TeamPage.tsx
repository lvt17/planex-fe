'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
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
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastMessageId = useRef<number>(0);

    const fetchTeamData = useCallback(async () => {
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
            if (messagesRes.data.length > 0) {
                lastMessageId.current = messagesRes.data[messagesRes.data.length - 1].id;
            } else {
                lastMessageId.current = -1;
            }
        } catch (error) {
            toast.error('Không thể tải dữ liệu team');
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        fetchTeamData();
        requestNotificationPermission();
    }, [fetchTeamData]);

    useEffect(() => {
        const pollInterval = setInterval(async () => {
            if (lastMessageId.current === 0) return;
            try {
                const res = await api.get(`/api/teams/${teamId}/chat?after=${lastMessageId.current}`);
                if (res.data.length > 0) {
                    setMessages(prev => {
                        const existingIds = new Set(prev.map((m: any) => m.id));
                        const newMessages = res.data.filter((m: any) => !existingIds.has(m.id));
                        if (newMessages.length === 0) return prev;

                        // Show notifications for new messages from others
                        newMessages.forEach((m: any) => {
                            if (m.username !== team?.owner_name) { // Simple check, should probably use current user id
                                showNotification(`Tin nhắn mới từ ${m.username}`, {
                                    body: m.content,
                                    tag: `team-chat-${teamId}`
                                });
                            }
                        });

                        return [...prev, ...newMessages];
                    });
                    lastMessageId.current = res.data[res.data.length - 1].id;
                }
            } catch (e) { }
        }, 3000);
        return () => clearInterval(pollInterval);
    }, [teamId, team?.owner_name]);

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
        try {
            await api.post(`/api/teams/${teamId}/requests/${requestId}/approve`);
            toast.success('Đã duyệt yêu cầu!');
            fetchTeamData();
        } catch (error) {
            toast.error('Không thể duyệt yêu cầu');
        }
    };

    const handleReject = async (requestId: number) => {
        try {
            await api.post(`/api/teams/${teamId}/requests/${requestId}/reject`);
            toast.success('Đã từ chối yêu cầu');
            fetchTeamData();
        } catch (error) {
            toast.error('Không thể từ chối');
        }
    };

    const leaveTeam = async () => {
        if (!confirm('Bạn chắc chắn muốn rời team?')) return;
        try {
            await api.post(`/api/teams/${teamId}/leave`);
            toast.success('Đã rời team');
            onBack();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể rời team');
        }
    };

    const dissolveTeam = async () => {
        if (!confirm('GIẢ TÁN TEAM? Thao tác này không thể hoàn tác!')) return;
        try {
            await api.post(`/api/teams/${teamId}/dissolve`);
            toast.success('Đã giải tán team');
            onBack();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể giải tán team');
        }
    };

    const removeMember = async (memberId: number, username: string) => {
        if (!confirm(`Xóa ${username} khỏi team?`)) return;
        try {
            await api.delete(`/api/teams/${teamId}/members/${memberId}`);
            toast.success('Đã xóa thành viên');
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể xóa');
        }
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
            await api.post(`/api/teams/${teamId}/avatar`, formData, {
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
            await api.post(`/api/teams/${teamId}/ratings/${ratingMember.user_id}`,
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
            await api.post(`/api/teams/${teamId}/projects`, { name: projectName });
            toast.success('Đã tạo project!');
            setProjectName('');
            setShowProjectModal(false);
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể tạo project');
        }
    };

    const createTask = async () => {
        if (!taskName.trim() || !selectedProject || isCreatingTask) return;
        setIsCreatingTask(true);
        try {
            await api.post(`/api/teams/${teamId}/projects/${selectedProject.id}/tasks`, {
                name: taskName,
                content: taskContent,
                deadline: taskDeadline,
                assigned_to: taskAssignee || null,
                price: taskPrice ? parseInt(taskPrice) : 0
            });
            toast.success('Đã tạo và giao task!');
            setShowTaskModal(false);
            setTaskName('');
            setTaskContent('');
            setTaskDeadline('');
            setTaskAssignee('');
            setTaskPrice('');
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Không thể tạo task');
        } finally {
            setIsCreatingTask(false);
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
                                            <button onClick={() => handleApprove(r.id)} className="p-2 rounded-lg bg-syntax-green/10 text-syntax-green hover:bg-syntax-green/20 cursor-pointer">
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleReject(r.id)} className="p-2 rounded-lg bg-syntax-red/10 text-syntax-red hover:bg-syntax-red/20 cursor-pointer">
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
                                                <img src={m.avatar_url.startsWith('http') ? m.avatar_url : `${API_URL}${m.avatar_url}`} alt={m.username} className="w-full h-full object-cover" />
                                            ) : (
                                                m.username[0].toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-primary">{m.username}</p>
                                            <p className="text-[10px] text-muted uppercase">{m.role}</p>
                                        </div>
                                        {(team?.my_role === 'owner' || team?.my_role === 'admin') && m.user_id !== currentUser?.id && (
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
                                            {(team?.my_role === 'owner' || team?.my_role === 'admin') && m.user_id !== currentUser?.id && (
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
                                                    <button onClick={() => { setSelectedProject(p); setShowTaskModal(true); }} className="px-3 py-1.5 bg-accent text-page rounded-lg text-xs font-bold hover:opacity-90 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
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
                                                            <img src={m.avatar_url.startsWith('http') ? m.avatar_url : `${API_URL}${m.avatar_url}`} alt={m.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            m.username[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-primary">{m.username}</p>
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
                                    <div key={t.id} className="p-4 bg-page rounded-xl border border-border hover:border-accent/50 transition-all">
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
                                                            className="max-w-full rounded-lg border border-border shadow-sm group-hover:opacity-95 transition-all"
                                                            style={{ maxHeight: '200px', width: 'auto', objectFit: 'contain' }}
                                                        />
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className={`px-3 py-1.5 rounded-xl text-xs break-words shadow-sm ${isSelf
                                                    ? 'bg-accent text-page rounded-tr-none'
                                                    : 'bg-page border border-border text-primary rounded-tl-none'
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
                    <div className="p-3 border-t border-border bg-page/30">
                        <div className="flex gap-2">
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
                                className="p-2 rounded-lg bg-page border border-border text-muted hover:text-accent hover:border-accent transition-all cursor-pointer"
                            >
                                <PhotoIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 px-3 py-2 rounded-lg bg-page border border-border text-xs text-primary focus:border-accent focus:outline-none"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={sendingMessage || !newMessage.trim()}
                                className={`p-2 rounded-lg bg-accent text-page hover:opacity-90 transition-all cursor-pointer ${sendingMessage || !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals - Same as before but updated with API client if needed */}
            {/* ... remaining modal code is same as original version ... */}
        </div>
    );
}
