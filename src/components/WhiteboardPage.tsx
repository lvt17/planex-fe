'use client';

import { Square2StackIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface WhiteboardPageProps {
    onBack: () => void;
}

export default function WhiteboardPage({ onBack }: WhiteboardPageProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-syntax-purple/20 flex items-center justify-center mx-auto mb-6">
                    <Square2StackIcon className="w-10 h-10 sm:w-12 sm:h-12 text-syntax-purple" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
                    Bảng trắng
                </h1>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-syntax-yellow/20 text-syntax-yellow font-medium text-sm mb-6">
                    <WrenchScrewdriverIcon className="w-4 h-4" />
                    Đang phát triển
                </div>

                <p className="text-secondary mb-8">
                    Tính năng Whiteboard đang được phát triển và sẽ sớm ra mắt.
                    Bạn sẽ có thể vẽ, ghi chú và brainstorm ý tưởng trực tiếp trên nền tảng.
                </p>

                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl bg-accent text-page font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                    Quay lại Dashboard
                </button>
            </div>
        </div>
    );
}
