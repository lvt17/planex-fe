'use client';

import { Task } from '@/types';
import TaskItem from './TaskItem';

interface TaskListProps {
    tasks: Task[];
    onSelectTask: (task: Task) => void;
    selectedTaskId?: number;
    onTaskUpdated: (id: number, data: Partial<Task>) => void;
    onTaskDeleted: (id: number) => void;
    onTaskReceived?: (task: Task) => void;
}

export default function TaskList({ tasks, onSelectTask, selectedTaskId, onTaskUpdated, onTaskDeleted, onTaskReceived }: TaskListProps) {
    // Group tasks by status
    const todoTasks = tasks.filter(t => !t.is_done && (t.state || 0) === 0);
    const inProgressTasks = tasks.filter(t => !t.is_done && (t.state || 0) > 0);
    const doneTasks = tasks.filter(t => t.is_done);

    const TaskGroup = ({ title, taskList, color, count }: { title: string; taskList: Task[]; color: string; count: number }) => (
        <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ background: color }}></div>
                <h3 className="text-sm font-semibold text-primary">{title}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-elevated text-secondary">
                    {count}
                </span>
            </div>
            <div className="space-y-2">
                {taskList.map((task) => (
                    <div key={task.id}>
                        <TaskItem
                            task={task}
                            isSelected={selectedTaskId === task.id}
                            onSelect={() => onSelectTask(task)}
                            onUpdated={(data) => onTaskUpdated(task.id, data)}
                            onDeleted={() => onTaskDeleted(task.id)}
                            onReceived={onTaskReceived ? () => onTaskReceived(task) : undefined}
                        />
                    </div>
                ))}
                {taskList.length === 0 && (
                    <p className="text-sm py-3 px-3 rounded-lg bg-surface border border-border text-muted">
                        Không có task
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <TaskGroup title="Chưa bắt đầu" taskList={todoTasks} color="#D2A8FF" count={todoTasks.length} />
            <TaskGroup title="Đang làm" taskList={inProgressTasks} color="#FFA657" count={inProgressTasks.length} />
            <TaskGroup title="Hoàn thành" taskList={doneTasks} color="#7EE787" count={doneTasks.length} />
        </div>
    );
}


