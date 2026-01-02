'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import PlanexLogo from '@/components/PlanexLogo';
import {
  CheckCircleIcon,
  UsersIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  TableCellsIcon,
  BellIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  ChartBarIcon,
  LinkIcon,
  EnvelopeIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <PlanexLogo size="lg" showLoadingRing showText={false} />
      </div>
    );
  }

  const features = [
    {
      title: 'Quản lý Tasks',
      description: 'Tạo task, chia nhỏ thành subtasks, theo dõi tiến độ. Hệ thống tự động tính phần trăm hoàn thành dựa trên subtasks.',
      icon: CheckCircleIcon,
    },
    {
      title: 'Quản lý Thu Nhập',
      description: 'Quản lí và kiểm soát dòng tiền vào từ các tasks đã hoàn thành và từ các dịch vụ bán ra.',
      icon: CircleStackIcon,
    },
    {
      title: 'Team Collaboration',
      description: 'Tạo team, mời thành viên qua email hoặc link. Chat trực tiếp trong app, không cần nhảy qua ứng dụng khác.',
      icon: UsersIcon,
    },
    {
      title: 'Whiteboard',
      description: 'Brainstorm ý tưởng, vẽ sơ đồ, lên kế hoạch dự án trên canvas không giới hạn.',
      icon: PaintBrushIcon,
    },
    {
      title: 'Documents',
      description: 'Soạn thảo văn bản với đầy đủ định dạng. Lưu trữ ngay trong workspace của bạn.',
      icon: DocumentTextIcon,
    },
    {
      title: 'Spreadsheets',
      description: 'Bảng tính với đầy đủ công thức. Quản lý data, track ngân sách, tính toán.',
      icon: TableCellsIcon,
    },
    {
      title: 'Notifications',
      description: 'Không bỏ lỡ deadline, không miss tin nhắn. Mọi cập nhật quan trọng đều được thông báo kịp thời.',
      icon: BellIcon,
    },
  ];

  const comingSoon = [
    { title: 'Calendar tích hợp', icon: CalendarIcon },
    { title: 'Mobile app', icon: DevicePhoneMobileIcon },
    { title: 'AI suggestions', icon: SparklesIcon },
    { title: 'Analytics dashboard', icon: ChartBarIcon },
    { title: 'Integrations', icon: LinkIcon },
  ];

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-page/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <PlanexLogo size="md" showText />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-secondary hover:text-primary transition-colors">
              Khám phá
            </a>
            <a href="#tools" className="text-secondary hover:text-primary transition-colors">
              Công cụ
            </a>
            <a href="#story" className="text-secondary hover:text-primary transition-colors">
              Câu chuyện
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="px-4 py-2 text-primary font-medium hover:text-accent transition-colors">
              Đăng nhập
            </Link>
            <Link href="/register" className="px-5 py-2 rounded-xl bg-accent text-page font-medium hover:opacity-90 transition-all">
              Bắt đầu miễn phí
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-hover transition-colors"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-primary" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface animate-fade-in">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-secondary hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Khám phá
              </a>
              <a href="#tools" className="block text-secondary hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Công cụ
              </a>
              <a href="#story" className="block text-secondary hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Câu chuyện
              </a>
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <Link href="/login" className="w-full py-3 text-center text-primary font-medium border border-border rounded-xl hover:bg-hover transition-colors">
                  Đăng nhập
                </Link>
                <Link href="/register" className="w-full py-3 text-center rounded-xl bg-accent text-page font-medium hover:opacity-90 transition-all">
                  Bắt đầu miễn phí
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-6 leading-tight">
            <span className="font-handwriting text-accent">" </span>
            <span className="font-elegant">hành tinh của công việc</span>
            <span className="font-handwriting text-accent"> "</span>
            <br />
            <span className="font-sans">của riêng bạn</span>
          </h1>
          <p className="text-lg sm:text-xl text-secondary mb-4 max-w-2xl mx-auto">
            Mọi thứ cần thiết cho công việc của bạn đều ở một chỗ.
          </p>
          <p className="text-base text-muted mb-10 max-w-2xl mx-auto">
            Những gì bạn cần đều có — hoặc sẽ có.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent text-page font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Bắt đầu miễn phí
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-border text-primary font-medium hover:bg-hover transition-all text-center"
            >
              Khám phá tính năng
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary text-center mb-4">
            Trên hành tinh này có gì?
          </h2>
          <p className="text-secondary text-center mb-12 max-w-xl mx-auto">
            Tụi mình đã và đang cố gắng gom tất cả công cụ cần thiết vào một chỗ để các bạn không phải nhảy qua lại giữa nhiều nền tảng khác nhau.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-page border border-border rounded-2xl p-6 hover:border-accent/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold text-primary mb-2">{feature.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section id="tools" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary text-center mb-4">
            Đang phát triển
          </h2>
          <p className="text-secondary text-center mb-10 max-w-xl mx-auto">
            Tụi mình đang cố gắng xây dựng thêm nhiều tính năng. Nếu bạn có ý tưởng gì muốn thêm, hãy gửi mail cho tụi mình nhenn!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {comingSoon.map((item) => (
              <div key={item.title} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-sm text-secondary">
                <item.icon className="w-4 h-4" />
                {item.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-16 sm:py-20 px-4 sm:px-6 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary text-center mb-10">
            Về Planex
          </h2>
          <div className="space-y-6 text-secondary leading-relaxed">
            <p>Tụi mình là những freelancers.</p>

            <p>
              Mỗi ngày, tụi mình phải nhảy qua lại giữa hàng loạt công cụ: Trello cho tasks, Notion cho notes,
              Slack cho chat, Google Sheets cho track tiền, Miro cho brainstorm... Mỗi thứ một nơi,
              mỗi thứ một tài khoản, mỗi thứ một cách hoạt động khác nhau.
            </p>

            <p className="text-primary font-medium">Mệt lắm luôn.</p>

            <p>
              Rồi một ngày tụi mình tự hỏi: <span className="text-primary">"Tại sao không gom tất cả lại một chỗ ha?"</span>
            </p>

            <p>Vậy là <span className="text-primary">Planex</span> ra đời.</p>

            <p>
              Không phải startup to lớn, cũng không phải sản phẩm của công ty nào,
              Planex chỉ là một hành tinh mà tụi mình tự xây để mang đem mọi thứ về một ngôi nhà chung, và thật tiếc nếu tụi mình chỉ giữ nó làm của riêng đúng không nè.
            </p>

            <p>
              Tụi mình gọi đây là "hành tinh" — một nơi mà các bạn có thể gom mọi thứ lại,
              làm việc theo cách của mình, không bị phân tán bởi hàng chục tabs và apps.
            </p>

            <p>
              Planex hiện tại chưa hoàn hảo, và tụi mình vẫn đang học, đang xây, đang cải thiện mỗi ngày.
              Nhưng tụi mình hứa sẽ luôn lắng nghe feedback từ các bạn để làm cho hành tinh này ngày càng tốt hơn.
              Mỗi feedback của các bạn là một viên gạch giúp hành tinh này vững chắc và vững mạnh hơn 💝.
            </p>

            <p className="text-primary font-medium pt-4">
              Chào mừng đến với Planex — hành tinh của riêng bạn.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">
            Bạn đã sẵn sàng thử chưaaaaaa?
          </h2>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-page font-bold text-lg hover:opacity-90 transition-all"
          >
            Bắt đầu ngay thôi nào!
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <PlanexLogo size="sm" showText />
              <p className="text-secondary text-sm mt-4 max-w-sm">
                Hành tinh của công việc, nơi tiện nghi đặt lên hàng đầu.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-medium text-primary mb-4"> </h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-secondary text-sm hover:text-primary transition-colors"> </a></li>
                <li><a href="#tools" className="text-secondary text-sm hover:text-primary transition-colors"> </a></li>
                <li><a href="#story" className="text-secondary text-sm hover:text-primary transition-colors"> </a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-medium text-primary mb-4">Liên hệ</h4>
              <a
                href="mailto:contact@planex.tech"
                className="flex items-center gap-2 text-secondary text-sm hover:text-accent transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4" />
                contact@planex.tech
              </a>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted text-sm">

            </p>
            <p className="text-muted text-sm">
              © 2024 Planex. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
