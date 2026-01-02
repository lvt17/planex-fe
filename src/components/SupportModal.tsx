'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/utils/api';
import {
    XMarkIcon,
    BugAntIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface SupportModalProps {
    onClose: () => void;
}

export default function SupportModal({ onClose }: SupportModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.description.trim()) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setLoading(true);
        try {
            await api.post(`/api/feedback/report`, formData);
            toast.success('Báo cáo lỗi đã được gửi. Cảm ơn sự đóng góp của bạn!');
            onClose();
        } catch (error) {
            toast.error('Không thể gửi báo cáo lỗi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-page/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-page/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-syntax-red/10 flex items-center justify-center">
                            <BugAntIcon className="w-5 h-5 text-syntax-red" />
                        </div>
                        <h2 className="font-bold text-primary">Báo cáo lỗi / Góp ý</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-accent/5 rounded-xl p-4 flex gap-3 border border-accent/10">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-accent flex-shrink-0" />
                        <p className="text-xs text-secondary leading-relaxed">
                            Mô tả chi tiết lỗi bạn gặp phải hoặc gợi ý tính năng mới. Chúng tôi sẽ phản hồi sớm nhất có thể!
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-primary">Tiêu đề</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none transition-all"
                            placeholder="Ví dụ: Lỗi khi lưu bảng trắng..."
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-primary">Chi tiết</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none transition-all min-h-[120px] resize-none"
                            placeholder="Bạn gặp lỗi gì, các bước thực hiện như thế nào?..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-accent text-page font-bold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer mt-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 rounded-full animate-spin border-page border-t-transparent mx-auto" />
                        ) : (
                            'Gửi báo cáo'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
