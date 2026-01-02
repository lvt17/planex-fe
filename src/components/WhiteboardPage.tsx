'use client';

import { Square2StackIcon } from '@heroicons/react/24/outline';

interface WhiteboardPageProps {
    onBack: () => void;
}

export default function WhiteboardPage({ onBack }: WhiteboardPageProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="w-24 h-24 bg-syntax-purple/10 rounded-3xl flex items-center justify-center mb-8 animate-bounce">
                <Square2StackIcon className="w-12 h-12 text-syntax-purple" />
            </div>

            <h1 className="text-4xl font-black text-primary mb-4 tracking-tight uppercase italic">
                Bảng trắng <span className="text-syntax-purple underline decoration-wavy">Planex</span>
            </h1>

            <div className="max-w-md bg-surface border border-border p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <p className="text-lg text-primary font-medium mb-4">
                    Tính năng đang được đội ngũ Planex phát triển & tối ưu hóa.
                </p>

                <p className="text-secondary text-sm leading-relaxed mb-8">
                    Bạn sẽ có thể vẽ, ghi chú và brainstorm ý tưởng trực tiếp trên nền tảng. Hãy quay lại sau nhé!
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onBack}
                        className="w-full py-3.5 bg-syntax-purple text-page font-bold rounded-2xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-syntax-purple/20"
                    >
                        Quay về Trang chủ
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted">
                        <div className="w-1.5 h-1.5 rounded-full bg-syntax-green animate-pulse"></div>
                        Vẫn đang được phát triển tích cực
                    </div>
                </div>
            </div>

            <p className="mt-12 text-muted text-xs font-medium tracking-widest uppercase">
                Planex Engine v2.0-Alpha
            </p>
        </div>
    );
}
