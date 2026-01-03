'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import SubtaskItem from './SubtaskItem';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

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
    initialSubtasks?: Subtask[]; // PERFORMANCE: Pass subtasks from parent to avoid API call
}

export default function SubtaskDropdown({ taskId, isOpen, onToggle, onSubtaskChange, initialSubtasks = [] }: SubtaskDropdownProps) {
    const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [adding, setAdding] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Update subtasks when initialSubtasks changes
    useEffect(() => {
        setSubtasks(initialSubtasks);
    }, [initialSubtasks]);

    const toggleSubtask = async (id: number) => {
        const subtask = subtasks.find(s => s.id === id);
        if (!subtask) return;

        // Optimistic UI update - update immediately
        setSubtasks(prev => prev.map(s =>
            s.id === id ? { ...s, is_completed: !s.is_completed } : s
        ));
        onSubtaskChange?.(); // Notify parent to refresh progress immediately

        // Then sync with backend
        try {
            await api.put(`/api/subtasks/${id}`, {
                is_completed: !subtask.is_completed
            });
        } catch (error) {
            // Rollback on error
            setSubtasks(prev => prev.map(s =>
                s.id === id ? { ...s, is_completed: subtask.is_completed } : s
            ));
            onSubtaskChange?.(); // Revert progress
            console.error('Failed to update subtask:', error);
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
        } catch (error) {
            console.error('Failed to add subtask:', error);
        } finally {
            setAdding(false);
        }
    };

    const deleteSubtask = async (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Xóa Subtask',
            message: 'Bạn có chắc chắn muốn xóa subtask này?',
            onConfirm: async () => {
                // Optimistic delete
                const deletedSubtask = subtasks.find(s => s.id === id);
                setSubtasks(prev => prev.filter(s => s.id !== id));
                onSubtaskChange?.();

                try {
                    await api.delete(`/api/subtasks/${id}`);
                } catch (error) {
                    // Rollback on error
                    if (deletedSubtask) {
                        setSubtasks(prev => [...prev, deletedSubtask]);
                        onSubtaskChange?.();
                    }
                    console.error('Failed to delete subtask:', error);
                }
            }
        });
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
                <div className="mt-2 space-y-1">
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
                </div>
            )}

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                isDanger={true}
            />
        </div>
    );
}
