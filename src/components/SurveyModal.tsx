'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
    BriefcaseIcon,
    WrenchScrewdriverIcon,
    SparklesIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const JOB_OPTIONS = [
    'Developer / Software Engineer',
    'Product Manager',
    'Designer / UI-UX',
    'Freelancer',
    'Student',
    'Startup Founder',
];

const TOOL_OPTIONS = [
    'Jira / Confluence',
    'Trello / Notion',
    'GitHub / GitLab',
    'Slack / Discord',
    'Excel / Google Sheets',
    'Figma / Adobe XD',
];

const DESIRE_OPTIONS = [
    'Tăng năng suất làm việc tối đa',
    'Giao diện hiện đại, tối giản và dễ dùng',
    'Quản lý tiến độ dự án tập trung một nơi',
    'Thống kê thu nhập và dòng tiền chi tiết',
    'Tích hợp công cụ Whiteboard để brainstorming',
    'Dùng bảng tính (Spreadsheet) ngay trên nền tảng'
];

interface SurveyModalProps {
    onClose: () => void;
}

export default function SurveyModal({ onClose }: SurveyModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        job: '',
        otherJob: '',
        tools: [] as string[],
        otherTool: '',
        desires: [] as string[],
        customDesire: ''
    });

    const getAuthHeader = () => {
        const token = sessionStorage.getItem('access_token');
        return { Authorization: `Bearer ${token}` };
    };

    const toggleTool = (tool: string) => {
        if (formData.tools.includes(tool)) {
            setFormData({ ...formData, tools: formData.tools.filter(t => t !== tool) });
        } else {
            setFormData({ ...formData, tools: [...formData.tools, tool] });
        }
    };

    const toggleDesire = (desire: string) => {
        if (formData.desires.includes(desire)) {
            setFormData({ ...formData, desires: formData.desires.filter(d => d !== desire) });
        } else {
            setFormData({ ...formData, desires: [...formData.desires, desire] });
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const finalJob = formData.job === 'Other' ? formData.otherJob : formData.job;
            const finalTools = [...formData.tools];
            if (formData.otherTool) finalTools.push(formData.otherTool);

            const finalDesires = [...formData.desires];
            if (formData.customDesire) finalDesires.push(formData.customDesire);

            await axios.post(`${API_URL}/api/feedback/survey`, {
                job: finalJob,
                tools: finalTools,
                desires: finalDesires.join('; ')
            }, { headers: getAuthHeader() });

            toast.success('Cảm ơn bạn đã hoàn thành khảo sát!');
            onClose();
        } catch (error) {
            toast.error('Không thể lưu khảo sát');
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        if (step === 1) return formData.job !== '' && (formData.job !== 'Other' || formData.otherJob.trim() !== '');
        if (step === 2) return formData.tools.length > 0 || formData.otherTool.trim() !== '';
        if (step === 3) return formData.desires.length > 0 || formData.customDesire.trim().length > 3;
        return true;
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-page/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-elevated">
                    <div
                        className="h-full bg-accent transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    {/* Step 1: Job */}
                    {step === 1 && (
                        <div className="animate-slide-in">
                            <div className="w-12 h-12 rounded-2xl bg-syntax-cyan/20 flex items-center justify-center mb-6">
                                <BriefcaseIcon className="w-6 h-6 text-syntax-cyan" />
                            </div>
                            <h2 className="text-2xl font-bold text-primary mb-2">Công việc của bạn là gì?</h2>
                            <p className="text-secondary mb-8">Hãy cho chúng tôi biết để Planex có thể điều chỉnh trải nghiệm phù hợp nhất.</p>

                            <div className="grid grid-cols-1 gap-3">
                                {JOB_OPTIONS.map((job) => (
                                    <button
                                        key={job}
                                        onClick={() => setFormData({ ...formData, job })}
                                        className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${formData.job === job
                                                ? 'bg-accent/10 border-accent text-accent'
                                                : 'bg-page border-border text-primary hover:border-accent/50'
                                            }`}
                                    >
                                        <span className="font-medium">{job}</span>
                                        {formData.job === job && <CheckIcon className="w-5 h-5" />}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setFormData({ ...formData, job: 'Other' })}
                                    className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${formData.job === 'Other'
                                            ? 'bg-accent/10 border-accent text-accent'
                                            : 'bg-page border-border text-primary hover:border-accent/50'
                                        }`}
                                >
                                    <span className="font-medium">Khác...</span>
                                    {formData.job === 'Other' && <CheckIcon className="w-5 h-5" />}
                                </button>

                                {formData.job === 'Other' && (
                                    <input
                                        type="text"
                                        value={formData.otherJob}
                                        onChange={(e) => setFormData({ ...formData, otherJob: e.target.value })}
                                        className="w-full px-6 py-3 rounded-xl bg-page border border-accent text-primary focus:outline-none animate-fade-in"
                                        placeholder="Nhập công việc của bạn..."
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Tools */}
                    {step === 2 && (
                        <div className="animate-slide-in">
                            <div className="w-12 h-12 rounded-2xl bg-syntax-purple/20 flex items-center justify-center mb-6">
                                <WrenchScrewdriverIcon className="w-6 h-6 text-syntax-purple" />
                            </div>
                            <h2 className="text-2xl font-bold text-primary mb-2">Công cụ bạn hay dùng?</h2>
                            <p className="text-secondary mb-8">Chọn các công cụ bạn sử dụng hàng ngày để quản lý công việc.</p>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {TOOL_OPTIONS.map((tool) => (
                                    <button
                                        key={tool}
                                        onClick={() => toggleTool(tool)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${formData.tools.includes(tool)
                                                ? 'bg-accent/10 border-accent text-accent'
                                                : 'bg-page border-border text-primary hover:border-accent/50'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{tool}</span>
                                        {formData.tools.includes(tool) && <CheckIcon className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>

                            <input
                                type="text"
                                value={formData.otherTool}
                                onChange={(e) => setFormData({ ...formData, otherTool: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none transition-all"
                                placeholder="Thêm công cụ khác..."
                            />
                        </div>
                    )}

                    {/* Step 3: Desires */}
                    {step === 3 && (
                        <div className="animate-slide-in">
                            <div className="w-12 h-12 rounded-2xl bg-syntax-green/20 flex items-center justify-center mb-6">
                                <SparklesIcon className="w-6 h-6 text-syntax-green" />
                            </div>
                            <h2 className="text-2xl font-bold text-primary mb-2">Bạn mong đợi gì ở Planex?</h2>
                            <p className="text-secondary mb-8">Chọn các mục tiêu hoặc mong muốn của bạn khi sử dụng ứng dụng.</p>

                            <div className="grid grid-cols-1 gap-2 mb-6 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                                {DESIRE_OPTIONS.map((desire) => (
                                    <button
                                        key={desire}
                                        onClick={() => toggleDesire(desire)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${formData.desires.includes(desire)
                                                ? 'bg-accent/10 border-accent text-accent'
                                                : 'bg-page border-border text-primary hover:border-accent/50'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{desire}</span>
                                        {formData.desires.includes(desire) && <CheckIcon className="w-4 h-4 flex-shrink-0" />}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={formData.customDesire}
                                onChange={(e) => setFormData({ ...formData, customDesire: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none transition-all min-h-[100px] text-sm"
                                placeholder="Ý kiến khác của bạn (tùy chọn)..."
                            />
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
                        <button
                            onClick={() => step > 1 && setStep(step - 1)}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-4 py-2 font-medium transition-all ${step === 1 ? 'opacity-0 cursor-default' : 'text-secondary hover:text-primary cursor-pointer'
                                }`}
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                            Quay lại
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={() => isStepValid() && setStep(step + 1)}
                                disabled={!isStepValid()}
                                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-accent text-page font-bold hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer shadow-lg shadow-accent/20"
                            >
                                Tiếp tục
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!isStepValid() || loading}
                                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-accent text-page font-bold hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer shadow-lg shadow-accent/20"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 rounded-full animate-spin border-page border-t-transparent" />
                                ) : (
                                    <>
                                        Hoàn tất
                                        <CheckIcon className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
