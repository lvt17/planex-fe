'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import PlanexLogo from '@/components/PlanexLogo';
import {
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="w-8 h-8 border-2 rounded-full animate-spin border-accent border-t-transparent" />
      </div>
    );
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <PlanexLogo size="md" showText />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-primary font-medium hover:text-accent transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-accent text-page font-medium hover:opacity-90 transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
            Quản lý công việc <br />
            <span className="text-accent">thông minh hơn</span>
          </h1>
          <p className="text-xl text-secondary mb-8 max-w-2xl mx-auto">
            Planex giúp bạn tổ chức tasks, theo dõi tiến độ, quản lý doanh thu và tăng năng suất làm việc.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl bg-accent text-page font-bold text-lg hover:opacity-90 transition-all flex items-center gap-2"
            >
              Bắt đầu miễn phí
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl border border-border text-primary font-medium hover:bg-hover transition-all"
            >
              Đã có tài khoản
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-primary text-center mb-12">
            Tính năng nổi bật
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-page border border-border rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-bold text-primary mb-2">Quản lý Tasks</h3>
              <p className="text-secondary text-sm">Tạo, theo dõi và hoàn thành công việc dễ dàng</p>
            </div>
            <div className="bg-page border border-border rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-syntax-purple/10 flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="w-7 h-7 text-syntax-purple" />
              </div>
              <h3 className="font-bold text-primary mb-2">Deadline Tracking</h3>
              <p className="text-secondary text-sm">Không bao giờ bỏ lỡ deadline quan trọng</p>
            </div>
            <div className="bg-page border border-border rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-syntax-green/10 flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-7 h-7 text-syntax-green" />
              </div>
              <h3 className="font-bold text-primary mb-2">Thống kê Doanh thu</h3>
              <p className="text-secondary text-sm">Theo dõi thu nhập từ công việc và bán hàng</p>
            </div>
            <div className="bg-page border border-border rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-syntax-yellow/10 flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-7 h-7 text-syntax-yellow" />
              </div>
              <h3 className="font-bold text-primary mb-2">Công cụ đa dạng</h3>
              <p className="text-secondary text-sm">Whiteboard, Documents, Spreadsheet tích hợp</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">
            Sẵn sàng tăng năng suất?
          </h2>
          <p className="text-secondary mb-8">
            Đăng ký ngay để trải nghiệm Planex hoàn toàn miễn phí.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-page font-bold text-lg hover:opacity-90 transition-all"
          >
            Tạo tài khoản miễn phí
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <PlanexLogo size="sm" showText />
          <p className="text-secondary text-sm">
            © 2026 Planex. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
