'use client';

import { useState, useEffect, useRef } from 'react';
import {
    PaperAirplaneIcon,
    PhotoIcon,
    ArrowLeftIcon,
    ClockIcon,
    FaceSmileIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import api, { API_URL } from '@/utils/api';

interface Message {
    id: number;
    user_id: number;
    username: string;
    full_name?: string;
    content: string;
    image_url?: string;
    created_at: string;
    avatar_url?: string;
}

interface ChatPageProps {
    teamId: number;
    onBack: () => void;
}

export default function ChatPage({ teamId, onBack }: ChatPageProps) {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [teamName, setTeamName] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastMessageId = useRef<number>(0);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const [msgRes, teamRes] = await Promise.all([
                api.get(`/api/teams/${teamId}/chat`),
                api.get(`/api/teams/${teamId}`)
            ]);
            setMessages(msgRes.data);
            setTeamName(teamRes.data.name);
            if (msgRes.data.length > 0) {
                lastMessageId.current = msgRes.data[msgRes.data.length - 1].id;
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            toast.error('Không thể tải tin nhắn');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchMessages();

        const pollInterval = setInterval(async () => {
            if (lastMessageId.current === 0) return;
            try {
                const res = await api.get(`/api/teams/${teamId}/chat?after=${lastMessageId.current}`);
                if (res.data.length > 0) {
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const newMsgs = res.data.filter((m: any) => !existingIds.has(m.id));
                        if (newMsgs.length === 0) return prev;
                        return [...prev, ...newMsgs];
                    });
                    lastMessageId.current = res.data[res.data.length - 1].id;
                }
            } catch (e) { }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [teamId]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await api.post(`/api/teams/${teamId}/chat`, { content: newMessage });
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
            lastMessageId.current = res.data.id;
            setTimeout(scrollToBottom, 50);
        } catch (error) {
            toast.error('Không thể gửi tin nhắn');
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh phải nhỏ hơn 5MB');
            return;
        }

        setSending(true);
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
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            toast.error('Không thể gửi ảnh');
        } finally {
            setSending(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-12 h-12 border-4 rounded-full animate-spin border-accent border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-surface border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-page/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-hover transition-all">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-bold text-primary">{teamName} Chat</h2>
                        <p className="text-xs text-secondary flex items-center gap-1">
                            <span className="w-2 h-2 bg-syntax-green rounded-full"></span>
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted opacity-50 space-y-2">
                        <div className="p-4 bg-muted/10 rounded-full">
                            <ClockIcon className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium">Chưa có tin nhắn nào</p>
                        <p className="text-xs">Bắt đầu cuộc hội thoại ngay!</p>
                    </div>
                ) : (
                    messages.map((m, idx) => {
                        const isSelf = m.user_id === currentUser?.id;
                        const showAvatar = idx === 0 || messages[idx - 1].user_id !== m.user_id;

                        return (
                            <div key={m.id} className={`flex gap-3 group animate-fade-in ${isSelf ? 'flex-row-reverse' : ''}`}>
                                {showAvatar ? (
                                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-page flex-shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-accent/20 transition-all">
                                        {m.avatar_url ? (
                                            <img src={m.avatar_url.startsWith('http') ? m.avatar_url : `${API_URL}${m.avatar_url}`} alt={m.username} className="w-full h-full object-cover" />
                                        ) : (
                                            m.username[0].toUpperCase()
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-10 flex-shrink-0" />
                                )}
                                <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                    {showAvatar && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-primary">{isSelf ? 'Bạn' : (m.full_name || m.username)}</span>
                                            <span className="text-[10px] text-muted">
                                                {new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                    {m.image_url ? (
                                        <div className="relative group/img mt-1">
                                            <a
                                                href={m.image_url.startsWith('http') ? m.image_url : `${API_URL}${m.image_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <img
                                                    src={m.image_url.startsWith('http') ? m.image_url : `${API_URL}${m.image_url}`}
                                                    alt="Chat content"
                                                    className="rounded-2xl border border-border shadow-sm max-h-[300px] hover:opacity-95 transition-all w-auto"
                                                />
                                            </a>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                <button className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-all">
                                                    <PlusIcon className="w-4 h-4 rotate-45" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm break-words shadow-sm transition-all ${isSelf
                                            ? 'bg-accent text-page rounded-tr-none hover:bg-accent/90'
                                            : 'bg-page border border-border text-primary rounded-tl-none hover:border-accent/30'
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

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-page/30 backdrop-blur-md">
                <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl p-2 focus-within:border-accent transition-all shadow-sm">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 sm:p-2.5 rounded-xl text-secondary hover:text-accent hover:bg-accent/10 transition-all flex-shrink-0"
                        title="Gửi ảnh"
                    >
                        <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    {!isMobile && (
                        <button className="p-2.5 rounded-xl text-secondary hover:text-accent hover:bg-accent/10 transition-all flex-shrink-0">
                            <FaceSmileIcon className="w-6 h-6" />
                        </button>
                    )}
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-primary placeholder:text-muted/50 text-sm py-2"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                        className={`p-2 sm:p-2.5 rounded-xl bg-accent text-page transition-all flex-shrink-0 shadow-lg shadow-accent/20 ${sending || !newMessage.trim() ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                            }`}
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex justify-between mt-2 px-1">
                    <p className="text-[10px] text-muted font-medium">Shift + Enter để xuống dòng</p>
                    {sending && <p className="text-[10px] text-accent animate-pulse">Đang gửi...</p>}
                </div>
            </div>
        </div>
    );
}
