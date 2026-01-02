'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon,
    ArrowLeftIcon,
    UsersIcon,
    PhotoIcon,
    XMarkIcon,
    BellIcon,
    BellSlashIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ChatPageProps {
    initialTeamId?: number;
    onBack: () => void;
}

interface Team {
    id: number;
    name: string;
    member_count: number;
    avatar_url?: string;
}

interface Message {
    id: number;
    user_id: number;
    username: string;
    full_name?: string;
    avatar_url?: string;
    content: string;
    image_url?: string;
    created_at: string;
}

export default function ChatPage({ initialTeamId, onBack }: ChatPageProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(initialTeamId || null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [showAboutTeam, setShowAboutTeam] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const lastMessageId = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getAuthHeader = () => {
        const token = sessionStorage.getItem('access_token');
        return { Authorization: `Bearer ${token}` };
    };

    // Fetch current user and teams
    const initPage = useCallback(async () => {
        try {
            const [userRes, teamsRes] = await Promise.all([
                axios.get(`${API_URL}/api/users/me`, { headers: getAuthHeader() }),
                axios.get(`${API_URL}/api/teams`, { headers: getAuthHeader() })
            ]);
            setCurrentUser(userRes.data);
            setTeams(teamsRes.data || []);
            if (!selectedTeamId && teamsRes.data.length > 0) {
                setSelectedTeamId(initialTeamId || teamsRes.data[0].id);
            }
        } catch (error) {
            console.error('Failed to init chat page:', error);
        } finally {
            setLoading(false);
        }
    }, [initialTeamId, selectedTeamId]);

    useEffect(() => {
        initPage();
    }, []);

    // Fetch messages for selected team
    const fetchMessages = useCallback(async () => {
        if (!selectedTeamId) return;
        try {
            const res = await axios.get(`${API_URL}/api/teams/${selectedTeamId}/chat`, { headers: getAuthHeader() });
            setMessages(res.data || []);
            if (res.data.length > 0) {
                lastMessageId.current = res.data[res.data.length - 1].id;
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    }, [selectedTeamId]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (selectedTeamId) {
            fetchMessages();
        }
    }, [selectedTeamId]);

    // Poll for new messages
    useEffect(() => {
        if (!selectedTeamId) return;
        const pollInterval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_URL}/api/teams/${selectedTeamId}/chat`, { headers: getAuthHeader() });
                if (res.data.length > 0 && res.data[res.data.length - 1].id !== lastMessageId.current) {
                    setMessages(res.data);
                    lastMessageId.current = res.data[res.data.length - 1].id;
                }
            } catch (e) { }
        }, 3000);
        return () => clearInterval(pollInterval);
    }, [selectedTeamId]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedTeamId || sendingMessage) return;
        setSendingMessage(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/teams/${selectedTeamId}/chat`,
                { content: newMessage },
                { headers: getAuthHeader() }
            );
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
        if (!selectedTeamId) return;
        setSendingMessage(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await axios.post(
                `${API_URL}/api/teams/${selectedTeamId}/chat/image`,
                formData,
                { headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' } }
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

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    const imageMessages = messages.filter(m => m.image_url);

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
            <div className="flex items-center gap-4 mb-4">
                <button onClick={onBack} className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-hover transition-all cursor-pointer">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-accent" />
                <h1 className="text-xl font-bold text-primary">Group Chat</h1>
                {imageMessages.length > 0 && (
                    <button
                        onClick={() => setShowImageGallery(true)}
                        className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-sm hover:bg-accent/20 transition-all cursor-pointer"
                    >
                        <PhotoIcon className="w-4 h-4" />
                        Kho ảnh
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
                {/* Team Sidebar - 1/7 of width */}
                <div className="w-1/6 min-w-[180px] max-w-[250px] bg-surface border border-border rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-border">
                        <h3 className="text-sm font-semibold text-primary">Teams</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {teams.length === 0 ? (
                            <p className="p-4 text-sm text-muted text-center">Chưa tham gia team nào</p>
                        ) : (
                            teams.map(team => (
                                <div
                                    key={team.id}
                                    onClick={() => setSelectedTeamId(team.id)}
                                    className={`p-3 cursor-pointer transition-all border-l-4 ${selectedTeamId === team.id
                                        ? 'bg-accent/10 border-accent'
                                        : 'border-transparent hover:bg-hover'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                            <UsersIcon className="w-5 h-5 text-accent" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-primary truncate">{team.name}</p>
                                            <p className="text-xs text-muted">{team.member_count} thành viên</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area - 6/7 of width */}
                <div className="flex-1 bg-surface border border-border rounded-2xl overflow-hidden flex flex-col">
                    {selectedTeamId ? (
                        <>
                            {/* Chat Header - Click for About Team */}
                            <div
                                className="p-4 border-b border-border flex items-center justify-between cursor-pointer hover:bg-page/50 transition-all"
                                onClick={() => setShowAboutTeam(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                                        {selectedTeam?.avatar_url ? (
                                            <img src={`${API_URL}${selectedTeam.avatar_url}`} alt={selectedTeam.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <UsersIcon className="w-5 h-5 text-page" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-primary">{selectedTeam?.name}</h3>
                                        <p className="text-xs text-muted">{selectedTeam?.member_count} thành viên</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {isNotificationEnabled ? (
                                        <BellIcon className="w-5 h-5 text-accent" />
                                    ) : (
                                        <BellSlashIcon className="w-5 h-5 text-muted" />
                                    )}
                                    <InformationCircleIcon className="w-5 h-5 text-muted hover:text-accent" />
                                </div>
                            </div>

                            {/* Messages Container - FIXED HEIGHT (approx 8 messages) */}
                            <div className="flex-1 min-h-0 flex flex-col">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar max-h-[550px] scroll-smooth">
                                    {messages.length === 0 ? (
                                        <p className="text-center text-muted py-8">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                                    ) : (
                                        messages.map(msg => {
                                            const isSelf = msg.user_id === currentUser?.id;
                                            return (
                                                <div key={msg.id} className={`flex gap-3 animate-fade-in ${isSelf ? 'flex-row-reverse' : ''}`}>
                                                    <button
                                                        onClick={() => setSelectedUserProfile(msg)}
                                                        className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-page text-sm font-bold flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-accent/50 transition-all cursor-pointer"
                                                    >
                                                        {msg.avatar_url ? (
                                                            <img src={msg.avatar_url.startsWith('http') ? msg.avatar_url : `${API_URL}${msg.avatar_url}`} alt={msg.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            msg.username[0].toUpperCase()
                                                        )}
                                                    </button>
                                                    <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <button
                                                                onClick={() => setSelectedUserProfile(msg)}
                                                                className="font-semibold text-primary text-[11px] hover:text-accent transition-colors cursor-pointer"
                                                            >
                                                                {isSelf ? 'Bạn' : (msg.full_name || msg.username)}
                                                            </button>
                                                            <span className="text-[10px] text-muted">{formatTime(msg.created_at)}</span>
                                                        </div>
                                                        {msg.image_url ? (
                                                            <div className="relative group mt-1">
                                                                <a
                                                                    href={msg.image_url.startsWith('http') ? msg.image_url : `${API_URL}${msg.image_url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <img
                                                                        src={msg.image_url.startsWith('http') ? msg.image_url : `${API_URL}${msg.image_url}`}
                                                                        alt="Chat image"
                                                                        className="max-w-full rounded-xl border border-border shadow-sm group-hover:opacity-95 transition-all"
                                                                        style={{ maxHeight: '400px', width: 'auto', objectFit: 'contain' }}
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.style.display = 'none';
                                                                            target.parentElement?.insertAdjacentHTML('afterend', '<p class="text-[10px] text-muted italic">Không thể tải ảnh</p>');
                                                                        }}
                                                                    />
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div className={`px-4 py-2.5 rounded-2xl text-[13px] break-words shadow-sm ${isSelf
                                                                ? 'bg-accent text-page rounded-tr-none'
                                                                : 'bg-page border border-border text-primary rounded-tl-none'
                                                                }`}>
                                                                {msg.content}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-border">
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
                                        className="px-3 py-3 rounded-xl bg-page border border-border text-muted hover:text-accent hover:border-accent transition-all cursor-pointer"
                                    >
                                        <PhotoIcon className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                        placeholder="Nhập tin nhắn..."
                                        className="flex-1 px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={sendingMessage || !newMessage.trim()}
                                        className={`px-4 py-3 rounded-xl bg-accent text-page font-bold hover:opacity-90 transition-all cursor-pointer ${sendingMessage || !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-muted">Chọn một team để bắt đầu chat</p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Profile Modal */}
            {selectedUserProfile && (
                <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setSelectedUserProfile(null)}>
                    <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-3xl font-bold text-page mb-4 overflow-hidden">
                                {selectedUserProfile.avatar_url ? (
                                    <img src={selectedUserProfile.avatar_url.startsWith('http') ? selectedUserProfile.avatar_url : `${API_URL}${selectedUserProfile.avatar_url}`} alt={selectedUserProfile.username} className="w-full h-full object-cover" />
                                ) : (
                                    selectedUserProfile.username[0].toUpperCase()
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-primary">{selectedUserProfile.full_name || selectedUserProfile.username}</h3>
                            <p className="text-sm text-muted mb-4">@{selectedUserProfile.username}</p>
                            <button onClick={() => setSelectedUserProfile(null)} className="px-6 py-2 bg-accent text-page rounded-xl font-medium hover:opacity-90 cursor-pointer">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* About Team Modal */}
            {showAboutTeam && (
                <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setShowAboutTeam(false)}>
                    <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="relative p-6 pt-10 flex flex-col items-center flex-shrink-0">
                            <button onClick={() => setShowAboutTeam(false)} className="absolute top-4 right-4 p-2 text-muted hover:text-primary transition-all">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                            <div className="w-24 h-24 rounded-2xl bg-accent flex items-center justify-center mb-4 shadow-xl overflow-hidden">
                                {selectedTeam?.avatar_url ? (
                                    <img src={`${API_URL}${selectedTeam.avatar_url}`} alt={selectedTeam.name} className="w-full h-full object-cover" />
                                ) : (
                                    <UsersIcon className="w-10 h-10 text-page" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-1">{selectedTeam?.name}</h3>
                            <p className="text-sm text-muted mb-6">{selectedTeam?.member_count} thành viên</p>

                            <div className="w-full space-y-2">
                                <button
                                    onClick={() => setIsNotificationEnabled(!isNotificationEnabled)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-page hover:bg-hover transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isNotificationEnabled ? 'bg-accent/10 text-accent' : 'bg-muted/10 text-muted'}`}>
                                            {isNotificationEnabled ? <BellIcon className="w-5 h-5" /> : <BellSlashIcon className="w-5 h-5" />}
                                        </div>
                                        <span className="text-sm font-medium text-secondary group-hover:text-primary">Thông báo nhóm</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full transition-all relative ${isNotificationEnabled ? 'bg-accent' : 'bg-muted'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isNotificationEnabled ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </button>

                                <button
                                    onClick={() => { setShowAboutTeam(false); setShowImageGallery(true); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-page hover:bg-hover transition-all cursor-pointer group"
                                >
                                    <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                        <PhotoIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium text-secondary group-hover:text-primary">Kho ảnh & Video</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Gallery Modal */}
            {showImageGallery && (
                <div className="fixed inset-0 bg-page/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setShowImageGallery(false)}>
                    <div className="w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div className="flex items-center gap-3">
                                <PhotoIcon className="w-6 h-6 text-accent" />
                                <h2 className="text-lg font-bold text-primary">Kho ảnh - {selectedTeam?.name}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowImageGallery(false)} className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-hover cursor-pointer">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                            {imageMessages.length === 0 ? (
                                <div className="text-center py-20 bg-page/30 rounded-3xl border-2 border-dashed border-border">
                                    <PhotoIcon className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-muted">Chưa có ảnh nào được gửi.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {imageMessages.map(msg => (
                                        <a key={msg.id} href={`${API_URL}${msg.image_url}`} target="_blank" rel="noopener noreferrer" className="group relative aspect-square">
                                            <img
                                                src={`${API_URL}${msg.image_url}`}
                                                alt="Gallery"
                                                className="w-full h-full object-cover rounded-xl border border-border ring-accent/0 group-hover:ring-4 transition-all"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl opacity-0 group-hover:opacity-100 transition-all">
                                                <p className="text-[10px] text-white font-medium truncate">{msg.username}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
