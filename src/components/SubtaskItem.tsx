'use client';

import { TrashIcon } from '@heroicons/react/24/outline';

interface Subtask {
    id: number;
    task_id: number;
    title: string;
    is_completed: boolean;
    created_at: string;
}

interface SubtaskItemProps {
    subtask: Subtask;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}

export default function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
    return (
        <div className="flex items-center gap-2 p-2 hover:bg-hover rounded-lg group transition-colors">
            <input
                type="checkbox"
                checked={subtask.is_completed}
                onChange={() => onToggle(subtask.id)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
            />
            <span className={`flex-1 text-sm ${subtask.is_completed ? 'line-through text-muted' : 'text-primary'}`}>
                {subtask.title}
            </span>
            <button
                onClick={() => onDelete(subtask.id)}
                className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-syntax-red/10 transition-all cursor-pointer"
                title="Delete subtask"
            >
                <TrashIcon className="w-4 h-4 text-syntax-red" />
            </button>
        </div>
    );
}
