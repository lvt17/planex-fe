'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { BriefcaseIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface Task {
    id: number;
    name: string;
    content: string;
    portfolio_thumbnail?: string;
}

export default function PortfolioPage({ onBack }: { onBack: () => void }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const response = await api.get('/api/content/portfolio');
                setTasks(response.data);
            } catch (error) {
                console.error('Failed to fetch portfolio', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPortfolio();
    }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-primary">Portfolio</h1>
                <button
                    onClick={onBack}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-primary hover:bg-hover transition-colors cursor-pointer"
                >
                    Quay lại
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-xl bg-surface border border-border">
                    <BriefcaseIcon className="w-16 h-16 text-muted mb-4" />
                    <h2 className="text-lg font-semibold text-primary mb-2">Portfolio chưa có mục nào</h2>
                    <p className="text-secondary mb-4">Chọn "Hiển thị trong Portfolio" ở chi tiết task để bắt đầu</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map((task) => (
                        <div key={task.id} className="group relative overflow-hidden rounded-xl bg-surface border border-border hover:border-accent transition-all">
                            <div className="aspect-video bg-page flex items-center justify-center overflow-hidden">
                                {task.portfolio_thumbnail ? (
                                    <img src={task.portfolio_thumbnail} alt={task.name} className="w-full h-full object-cover" />
                                ) : (
                                    <BriefcaseIcon className="w-12 h-12 text-muted" />
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-primary mb-1">{task.name}</h3>
                                <p className="text-sm text-secondary line-clamp-2">{task.content || 'Không có mô tả'}</p>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 rounded-lg bg-page/80 backdrop-blur border border-border text-accent hover:bg-accent hover:text-page transition-all">
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
