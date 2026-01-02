'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

interface Comment {
    id: number;
    task_id?: number;
    subtask_id?: number;
    user_id: number;
    username: string;
    avatar_url?: string;
    content: string;
    created_at: string;
}

interface CommentSectionProps {
    taskId?: number;
    subtaskId?: number;
    type: 'task' | 'subtask';
}

export default function CommentSection({ taskId, subtaskId, type }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchComments();
    }, [taskId, subtaskId]);

    useEffect(() => {
        // Auto-scroll to bottom when new comments arrive
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const endpoint = type === 'task'
                ? `/api/tasks/${taskId}/comments`
                : `/api/subtasks/${subtaskId}/comments`;
            const res = await api.get(endpoint);
            setComments(res.data);
        } catch (error) {
            toast.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const addComment = async () => {
        if (!newComment.trim()) return;

        setPosting(true);
        try {
            const endpoint = type === 'task'
                ? `/api/tasks/${taskId}/comments`
                : `/api/subtasks/${subtaskId}/comments`;
            const res = await api.post(endpoint, { content: newComment });
            setComments(prev => [...prev, res.data]);
            setNewComment('');
        } catch (error) {
            toast.error('Failed to post comment');
        } finally {
            setPosting(false);
        }
    };

    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>Notes ({comments.length})</span>
            </div>

            {loading ? (
                <div className="text-center py-4">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            ) : (
                <>
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {comments.length === 0 ? (
                            <p className="text-center text-muted text-sm py-4">No notes yet</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="p-3 bg-surface rounded-xl border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-muted">{formatTimestamp(comment.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-primary leading-relaxed">{comment.content}</p>
                                </div>
                            ))
                        )}
                        <div ref={commentsEndRef} />
                    </div>

                    <div className="flex items-end gap-2 pt-2 border-t border-border">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    addComment();
                                }
                            }}
                            placeholder="Add a note..."
                            rows={2}
                            className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg text-primary placeholder-muted focus:border-accent focus:outline-none resize-none"
                            disabled={posting}
                        />
                        <button
                            onClick={addComment}
                            disabled={posting || !newComment.trim()}
                            className="p-2 bg-accent text-page rounded-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                            title="Send comment (Enter)"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
