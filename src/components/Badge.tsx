'use client';

import React from 'react';

interface BadgeProps {
    title: string | undefined;
    size?: 'sm' | 'md' | 'lg';
    showIconOnly?: boolean;
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
    }
};

export default function Badge({ title, size = 'md', showIconOnly = false }: BadgeProps) {
    if (!title || !badgeConfigs[title]) return null;

    const config = badgeConfigs[title];

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

    return (
        <div className={`
            relative flex items-center gap-1 font-bold uppercase tracking-wider rounded-md
            bg-surface/40 backdrop-blur-md border ${config.border} ${config.glow} ${sizeClasses[size]}
            transition-all duration-300 hover:scale-105 group overflow-hidden
        `}>
            {/* Shimmer Effect for Legend & Master */}
            {(title === 'Planex Legend' || title === 'Planex Master') && (
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
