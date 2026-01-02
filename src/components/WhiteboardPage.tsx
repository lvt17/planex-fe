'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import {
    PlusIcon,
    TrashIcon,
    ArrowLeftIcon,
    DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import api from '@/utils/api';

// Dynamic import tldraw to avoid SSR issues
const Tldraw = dynamic(
    () => import('tldraw').then((mod) => mod.Tldraw),
    { ssr: false }
);

// Import tldraw styles
import 'tldraw/tldraw.css';

interface Whiteboard {
    id: number;
    name: string;
    description?: string;
    data?: any;
    created_at: string;
    updated_at?: string;
}

interface WhiteboardPageProps {
    onBack: () => void;
}

export default function WhiteboardPage({ onBack }: WhiteboardPageProps) {
    const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
    const [selectedWhiteboard, setSelectedWhiteboard] = useState<Whiteboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [showList, setShowList] = useState(true);
    const [editorInstance, setEditorInstance] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const nameSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch whiteboards list
    const fetchWhiteboards = useCallback(async () => {
        try {
            const response = await api.get('/api/content/whiteboards');
            if (Array.isArray(response.data)) {
                setWhiteboards(response.data);
            } else if (response.data.whiteboards) {
                setWhiteboards(response.data.whiteboards);
            }
        } catch (error) {
            console.error('Failed to fetch whiteboards:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWhiteboards();
    }, [fetchWhiteboards]);

    // Create new whiteboard
    const createWhiteboard = async () => {
        const defaultName = `Bảng trắng ${whiteboards.length + 1}`;
        try {
            const response = await api.post('/api/content/whiteboards',
                { name: defaultName, data: {} }
            );
            setWhiteboards(prev => [response.data, ...prev]);
            setSelectedWhiteboard(response.data);
            setShowList(false);
            toast.success('Đã tạo whiteboard mới!');
        } catch (error) {
            console.error('Failed to create whiteboard:', error);
            toast.error('Không thể tạo whiteboard');
        }
    };

    // Update whiteboard name (debounced)
    const updateWhiteboardName = (newName: string) => {
        if (!selectedWhiteboard) return;

        // Update local state immediately
        setSelectedWhiteboard({ ...selectedWhiteboard, name: newName });

        // Debounce actual save to backend
        if (nameSaveTimeoutRef.current) {
            clearTimeout(nameSaveTimeoutRef.current);
        }

        nameSaveTimeoutRef.current = setTimeout(async () => {
            try {
                await api.put(`/api/content/whiteboards/${selectedWhiteboard.id}`,
                    { name: newName }
                );
                // Also update in the list
                setWhiteboards(prev => prev.map(wb => wb.id === selectedWhiteboard.id ? { ...wb, name: newName } : wb));
            } catch (error) {
                console.error('Failed to auto-save name:', error);
            }
        }, 1000);
    };

    // Delete whiteboard
    const deleteWhiteboard = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa whiteboard này?')) return;
        try {
            await api.delete(`/api/content/whiteboards/${id}`);
            setWhiteboards(prev => prev.filter(wb => wb.id !== id));
            if (selectedWhiteboard?.id === id) {
                setSelectedWhiteboard(null);
                setShowList(true);
            }
            toast.success('Đã xóa whiteboard');
        } catch (error) {
            console.error('Failed to delete whiteboard:', error);
            toast.error('Không thể xóa whiteboard');
        }
    };

    // Save whiteboard data
    const saveWhiteboard = async () => {
        if (!selectedWhiteboard || !editorInstance) {
            console.warn('Cannot save: selectedWhiteboard or editorInstance is missing');
            return;
        }

        setSaving(true);
        try {
            const snapshot = editorInstance.getSnapshot();

            if (!snapshot) {
                throw new Error('Snapshot is empty');
            }

            const res = await api.put(`/api/content/whiteboards/${selectedWhiteboard.id}`,
                { name: selectedWhiteboard.name, data: snapshot }
            );

            if (res.data.updated_at) {
                setSelectedWhiteboard(prev => prev ? { ...prev, updated_at: res.data.updated_at } : null);
            }
            toast.success('Đã lưu dữ liệu!');
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Không thể lưu whiteboard');
        } finally {
            setSaving(false);
        }
    };

    // Load data
    const loadWhiteboardData = (editor: any) => {
        setEditorInstance(editor);
        if (selectedWhiteboard?.data) {
            try {
                const snapshot = typeof selectedWhiteboard.data === 'string'
                    ? JSON.parse(selectedWhiteboard.data)
                    : selectedWhiteboard.data;

                if (snapshot && typeof snapshot === 'object' && Object.keys(snapshot).length > 0) {
                    editor.loadSnapshot(snapshot);
                }
            } catch (e) {
                console.error('Failed to load snapshot:', e);
            }
        }
    };

    // Export
    const exportAsPng = async () => {
        if (!editorInstance) return;
        try {
            const svg = await editorInstance.getSvg([...editorInstance.getCurrentPageShapeIds()]);
            if (!svg) return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `${selectedWhiteboard?.name}.png`;
                link.href = pngUrl;
                link.click();
                URL.revokeObjectURL(url);
                toast.success('Đã xuất PNG!');
            };
            img.src = url;
        } catch (error) {
            toast.error('Lỗi khi xuất ảnh');
        }
    };

    return (
        <div className="h-full flex flex-col p-4 bg-page">
            {showList ? (
                <>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Bảng trắng</h1>
                            <p className="text-secondary mt-1">Lưu trữ ý tưởng và sơ đồ của bạn</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={createWhiteboard}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-page font-semibold hover:opacity-90 transition-all shadow-lg shadow-accent/20 cursor-pointer"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Tạo bảng mới
                            </button>
                            <button
                                onClick={onBack}
                                className="px-5 py-2.5 rounded-xl border border-border text-primary font-medium hover:bg-hover transition-all cursor-pointer"
                            >
                                Quay lại
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {whiteboards.map(wb => (
                                <div
                                    key={wb.id}
                                    className="group relative bg-surface border border-border rounded-2xl p-5 hover:border-accent hover:shadow-xl transition-all cursor-pointer"
                                    onClick={() => {
                                        setSelectedWhiteboard(wb);
                                        setShowList(false);
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-primary line-clamp-1">{wb.name}</h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteWhiteboard(wb.id);
                                            }}
                                            className="p-1.5 rounded-lg text-secondary opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="aspect-video bg-page rounded-xl border border-border flex flex-col items-center justify-center text-muted group-hover:text-accent transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-accent/5 flex items-center justify-center mb-2">
                                            <PlusIcon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-medium">Nhấn để mở</span>
                                    </div>
                                    <div className="mt-4 flex items-center text-[10px] text-muted uppercase tracking-wider font-semibold">
                                        Cập nhật: {new Date(wb.updated_at || wb.created_at).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4 bg-surface p-4 rounded-2xl border border-border shadow-sm">
                        <div className="flex items-center gap-4 flex-1">
                            <button
                                onClick={() => {
                                    saveWhiteboard();
                                    setShowList(true);
                                    setSelectedWhiteboard(null);
                                }}
                                className="p-2 rounded-xl hover:bg-hover transition-colors cursor-pointer"
                            >
                                <ArrowLeftIcon className="w-6 h-6 text-secondary" />
                            </button>
                            <input
                                type="text"
                                value={selectedWhiteboard?.name || ''}
                                onChange={(e) => updateWhiteboardName(e.target.value)}
                                className="text-xl font-bold text-primary bg-transparent border-none outline-none focus:ring-0 flex-1"
                                placeholder="Nhập tên bảng..."
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            {saving && <span className="text-xs text-accent animate-pulse font-medium">Đang lưu...</span>}
                            <button
                                onClick={saveWhiteboard}
                                className="px-6 py-2 rounded-xl bg-accent text-page font-bold hover:opacity-90 transition-all shadow-md shadow-accent/20 cursor-pointer"
                            >
                                Lưu bảng
                            </button>
                            <button
                                onClick={exportAsPng}
                                className="p-2.5 rounded-xl border border-border text-secondary hover:bg-hover transition-all cursor-pointer"
                                title="Xuất ảnh PNG"
                            >
                                <DocumentArrowDownIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-surface rounded-2xl border border-border overflow-hidden shadow-inner relative" style={{ minHeight: '600px' }}>
                        <Tldraw
                            onMount={loadWhiteboardData}
                            autoFocus
                        />
                    </div>
                </>
            )}
        </div>
    );
}
