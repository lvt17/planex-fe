'use client';

import { useState } from 'react';
import { Task, Project } from '@/types';
import { toast } from 'react-hot-toast';
import { XMarkIcon, CalendarIcon, CurrencyDollarIcon, UserIcon, FolderIcon } from '@heroicons/react/24/outline';

interface CreateTaskModalProps {
    onClose: () => void;
    onTaskCreated: (data: Partial<Task>) => void;
    projects?: Project[];
}

export default function CreateTaskModal({ onClose, onTaskCreated, projects = [] }: CreateTaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        content: '',
        deadline: '',
        price: '',
        client_mail: '',
        client_num: '',
        project_id: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên task');
            return;
        }

        setLoading(true);
        try {
            await onTaskCreated({
                name: formData.name,
                content: formData.content,
                deadline: formData.deadline || undefined,
                price: formData.price ? Math.round(parseFloat(formData.price)) : 0,
                client_mail: formData.client_mail || undefined,
                client_num: formData.client_num || undefined,
                project_id: formData.project_id ? parseInt(formData.project_id) : undefined,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(1, 4, 9, 0.8)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-xl overflow-hidden bg-surface border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-primary">Tạo Task mới</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-primary">Tên Task *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors"
                                    placeholder="Nhập tên task..."
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-primary">Mô tả</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors resize-none"
                                    placeholder="Mô tả chi tiết..."
                                    rows={3}
                                />
                            </div>

                            {/* Project Selector */}
                            {projects.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                                        <FolderIcon className="w-4 h-4 text-syntax-orange" />
                                        Project
                                    </label>
                                    <select
                                        value={formData.project_id}
                                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors mt-2 cursor-pointer"
                                    >
                                        <option value="">Không có project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id.toString()}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                                        <CalendarIcon className="w-4 h-4 text-syntax-cyan" />
                                        Deadline
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors mt-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                                        <CurrencyDollarIcon className="w-4 h-4 text-syntax-green" />
                                        Giá (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors mt-2"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-border">
                                <p className="text-sm font-medium mb-3 flex items-center gap-2 text-primary">
                                    <UserIcon className="w-4 h-4 text-syntax-purple" />
                                    Thông tin khách hàng
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5 text-secondary">Email</label>
                                        <input
                                            type="email"
                                            value={formData.client_mail}
                                            onChange={(e) => setFormData({ ...formData, client_mail: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-sm bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors"
                                            placeholder="email@..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5 text-secondary">Số điện thoại</label>
                                        <input
                                            type="text"
                                            value={formData.client_num}
                                            onChange={(e) => setFormData({ ...formData, client_num: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-sm bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors"
                                            placeholder="0123..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-medium text-sm bg-elevated border border-border text-primary hover:bg-hover transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-lg font-medium text-sm bg-accent text-page hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 rounded-full animate-spin border-page border-t-transparent"></div>
                            ) : (
                                'Tạo Task'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

