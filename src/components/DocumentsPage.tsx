'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/utils/api';
import dynamic from 'next/dynamic';
import {
    DocumentTextIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    ArrowDownTrayIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

// Dynamic import for TinyMCE to avoid SSR issues
const Editor = dynamic<any>(
    () => import('@tinymce/tinymce-react').then((mod) => mod.Editor as any),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-96 bg-white rounded-lg">
                <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
            </div>
        )
    }
) as any;

interface Document {
    id: number;
    title: string;
    content: string;
    updated_at: string;
}

export default function DocumentsPage({ onBack }: { onBack: () => void }) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [showList, setShowList] = useState(true);
    const [editorContent, setEditorContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [tinymceKey, setTinymceKey] = useState('no-api-key');
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
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch TinyMCE config
    const fetchTinyConfig = useCallback(async () => {
        try {
            const response = await api.get('/api/content/config/tinymce');
            if (response.data.api_key) {
                setTinymceKey(response.data.api_key);
            }
        } catch (error) {
            console.error('Failed to fetch TinyMCE config:', error);
        }
    }, []);

    // Fetch documents
    const fetchDocs = useCallback(async () => {
        try {
            await fetchTinyConfig();
            const response = await api.get('/api/content/documents');
            setDocuments(response.data);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchTinyConfig]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    // Create new document
    const createDoc = async () => {
        try {
            const response = await api.post('/api/content/documents',
                { title: 'Tài liệu mới', content: '' }
            );
            setDocuments([response.data, ...documents]);
            setSelectedDoc(response.data);
            setEditorContent('');
            setShowList(false);
            toast.success('Đã tạo tài liệu mới!');
        } catch (error) {
            toast.error('Không thể tạo tài liệu');
        }
    };

    // Save document (auto-save with debounce)
    const saveDoc = async (content: string) => {
        if (!selectedDoc) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            setSaving(true);
            try {
                await api.put(`/api/content/documents/${selectedDoc.id}`,
                    { title: selectedDoc.title, content }
                );
            } catch (error) {
                console.error('Failed to save:', error);
            } finally {
                setSaving(false);
            }
        }, 1000);
    };

    // Delete document
    const deleteDoc = async (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Xóa tài liệu',
            message: 'Bạn có chắc chắn muốn xóa tài liệu này?',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/content/documents/${id}`);
                    setDocuments(documents.filter(d => d.id !== id));
                    if (selectedDoc?.id === id) {
                        setSelectedDoc(null);
                        setShowList(true);
                    }
                    toast.success('Đã xóa tài liệu');
                } catch (error) {
                    toast.error('Không thể xóa tài liệu');
                }
            }
        });
    };

    // Update title
    const updateTitle = (newTitle: string) => {
        if (!selectedDoc) return;
        setSelectedDoc({ ...selectedDoc, title: newTitle });
    };

    // Export as DOCX (using html-docx-js alternative approach)
    const exportAsDocx = () => {
        if (!selectedDoc) return;

        // Create HTML document
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${selectedDoc.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; }
                    h1 { font-size: 24pt; }
                    h2 { font-size: 18pt; }
                    h3 { font-size: 14pt; }
                    table { border-collapse: collapse; width: 100%; }
                    td, th { border: 1px solid #ddd; padding: 8px; }
                </style>
            </head>
            <body>
                ${editorContent}
            </body>
            </html>
        `;

        // Download as HTML (Word can open)
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedDoc.title}.doc`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Đã xuất tài liệu!');
    };

    // Handle editor content change
    const handleEditorChange = (content: string) => {
        setEditorContent(content);
        saveDoc(content);
    };

    // TinyMCE configuration
    const editorConfig = {
        height: 700,
        menubar: true,
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'pagebreak',
            'emoticons', 'codesample'
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | ' +
            'bold italic underline strikethrough | forecolor backcolor | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | ' +
            'table link image media | pagebreak | ' +
            'removeformat | help',
        content_style: `
            body { 
                font-family: Arial, Helvetica, sans-serif; 
                font-size: 14px;
                max-width: 800px;
                margin: 40px auto;
                padding: 60px 80px;
                background: white;
                min-height: 1000px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            @media print {
                body { margin: 0; padding: 20px; }
            }
        `,
        body_class: 'document-body',
        content_css: false,
        skin: 'oxide',
        branding: false,
        promotion: false,
        setup: (editor: any) => {
            editor.on('init', () => {
                // Hide promotion button specifically in the UI (outside iframe)
                const style = document.createElement('style');
                style.innerHTML = '.tox-promotion, .tox-statusbar__branding { display: none !important; }';
                document.head.appendChild(style);
            });
        },
        resize: false,
        statusbar: true,
        pagebreak_separator: '<div style="page-break-before: always; clear: both;"></div>',
        font_family_formats: 'Arial=arial,helvetica,sans-serif; Times New Roman=times new roman,times,serif; Courier New=courier new,courier,monospace; Georgia=georgia,palatino,serif; Tahoma=tahoma,arial,helvetica,sans-serif; Verdana=verdana,geneva,sans-serif;',
        font_size_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 24pt 36pt 48pt',
        block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Blockquote=blockquote; Code=pre',
    };

    return (
        <div className="h-full flex flex-col">
            {showList ? (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Tài liệu</h1>
                            <p className="text-secondary text-sm mt-1">Soạn thảo văn bản tiện lợi ngay trong Planex</p>
                        </div>
                        <button
                            onClick={onBack}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-primary hover:bg-hover transition-colors cursor-pointer"
                        >
                            Quay lại
                        </button>
                    </div>

                    {/* Create new button */}
                    <div className="mb-6">
                        <button
                            onClick={createDoc}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-page font-medium hover:opacity-90 transition-all cursor-pointer"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Tạo tài liệu mới
                        </button>
                    </div>

                    {/* Documents list */}
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                                <DocumentTextIcon className="w-10 h-10 text-accent" />
                            </div>
                            <h3 className="text-lg font-bold text-primary mb-2">Chưa có tài liệu nào</h3>
                            <p className="text-secondary mb-4">Tạo tài liệu đầu tiên để bắt đầu</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {documents.map(doc => (
                                <div
                                    key={doc.id}
                                    className="bg-surface border border-border rounded-xl p-4 hover:border-accent transition-all cursor-pointer group"
                                    onClick={() => {
                                        setSelectedDoc(doc);
                                        setEditorContent(doc.content || '');
                                        setShowList(false);
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                                <DocumentTextIcon className="w-5 h-5 text-accent" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary">{doc.title}</h3>
                                                <p className="text-xs text-muted">
                                                    {new Date(doc.updated_at).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteDoc(doc.id);
                                            }}
                                            className="p-1.5 rounded text-secondary opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-3 text-sm text-muted line-clamp-3"
                                        dangerouslySetInnerHTML={{ __html: doc.content?.substring(0, 200) || 'Tài liệu trống...' }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Editor Header */}
                    <div className="flex items-center justify-between mb-4 bg-surface p-3 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setShowList(true);
                                    setSelectedDoc(null);
                                }}
                                className="p-2 rounded-lg hover:bg-hover cursor-pointer"
                            >
                                <ArrowLeftIcon className="w-5 h-5 text-secondary" />
                            </button>
                            <input
                                type="text"
                                value={selectedDoc?.title || ''}
                                onChange={(e) => updateTitle(e.target.value)}
                                className="text-lg font-bold text-primary bg-transparent border-none outline-none focus:ring-0"
                                placeholder="Tiêu đề tài liệu"
                            />
                            {saving && (
                                <span className="text-xs text-muted">Đang lưu...</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportAsDocx}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-primary hover:bg-hover cursor-pointer"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Xuất Word
                            </button>
                        </div>
                    </div>

                    {/* TinyMCE Editor - White background like real document */}
                    <div className="flex-1 bg-gray-200 p-6 rounded-xl overflow-auto" style={{ minHeight: '600px' }}>
                        {tinymceKey !== 'no-api-key' ? (
                            <>
                                {/* @ts-ignore - TinyMCE type compatibility with dynamic import */}
                                <Editor
                                    apiKey={tinymceKey}
                                    value={editorContent}
                                    onEditorChange={handleEditorChange}
                                    init={editorConfig}
                                />
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full bg-white rounded-lg">
                                <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
                            </div>
                        )}
                    </div>
                </>
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
