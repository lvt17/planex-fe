'use client';

import React from 'react';

interface BadgeProps {
    title: string | undefined;
    size?: 'sm' | 'md' | 'lg';
    showIconOnly?: boolean;
    frame?: string; // Optional frame style: Neon Blue, Solar Gold, Cyber Punk, Holographic, Emerald Guard, Void Void, Royal Silver, Vivid Flame
}

const badgeConfigs: Record<string, { icon: string; color: string; glow: string; border: string }> = {
    'Planex Ghost': {
        icon: '/badges/ghost.png',
        color: 'from-slate-400 to-slate-600',
        glow: 'shadow-[0_0_10px_rgba(148,163,184,0.3)]',
        border: 'border-slate-400/30'
    },
    'Planex Legend': {
        icon: '/badges/legend.png',
        color: 'from-amber-300 via-yellow-500 to-amber-600',
        glow: 'shadow-[0_0_15px_rgba(251,191,36,0.4)]',
        border: 'border-amber-400/50'
    },
    'Planex Master': {
        icon: '/badges/master.png',
        color: 'from-purple-500 via-indigo-500 to-purple-700',
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
        border: 'border-purple-400/40'
    },
    'Planex Citizen': {
        icon: '/badges/citizen.png',
        color: 'from-blue-400 to-blue-600',
        glow: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]',
        border: 'border-blue-300/30'
    },
    'Planex Newbie': {
        icon: '/badges/newbie.png',
        color: 'from-emerald-400 to-emerald-600',
        glow: 'shadow-none',
        border: 'border-emerald-300/20'
    },
    'Planex Leader': {
        icon: '/badges/leader.png',
        color: 'from-rose-500 to-red-700',
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
        border: 'border-rose-400/40'
    },
    'The Best Member': {
        icon: '/badges/best_membership.png',
        color: 'from-amber-200 via-yellow-400 to-orange-500',
        glow: 'shadow-[0_0_15px_rgba(252,211,77,0.4)]',
        border: 'border-yellow-300/50'
    },
    'Star of the Week': {
        icon: '/badges/master.png',
        color: 'from-cyan-400 to-blue-500',
        glow: 'shadow-[0_0_12px_rgba(34,211,238,0.4)]',
        border: 'border-cyan-300/40'
    },
    'Star of the Month': {
        icon: '/badges/legend.png',
        color: 'from-purple-400 to-pink-500',
        glow: 'shadow-[0_0_15px_rgba(192,38,211,0.4)]',
        border: 'border-purple-300/50'
    }
};

const frameConfigs: Record<string, string> = {
    'Neon Blue': 'ring-1 ring-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]',
    'Solar Gold': 'ring-1 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.7)] animate-pulse',
    'Cyber Punk': 'ring-1 ring-fuchsia-500 border-cyan-400 shadow-[0_0_10px_rgba(192,38,211,0.6)]',
    'Holographic': 'ring-1 ring-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.6)] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10',
    'Emerald Guard': 'ring-1 ring-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]',
    'Void Void': 'ring-1 ring-slate-800 shadow-[0_0_10px_rgba(30,41,59,0.9)] bg-slate-950/20',
    'Royal Silver': 'ring-1 ring-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.5)]',
    'Vivid Flame': 'ring-1 ring-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.7)]'
};

export default function Badge({ title, size = 'md', showIconOnly = false, frame }: BadgeProps) {
    if (!title) return null;

    const config = badgeConfigs[title] || {
        icon: '/badges/newbie.png',
        color: 'from-secondary to-muted',
        glow: 'shadow-none',
        border: 'border-secondary/20'
    };

    const sizeClasses = {
        sm: 'h-4 px-1 text-[8px]',
        md: 'h-5 px-1.5 text-[10px]',
        lg: 'h-6 px-2 text-[11px]'
    };

    const iconSizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4'
    };

    const premiumTitles = [
        'Planex Ghost', 'Planex Legend', 'Planex Master',
        'The Best Member', 'Star of the Month', 'Star of the Week'
    ];

    const isPremium = premiumTitles.includes(title);
    const frameClass = frame ? frameConfigs[frame] || '' : '';

    return (
        <div className={`
            relative flex items-center gap-1 font-bold uppercase tracking-wider rounded-md
            bg-surface/40 backdrop-blur-md border ${config.border} ${config.glow} ${sizeClasses[size]}
            ${frameClass}
            transition-all duration-300 hover:scale-105 group overflow-hidden
        `}>
            {/* Shimmer Effect for Premium Badges */}
            {isPremium && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            )}

            <img
                src={config.icon}
                alt={title}
                className={`${iconSizeClasses[size]} object-contain filter drop-shadow-sm`}
            />

            {!showIconOnly && (
                <span className={`bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                    {title}
                </span>
            )}
        </div>
    );
}
