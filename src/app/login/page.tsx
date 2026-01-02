'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import PlanexLogo from '@/components/PlanexLogo';
import { toast } from 'react-hot-toast';

import { tokenStorage } from '@/utils/tokenStorage';

declare global {
    interface Window {
        google: any;
    }
}

import { Suspense } from 'react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = searchParams.get('next');
    const { user, login, googleLogin, loading } = useAuth();
    // ... existing state and effects ...
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load remembered email on mount
    useEffect(() => {
        const remembered = tokenStorage.getRememberedEmail();
        if (remembered) {
            setEmail(remembered);
            setRememberMe(true);
        }
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push(nextPath || '/dashboard');
        }
    }, [user, router, nextPath]);

    // Initialize Google Sign-In
    useEffect(() => {
        const initializeGoogleSignIn = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                    callback: handleGoogleResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });

                const buttonDiv = document.getElementById('google-button');
                if (buttonDiv) {
                    const containerWidth = Math.min(buttonDiv.offsetWidth || 300, 400);
                    window.google.accounts.id.renderButton(buttonDiv, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                        width: containerWidth.toString(),
                    });
                }
            }
        };

        const scriptId = 'google-gsi-client';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogleSignIn;
            document.head.appendChild(script);
        } else {
            initializeGoogleSignIn();
        }
    }, []);

    const handleGoogleResponse = async (response: any) => {
        try {
            console.log('Google login initiated');
            await googleLogin(response.credential);
            console.log('Google login successful');
            toast.success('Đăng nhập Google thành công!');
            router.push(nextPath || '/dashboard');
        } catch (error: any) {
            console.error('Google login error:', error);
            toast.error(error.response?.data?.error || error.message || 'Lỗi xác thực Google với hệ thống');
            // Don't redirect on error - stay on login page
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Vui lòng nhập email và mật khẩu');
            return;
        }

        setSubmitting(true);
        try {
            await login(email, password);

            if (rememberMe) {
                tokenStorage.setRememberedEmail(email);
            } else {
                tokenStorage.clearRememberedEmail();
            }

            toast.success('Đăng nhập thành công!');
            router.push(nextPath || '/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Lỗi đăng nhập');
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
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent/20 to-syntax-purple/20 items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <PlanexLogo size="lg" showText className="justify-center mb-8" />
                    <h1 className="text-3xl font-bold text-primary mb-4">
                        Quản lý công việc thông minh
                    </h1>
                    <p className="text-secondary text-lg">
                        Tổ chức tasks, theo dõi tiến độ, và tăng năng suất làm việc cùng Planex.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex justify-center mb-6 sm:mb-8">
                        <PlanexLogo size="sm" showText />
                    </div>

                    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-8 shadow-lg">
                        <h2 className="text-xl sm:text-2xl font-bold text-primary text-center mb-2">
                            Đăng nhập
                        </h2>
                        <p className="text-secondary text-center text-sm sm:text-base mb-4 sm:mb-6">
                            Chào mừng trở lại!
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-secondary">
                                        Mật khẩu
                                    </label>
                                    <Link href="/forgot-password" className="text-sm text-accent hover:underline">
                                        Quên mật khẩu?
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-page border border-border text-primary focus:border-accent focus:outline-none transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-accent border-border rounded focus:ring-accent accent-accent cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary cursor-pointer">
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 rounded-xl bg-accent text-page font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 rounded-full animate-spin border-page border-t-transparent mx-auto" />
                                ) : (
                                    'Đăng nhập'
                                )}
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-surface text-muted">hoặc tiếp tục với</span>
                            </div>
                        </div>

                        <div className="p-[1px] rounded-xl bg-gradient-to-r from-border via-accent/30 to-border hover:from-accent/50 hover:via-border hover:to-accent/50 transition-all duration-500 shadow-sm">
                            <div className="bg-surface rounded-xl overflow-hidden flex justify-center">
                                <div id="google-button" className="w-full flex justify-center py-0.5"></div>
                            </div>
                        </div>

                        <p className="text-center text-secondary mt-6">
                            Chưa có tài khoản?{' '}
                            <Link href="/register" className="text-accent font-semibold hover:underline">
                                Đăng ký
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
