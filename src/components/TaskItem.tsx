'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types';
import {
    CheckCircleIcon as CheckOutline,
    CalendarIcon,
    EllipsisHorizontalIcon,
    TrashIcon,
    PencilIcon,
    BanknotesIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';

interface TaskItemProps {
    task: Task;
    isSelected: boolean;
    onSelect: () => void;
    onUpdated: (data: Partial<Task>) => void;
    onDeleted: () => void;
    onReceived?: () => void;
}

export default function TaskItem({ task, isSelected, onSelect, onUpdated, onDeleted, onReceived }: TaskItemProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [localState, setLocalState] = useState(task.state || 0);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Sync local state when task prop changes (but not during active dragging)
    useEffect(() => {
        setLocalState(task.state || 0);
    }, [task.state]);

    const handleStateChange = (newVal: number) => {
        setLocalState(newVal);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            onUpdated({ state: newVal });
        }, 300); // 300ms debounce
    };

    const getStatusBadge = () => {
        if (task.is_done) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-syntax-green/15 text-syntax-green">
                    Xong
                </span>
            );
        }

        return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(localState)}
                    onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                        if (!isNaN(val)) {
                            handleStateChange(Math.min(100, Math.max(0, val)));
                        }
                    }}
                    className="w-10 px-0 rounded text-xs font-bold bg-transparent text-syntax-orange outline-none text-center appearance-none border-none"
                />
                <span className="text-[10px] text-syntax-orange font-bold -ml-1">%</span>
            </div>
        );
    };

    const formatDeadline = (dateStr: string | null | undefined) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days < 0) return { text: 'Quá hạn', urgent: true };
        if (days === 0) return { text: 'Hôm nay', urgent: true };
        if (days === 1) return { text: 'Ngày mai', urgent: false };
        return {
            text: date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }),
            urgent: false
        };
    };

    const deadline = formatDeadline(task.deadline);

    return (
        <div
            className={`group p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-elevated border-accent' : 'bg-surface border-border hover:border-accent/50'} border ${task.is_done ? 'opacity-70' : ''}`}
            onClick={onSelect}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                    className="mt-0.5 flex-shrink-0 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdated({ is_done: !task.is_done });
                    }}
                >
                    {task.is_done ? (
                        <CheckSolid className="w-5 h-5 text-syntax-green" />
                    ) : (
                        <CheckOutline className="w-5 h-5 text-border hover:text-accent transition-colors" />
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm ${task.is_done ? 'line-through text-muted' : 'text-primary'}`}>
                        {task.name}
                    </h4>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {getStatusBadge()}

                        {deadline && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${deadline.urgent ? 'bg-syntax-red/15 text-syntax-red' : 'bg-secondary/15 text-secondary'}`}>
                                <CalendarIcon className="w-3 h-3" />
                                {deadline.text}
                            </span>
                        )}

                        {task.price && task.price > 0 && !task.team_name && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-syntax-green/15 text-syntax-green">
                                {task.price.toLocaleString('vi-VN')} đ
                            </span>
                        )}

                        {task.team_name && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-accent/15 text-accent border border-accent/20">
                                <UsersIcon className="w-3 h-3" />
                                Team: {task.team_name}
                            </span>
                        )}
                    </div>

                    {/* Progress Slider */}
                    {!task.is_done && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={localState}
                                onChange={(e) => handleStateChange(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-syntax-orange"
                            />
                        </div>
                    )}

                    {/* Received Button - shows at 100% and NOT a team task */}
                    {localState === 100 && task.price && task.price > 0 && !task.team_name && onReceived && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onReceived();
                            }}
                            className="mt-3 w-full py-2 rounded-lg bg-syntax-green text-white font-bold text-sm hover:bg-syntax-green/90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-syntax-green/20"
                        >
                            <BanknotesIcon className="w-4 h-4" />
                            Nhận tiền ({task.price.toLocaleString('vi-VN')}đ)
                        </button>
                    )}
                </div>

                {/* Actions */}
                <div className="relative flex-shrink-0">
                    <button
                        className="p-1 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-secondary hover:text-primary transition-all cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                    >
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 rounded-lg shadow-lg py-1 min-w-[120px] z-20 bg-elevated border border-border">
                                <button
                                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-primary hover:bg-hover transition-colors cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); onSelect(); setShowMenu(false); }}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    Sửa
                                </button>
                                <button
                                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-syntax-red hover:bg-hover transition-colors cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); onDeleted(); setShowMenu(false); }}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Xóa
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
