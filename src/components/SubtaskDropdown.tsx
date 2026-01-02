'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import SubtaskItem from './SubtaskItem';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

interface Subtask {
    id: number;
    task_id: number;
    title: string;
    is_completed: boolean;
    created_at: string;
}

interface SubtaskDropdownProps {
    taskId: number;
    isOpen: boolean;
    onToggle: () => void;
    onSubtaskChange?: () => void; // Callback to refresh parent task
}

export default function SubtaskDropdown({ taskId, isOpen, onToggle, onSubtaskChange }: SubtaskDropdownProps) {
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSubtasks();
        }
    }, [isOpen, taskId]);

    const fetchSubtasks = async () => {
        if (!taskId) {
            console.error('TaskId is missing:', taskId);
            return;
        }

        setLoading(true);
        try {
            console.log('Fetching subtasks for task:', taskId);
            const res = await api.get(`/api/tasks/${taskId}/subtasks`);
            setSubtasks(res.data);
        } catch (error: any) {
            console.error('Subtask fetch error:', error.response || error);
            toast.error('Failed to load subtasks');
        } finally {
            setLoading(false);
        }
    };

    const toggleSubtask = async (id: number) => {
        const subtask = subtasks.find(s => s.id === id);
        if (!subtask) return;

        try {
            await api.put(`/api/subtasks/${id}`, {
                is_completed: !subtask.is_completed
            });
            setSubtasks(prev => prev.map(s =>
                s.id === id ? { ...s, is_completed: !s.is_completed } : s
            ));
            onSubtaskChange?.(); // Notify parent to refresh progress
        } catch (error) {
            toast.error('Failed to update subtask');
        }
    };

    const addSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;

        setAdding(true);
        try {
            const res = await api.post(`/api/tasks/${taskId}/subtasks`, {
                title: newSubtaskTitle
            });
            setSubtasks(prev => [...prev, res.data]);
            setNewSubtaskTitle('');
            onSubtaskChange?.();
            toast.success('Subtask added');
        } catch (error) {
            toast.error('Failed to add subtask');
        } finally {
            setAdding(false);
        }
    };

    const deleteSubtask = async (id: number) => {
        if (!confirm('Delete this subtask?')) return;

        try {
            await api.delete(`/api/subtasks/${id}`);
            setSubtasks(prev => prev.filter(s => s.id !== id));
            onSubtaskChange?.();
            toast.success('Subtask deleted');
        } catch (error) {
            toast.error('Failed to delete subtask');
        }
    };

    const completedCount = subtasks.filter(s => s.is_completed).length;

    return (
        <div className="mt-2 border-t border-border pt-2">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors w-full cursor-pointer"
            >
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                <span>
                    Subtasks {subtasks.length > 0 && `(${completedCount}/${subtasks.length} completed)`}
                </span>
            </button>

            {isOpen && (
                <div className="mt-2 space-y-1 animate-fade-in">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : (
                        <>
                            {subtasks.map(subtask => (
                                <SubtaskItem
                                    key={subtask.id}
                                    subtask={subtask}
                                    onToggle={toggleSubtask}
                                    onDelete={deleteSubtask}
                                />
                            ))}

                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                                <input
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                                    placeholder="Add new subtask..."
                                    className="flex-1 px-3 py-1.5 text-sm bg-surface border border-border rounded-lg text-primary placeholder-muted focus:border-accent focus:outline-none"
                                    disabled={adding}
                                />
                                <button
                                    onClick={addSubtask}
                                    disabled={adding || !newSubtaskTitle.trim()}
                                    className="p-1.5 bg-accent text-page rounded-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
