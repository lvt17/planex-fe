'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import PlanexLogo from '@/components/PlanexLogo';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [signupToken, setSignupToken] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !email || !password) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/api/auth/register', {
                username,
                email,
                password,
                full_name: username
            });

            setSignupToken(response.data.signup_token);
            setStep('verify');
            toast.success('Đã gửi mã xác thực đến email của bạn!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Lỗi đăng ký');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error('Mã xác thực phải có 6 số');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/api/auth/verify-otp', {
                email,
                otp,
                signup_token: signupToken
            });

            // Note: Centralized api client will automatically use the token once it's in sessionStorage.
            // However, the registration flow here seems to expect manual token storage.
            // Standardizing to sessionStorage for consistency with api.ts
            sessionStorage.setItem('access_token', response.data.access_token);

            toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Mã xác thực không đúng');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-page">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-syntax-purple/20 to-accent/20 items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <PlanexLogo size="lg" showText className="justify-center mb-8" />
                    <h1 className="text-3xl font-bold text-primary mb-4">
                        Bắt đầu miễn phí
                    </h1>
                    <p className="text-secondary text-lg">
                        Tạo tài khoản và trải nghiệm công cụ quản lý công việc hiện đại nhất.
                    </p>
                </div>
            </div>

            {/* Right side - Register form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex justify-center mb-8">
                        <PlanexLogo size="md" showText />
                    </div>

                    <div className="bg-surface border border-border rounded-2xl p-8 shadow-lg">
                        {step === 'register' ? (
                            <>
                                <h2 className="text-2xl font-bold text-primary text-center mb-2">
                                    Đăng ký
                                </h2>
                                <p className="text-secondary text-center mb-6">
                                    Tạo tài khoản mới
                                </p>

                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1.5">
                                            Tên người dùng
                                        </label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors"
                                            placeholder="username"
                                            autoComplete="username"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1.5">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1.5">
                                            Mật khẩu
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1.5">
                                            Xác nhận mật khẩu
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3 rounded-xl bg-accent text-page font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {submitting ? (
                                            <div className="w-5 h-5 border-2 rounded-full animate-spin border-page border-t-transparent mx-auto" />
                                        ) : (
                                            'Đăng ký'
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-primary text-center mb-2">
                                    Xác thực Email
                                </h2>
                                <p className="text-secondary text-center mb-6">
                                    Nhập mã 6 số đã gửi đến {email}
                                </p>

                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full px-4 py-4 rounded-xl bg-page border border-border text-primary text-center text-2xl font-mono tracking-widest focus:border-accent focus:outline-none transition-colors"
                                            placeholder="000000"
                                            maxLength={6}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || otp.length !== 6}
                                        className="w-full py-3 rounded-xl bg-accent text-page font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {submitting ? (
                                            <div className="w-5 h-5 border-2 rounded-full animate-spin border-page border-t-transparent mx-auto" />
                                        ) : (
                                            'Xác nhận'
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStep('register')}
                                        className="w-full py-2 text-secondary hover:text-primary transition-colors cursor-pointer"
                                    >
                                        ← Quay lại
                                    </button>
                                </form>
                            </>
                        )}

                        {step === 'register' && (
                            <p className="text-center text-secondary mt-6">
                                Đã có tài khoản?{' '}
                                <Link href="/login" className="text-accent font-semibold hover:underline">
                                    Đăng nhập
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
