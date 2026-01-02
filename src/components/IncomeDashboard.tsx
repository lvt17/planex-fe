'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChartBarIcon, CurrencyDollarIcon, CheckCircleIcon, ShoppingBagIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import api from '@/utils/api';

interface IncomeStats {
    total_income: number;
    task_count: number;
    average_per_task: number;
    range: string;
    daily_stats: { date: string; total: number; count: number }[];
}

interface SalesStats {
    total_revenue: number;
    total_quantity: number;
    total_transactions: number;
    period: string;
    breakdown: { product_name: string; quantity: number; revenue: number }[];
}

interface IncomeDashboardProps {
    stats: IncomeStats | null;
    loading: boolean;
    onRangeChange: (range: 'week' | 'month' | 'year') => void;
}

const PERIODS = [
    { id: 'day', label: 'Ngày' },
    { id: 'week', label: 'Tuần' },
    { id: 'month', label: 'Tháng' },
    { id: 'quarter', label: 'Quý' },
    { id: '6months', label: '6 Tháng' },
    { id: 'year', label: 'Năm' },
] as const;

export default function IncomeDashboard({ stats, loading, onRangeChange }: IncomeDashboardProps) {
    const [activeSource, setActiveSource] = useState<'all' | 'job' | 'sales'>('all');
    const [activePeriod, setActivePeriod] = useState<string>('month');
    const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
    const [salesLoading, setSalesLoading] = useState(false);

    const fetchSalesStats = useCallback(async (period: string) => {
        setSalesLoading(true);
        try {
            const response = await api.get(`/api/sales/stats?period=${period}`);
            setSalesStats(response.data);
        } catch (error) {
            console.error('Failed to fetch sales stats:', error);
        } finally {
            setSalesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSalesStats(activePeriod);
    }, [activePeriod, fetchSalesStats]);

    const handlePeriodChange = (period: string) => {
        setActivePeriod(period);
        // Map to existing range format for job stats
        if (period === 'week' || period === 'day') {
            onRangeChange('week');
        } else if (period === 'year' || period === '6months' || period === 'quarter') {
            onRangeChange('year');
        } else {
            onRangeChange('month');
        }
    };

    const jobTotal = stats?.total_income || 0;
    const salesTotal = salesStats?.total_revenue || 0;
    const grandTotal = jobTotal + salesTotal;

    const displayedTotal = activeSource === 'job' ? jobTotal : activeSource === 'sales' ? salesTotal : grandTotal;
    const displayedLabel = activeSource === 'job' ? 'từ Job' : activeSource === 'sales' ? 'từ Bán hàng' : 'Tổng cộng';

    if (loading && salesLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4 border-border border-t-accent"></div>
                    <p className="text-secondary">Đang tải thống kê...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Source Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-1 bg-surface p-1 rounded-xl">
                    {[
                        { id: 'all', label: 'Tất cả', icon: ChartBarIcon },
                        { id: 'job', label: 'Job', icon: BriefcaseIcon },
                        { id: 'sales', label: 'Bán hàng', icon: ShoppingBagIcon },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSource(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeSource === tab.id
                                ? 'bg-accent text-page shadow-sm'
                                : 'text-secondary hover:text-primary hover:bg-hover'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Period Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                    {PERIODS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handlePeriodChange(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activePeriod === p.id
                                ? 'bg-accent text-page'
                                : 'bg-surface border border-border text-secondary hover:text-primary'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                {/* Total Revenue */}
                <div className="p-6 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-syntax-green/15 flex items-center justify-center">
                            <CurrencyDollarIcon className="w-5 h-5 text-syntax-green" />
                        </div>
                        <span className="text-sm text-secondary">Doanh thu {displayedLabel}</span>
                    </div>
                    <p className="text-3xl font-bold text-primary">
                        {displayedTotal.toLocaleString('vi-VN')} đ
                    </p>
                    {activeSource === 'all' && (
                        <div className="mt-3 flex gap-4 text-xs">
                            <span className="text-secondary">
                                Job: <span className="text-syntax-blue font-medium">{jobTotal.toLocaleString('vi-VN')}đ</span>
                            </span>
                            <span className="text-secondary">
                                Bán hàng: <span className="text-syntax-orange font-medium">{salesTotal.toLocaleString('vi-VN')}đ</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Tasks/Transactions Count */}
                <div className="p-6 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                            <CheckCircleIcon className="w-5 h-5 text-accent" />
                        </div>
                        <span className="text-sm text-secondary">
                            {activeSource === 'sales' ? 'Số giao dịch' : 'Tasks hoàn thành'}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-primary">
                        {activeSource === 'sales'
                            ? salesStats?.total_transactions || 0
                            : (activeSource === 'job' ? stats?.task_count || 0 : (stats?.task_count || 0) + (salesStats?.total_transactions || 0))
                        }
                    </p>
                    {activeSource === 'sales' && salesStats && (
                        <p className="text-xs text-muted mt-2">
                            Tổng SL bán: {salesStats.total_quantity} sản phẩm
                        </p>
                    )}
                </div>

                {/* Average */}
                <div className="p-6 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-syntax-purple/15 flex items-center justify-center">
                            <ChartBarIcon className="w-5 h-5 text-syntax-purple" />
                        </div>
                        <span className="text-sm text-secondary">
                            {activeSource === 'sales' ? 'Trung bình/giao dịch' : 'Trung bình/task'}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-primary">
                        {activeSource === 'sales'
                            ? (salesStats?.total_transactions ? Math.round(salesTotal / salesStats.total_transactions) : 0).toLocaleString('vi-VN')
                            : (stats?.average_per_task || 0).toLocaleString('vi-VN')
                        } đ
                    </p>
                </div>
            </div>

            {/* Charts/Details by Source */}
            {(activeSource === 'all' || activeSource === 'job') && stats?.daily_stats && stats.daily_stats.length > 0 && (
                <div className="p-6 rounded-xl bg-surface border border-border">
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5 text-syntax-blue" />
                        Doanh thu từ Job
                    </h3>
                    <div className="space-y-3">
                        {stats.daily_stats.slice(-10).map((day, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="text-sm text-secondary w-24">{day.date}</span>
                                <div className="flex-1 h-6 rounded-full bg-page overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-syntax-blue transition-all"
                                        style={{
                                            width: `${Math.min(100, (day.total / (stats.total_income || 1)) * 100 * stats.daily_stats.length)}%`
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-primary w-28 text-right">
                                    {day.total.toLocaleString('vi-VN')} đ
                                </span>
                                <span className="text-xs text-muted w-16">
                                    {day.count} task{day.count !== 1 ? 's' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(activeSource === 'all' || activeSource === 'sales') && salesStats?.breakdown && salesStats.breakdown.length > 0 && (
                <div className="p-6 rounded-xl bg-surface border border-border">
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <ShoppingBagIcon className="w-5 h-5 text-syntax-orange" />
                        Doanh thu từ Bán hàng
                    </h3>
                    <div className="space-y-3">
                        {salesStats.breakdown.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="text-sm text-primary w-40 truncate">{item.product_name}</span>
                                <div className="flex-1 h-6 rounded-full bg-page overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-syntax-orange transition-all"
                                        style={{
                                            width: `${Math.min(100, (item.revenue / salesTotal) * 100)}%`
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-primary w-28 text-right">
                                    {item.revenue.toLocaleString('vi-VN')} đ
                                </span>
                                <span className="text-xs text-muted w-20">
                                    SL: {item.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {(!stats?.daily_stats || stats.daily_stats.length === 0) && (!salesStats?.breakdown || salesStats.breakdown.length === 0) && (
                <div className="text-center py-12 rounded-xl bg-surface border border-border">
                    <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-secondary" />
                    <p className="text-secondary">Chưa có dữ liệu doanh thu trong khoảng thời gian này</p>
                </div>
            )}
        </div>
    );
}
