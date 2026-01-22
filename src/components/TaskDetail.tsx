'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, Workspace } from '@/types';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { toast } from 'react-hot-toast';
import api from '@/utils/api';
import {
    XMarkIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    PlusIcon,
    UserIcon,
    DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface TaskDetailProps {
    task: Task;
    onTaskUpdated: (id: number, data: Partial<Task>) => void;
    onTaskDeleted: (id: number) => void;
    onClose: () => void;
}

export default function TaskDetail({ task, onTaskUpdated, onTaskDeleted, onClose }: TaskDetailProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newSubtask, setNewSubtask] = useState('');
    const { workspaces, loading: wsLoading, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces(task.id);
    const [localProgress, setLocalProgress] = useState(task.state || 0);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const [editData, setEditData] = useState({
        name: task.name,
        content: task.content || '',
        deadline: task.deadline?.split('T')[0] || '',
        price: task.price?.toString() || '',
        state: task.state?.toString() || '0',
        client_mail: task.client_mail || '',
        client_num: task.client_num || '',
        show_in_portfolio: task.show_in_portfolio || false,
        portfolio_thumbnail: task.portfolio_thumbnail || '',
    });

    useEffect(() => {
        fetchWorkspaces();
    }, [task.id, fetchWorkspaces]);

    useEffect(() => {
        setEditData({
            name: task.name,
            content: task.content || '',
            deadline: task.deadline?.split('T')[0] || '',
            price: task.price?.toString() || '',
            state: task.state?.toString() || '0',
            client_mail: task.client_mail || '',
            client_num: task.client_num || '',
            show_in_portfolio: task.show_in_portfolio || false,
            portfolio_thumbnail: task.portfolio_thumbnail || '',
        });
        setLocalProgress(task.state || 0);
        setIsEditing(false);
    }, [task]);

    const handleProgressChange = (val: string) => {
        const numVal = parseFloat(val);
        if (isEditing) {
            setEditData({ ...editData, state: val });
        } else {
            setLocalProgress(numVal);
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                onTaskUpdated(task.id, { state: numVal });
            }, 300);
        }
    };

    const handleSave = () => {
        onTaskUpdated(task.id, {
            name: editData.name,
            content: editData.content,
            deadline: editData.deadline || undefined,
            price: editData.price ? Math.round(parseFloat(editData.price)) : 0,
            state: Math.min(100, Math.max(0, parseFloat(editData.state) || 0)),
        });
        setIsEditing(false);
    };

    const handleAddSubtask = async () => {
        if (!newSubtask.trim()) return;
        try {
            await createWorkspace({ mini_task: newSubtask, loading: 0, is_done: false });
            setNewSubtask('');
            toast.success('Đã thêm subtask');
        } catch (error) {
            toast.error('Không thể thêm subtask');
        }
    };

    const handleToggleSubtask = async (ws: Workspace) => {
        try {
            await updateWorkspace(ws.id, { is_done: !ws.is_done, loading: ws.is_done ? 0 : 100 });
        } catch (error) {
            toast.error('Không thể cập nhật subtask');
        }
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return 'Chưa đặt';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const handleExportWord = async () => {
        try {
            const response = await api.get(`/api/documents/task/${task.id}/export/word`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `task_${task.id}_${task.name}.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Đã xuất file Word!');
        } catch (error) {
            toast.error('Không thể xuất file');
        }
    };

    return (
        <div className="h-full rounded-xl bg-surface border border-border overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">Chi tiết Task</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-auto space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                    {task.is_done ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-syntax-green/15 text-syntax-green">
                            <CheckCircleIcon className="w-4 h-4" />
                            Hoàn thành
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-syntax-orange/15 text-syntax-orange">
                            <ClockIcon className="w-4 h-4" />
                            Đang làm ({task.state || 0}%)
                        </span>
                    )}
                </div>

                {/* Title */}
                <div>
                    <label className="text-sm font-medium text-secondary mb-2 block">Tên Task</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-page border border-border text-primary focus:border-accent focus:outline-none"
                        />
                    ) : (
                        <p className="text-lg font-semibold text-primary">{task.name}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="text-sm font-medium text-secondary mb-2 block">Mô tả</label>
                    {isEditing ? (
                        <textarea
                            value={editData.content}
                            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-page border border-border text-primary focus:border-accent focus:outline-none resize-none"
                        />
                    ) : (
                        <p className="text-sm text-secondary">{task.content || 'Không có mô tả'}</p>
                    )}
                </div>

                {/* Progress */}
                <div>
                    <label className="text-sm font-medium text-secondary mb-2 block">Tiến độ (%)</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range" min="0" max="100"
                            value={isEditing ? editData.state : localProgress}
                            onChange={(e) => handleProgressChange(e.target.value)}
                            className="flex-1 h-2 bg-border rounded-full appearance-none cursor-pointer accent-syntax-orange"
                        />
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={isEditing ? editData.state : localProgress}
                                onChange={(e) => handleProgressChange(e.target.value)}
                                className="w-12 px-0 bg-transparent text-sm font-bold text-primary outline-none text-center border-none"
                            />
                            <span className="text-xs text-muted">%</span>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-page border border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <CalendarIcon className="w-4 h-4 text-syntax-cyan" />
                            <span className="text-xs font-medium text-secondary">Deadline</span>
                        </div>
                        {isEditing ? (
                            <input type="date" value={editData.deadline} onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                                className="w-full px-2 py-1 rounded text-sm bg-transparent border border-border text-primary focus:border-accent focus:outline-none" />
                        ) : (
                            <p className="text-sm font-medium text-primary">{formatDate(task.deadline)}</p>
                        )}
                    </div>

                    <div className="p-3 rounded-lg bg-page border border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <CurrencyDollarIcon className="w-4 h-4 text-syntax-green" />
                            <span className="text-xs font-medium text-secondary">Giá</span>
                        </div>
                        {isEditing ? (
                            <input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                                className="w-full px-2 py-1 rounded text-sm bg-transparent border border-border text-primary focus:border-accent focus:outline-none" />
                        ) : (
                            <p className="text-sm font-medium text-primary">{(task.price || 0).toLocaleString('vi-VN')} đ</p>
                        )}
                    </div>
                </div>

                {/* Client Info */}
                {isEditing && (
                    <div className="p-3 rounded-lg bg-page border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <UserIcon className="w-4 h-4 text-syntax-purple" />
                            <span className="text-xs font-medium text-secondary">Thông tin khách hàng</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="email" placeholder="Email" value={editData.client_mail} onChange={(e) => setEditData({ ...editData, client_mail: e.target.value })}
                                className="px-2 py-1 rounded text-sm bg-transparent border border-border text-primary focus:border-accent focus:outline-none" />
                            <input type="text" placeholder="SĐT" value={editData.client_num} onChange={(e) => setEditData({ ...editData, client_num: e.target.value })}
                                className="px-2 py-1 rounded text-sm bg-transparent border border-border text-primary focus:border-accent focus:outline-none" />
                        </div>
                    </div>
                )}



                {!isEditing && (task.client_mail || task.client_num) && (
                    <div className="p-3 rounded-lg bg-page border border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <UserIcon className="w-4 h-4 text-syntax-purple" />
                            <span className="text-xs font-medium text-secondary">Khách hàng</span>
                        </div>
                        {task.client_mail && <p className="text-sm text-primary">{task.client_mail}</p>}
                        {task.client_num && <p className="text-sm text-muted">{task.client_num}</p>}
                    </div>
                )}

                {/* Subtasks */}
                <div className="p-3 rounded-lg bg-page border border-border">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-primary">Subtasks ({workspaces.length})</span>
                    </div>

                    {wsLoading ? (
                        <p className="text-sm text-muted">Đang tải...</p>
                    ) : (
                        <div className="space-y-2">
                            {workspaces.map((ws) => (
                                <div key={ws.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border">
                                    <button onClick={() => handleToggleSubtask(ws)} className="cursor-pointer">
                                        <CheckCircleIcon className={`w-5 h-5 ${ws.is_done ? 'text-syntax-green' : 'text-border'}`} />
                                    </button>
                                    <span className={`flex-1 text-sm ${ws.is_done ? 'line-through text-muted' : 'text-primary'}`}>
                                        {ws.mini_task}
                                    </span>
                                    <button onClick={() => deleteWorkspace(ws.id)} className="p-1 rounded text-secondary hover:text-syntax-red cursor-pointer">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="text"
                                    placeholder="Thêm subtask..."
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                    className="flex-1 px-3 py-2 rounded-lg text-sm bg-surface border border-border text-primary focus:border-accent focus:outline-none"
                                />
                                <button onClick={handleAddSubtask} className="p-2 rounded-lg bg-accent text-page hover:opacity-90 cursor-pointer">
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border flex items-center justify-between">
                <button
                    onClick={() => onTaskDeleted(task.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-syntax-red hover:bg-syntax-red/10 transition-colors cursor-pointer"
                >
                    <TrashIcon className="w-4 h-4" />
                    Xóa
                </button>

                <button
                    onClick={handleExportWord}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-syntax-cyan hover:bg-syntax-cyan/10 transition-colors cursor-pointer"
                >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export
                </button>                {isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-primary hover:bg-hover transition-colors cursor-pointer">
                            Hủy
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-page hover:opacity-90 transition-all cursor-pointer">
                            Lưu
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onTaskUpdated(task.id, { is_done: !task.is_done })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${task.is_done ? 'bg-syntax-orange/15 text-syntax-orange' : 'bg-syntax-green/15 text-syntax-green'}`}
                        >
                            {task.is_done ? 'Mở lại' : 'Hoàn thành'}
                        </button>
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-page hover:opacity-90 transition-all cursor-pointer">
                            Chỉnh sửa
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

