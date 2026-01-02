'use client';

interface PlanexLogoProps {
    size?: 'sm' | 'md' | 'lg';
    showLoadingRing?: boolean;
    showText?: boolean;
    className?: string;
}

export default function PlanexLogo({ size = 'md', showLoadingRing = false, showText = true, className = '' }: PlanexLogoProps) {
    const sizes = {
        sm: { text: 'text-lg', planet: 20, gap: 'gap-2' },
        md: { text: 'text-2xl', planet: 32, gap: 'gap-3' },
        lg: { text: 'text-4xl', planet: 44, gap: 'gap-4' },
    };

    const s = sizes[size];
    const p = s.planet;

    return (
        <div className={`relative flex items-center ${s.gap} ${className}`}>
            {/* Planet - stationary, spinning in place */}
            <div className="relative flex-shrink-0" style={{ width: p, height: p }}>
                {/* Multi-layer loading rings */}
                {showLoadingRing && (
                    <>
                        {/* Outer ring - slow rotation */}
                        <div
                            className="absolute animate-spin-slow"
                            style={{
                                inset: -12,
                                background: `conic-gradient(
                                    from 0deg,
                                    transparent 0deg,
                                    rgba(103,232,249,0.2) 30deg,
                                    rgba(34,211,238,0.4) 60deg,
                                    rgba(6,182,212,0.6) 90deg,
                                    rgba(14,116,144,0.8) 120deg,
                                    rgba(6,182,212,0.6) 150deg,
                                    rgba(34,211,238,0.4) 180deg,
                                    rgba(103,232,249,0.2) 210deg,
                                    transparent 240deg,
                                    transparent 360deg
                                )`,
                                borderRadius: '50%',
                                WebkitMask: 'radial-gradient(transparent 65%, black 65%, black 75%, transparent 75%)',
                                mask: 'radial-gradient(transparent 65%, black 65%, black 75%, transparent 75%)',
                                filter: 'blur(1px)',
                            }}
                        />

                        {/* Middle ring - medium rotation */}
                        <div
                            className="absolute animate-spin-medium"
                            style={{
                                inset: -8,
                                background: `conic-gradient(
                                    from 180deg,
                                    transparent 0deg,
                                    rgba(34,211,238,0.3) 45deg,
                                    rgba(6,182,212,0.7) 90deg,
                                    rgba(103,232,249,0.5) 135deg,
                                    rgba(34,211,238,0.3) 180deg,
                                    transparent 225deg,
                                    transparent 360deg
                                )`,
                                borderRadius: '50%',
                                WebkitMask: 'radial-gradient(transparent 70%, black 70%, black 78%, transparent 78%)',
                                mask: 'radial-gradient(transparent 70%, black 70%, black 78%, transparent 78%)',
                            }}
                        />

                        {/* Inner ring - fast rotation */}
                        <div
                            className="absolute animate-spin-fast"
                            style={{
                                inset: -4,
                                background: `conic-gradient(
                                    from 90deg,
                                    transparent 0deg,
                                    rgba(103,232,249,0.8) 60deg,
                                    rgba(34,211,238,1) 120deg,
                                    rgba(103,232,249,0.8) 180deg,
                                    transparent 240deg,
                                    transparent 360deg
                                )`,
                                borderRadius: '50%',
                                WebkitMask: 'radial-gradient(transparent 75%, black 75%, black 82%, transparent 82%)',
                                mask: 'radial-gradient(transparent 75%, black 75%, black 82%, transparent 82%)',
                                boxShadow: '0 0 20px rgba(34,211,238,0.5)',
                            }}
                        />

                        {/* Particles */}
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute animate-particle"
                                style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    background: 'rgba(103,232,249,0.9)',
                                    boxShadow: '0 0 6px rgba(103,232,249,0.8)',
                                    top: '50%',
                                    left: '50%',
                                    transform: `rotate(${i * 45}deg) translateY(-${p / 2 + 8}px)`,
                                    animationDelay: `${i * 0.15}s`,
                                }}
                            />
                        ))}
                    </>
                )}

                {/* Planet sphere */}
                <div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{
                        background: `
                            radial-gradient(circle at 30% 25%, rgba(255,255,255,0.4) 0%, transparent 40%),
                            radial-gradient(circle at 70% 80%, rgba(0,0,0,0.4) 0%, transparent 40%),
                            linear-gradient(135deg, #06b6d4 0%, #0891b2 25%, #0e7490 50%, #155e75 75%, #164e63 100%)
                        `,
                        boxShadow: `
                            inset -${p / 3}px -${p / 4}px ${p / 2}px rgba(0,0,0,0.6),
                            inset ${p / 6}px ${p / 6}px ${p / 3}px rgba(103,232,249,0.5),
                            0 0 ${p / 2}px rgba(6,182,212,0.7),
                            0 ${p / 8}px ${p / 3}px rgba(0,0,0,0.4)
                        `,
                    }}
                >
                    {/* Animated surface texture - creates spinning illusion */}
                    <div
                        className="absolute inset-[-50%] animate-surface-spin"
                        style={{
                            width: '200%',
                            height: '100%',
                            background: `
                                repeating-linear-gradient(
                                    0deg,
                                    transparent 0%,
                                    rgba(103,232,249,0.15) 3%,
                                    transparent 6%,
                                    rgba(20,184,166,0.2) 12%,
                                    transparent 15%,
                                    rgba(34,211,238,0.12) 20%,
                                    transparent 24%
                                )
                            `,
                        }}
                    />

                    {/* Cloud layer */}
                    <div
                        className="absolute inset-0 animate-clouds"
                        style={{
                            background: `
                                radial-gradient(ellipse 35% 25% at 25% 30%, rgba(255,255,255,0.3) 0%, transparent 100%),
                                radial-gradient(ellipse 30% 20% at 65% 70%, rgba(255,255,255,0.2) 0%, transparent 100%),
                                radial-gradient(ellipse 25% 30% at 80% 45%, rgba(255,255,255,0.25) 0%, transparent 100%)
                            `,
                        }}
                    />
                </div>

                {/* Atmosphere glow */}
                <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        inset: -3,
                        boxShadow: `
                            0 0 ${p / 3}px rgba(103,232,249,0.5),
                            0 0 ${p / 1.5}px rgba(34,211,238,0.3)
                        `,
                    }}
                />

                {/* Saturn ring */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: '50%',
                        left: '50%',
                        width: p * 1.7,
                        height: p * 0.4,
                        marginLeft: -p * 0.85,
                        marginTop: -p * 0.2,
                        borderTop: '2px solid rgba(103, 232, 249, 0.7)',
                        borderBottom: '1.5px solid rgba(103, 232, 249, 0.3)',
                        borderRadius: '50%',
                        transform: 'rotateX(75deg)',
                        boxShadow: '0 0 8px rgba(103, 232, 249, 0.4)',
                    }}
                />
            </div>

            {/* Planex Text - white */}
            {showText && (
                <span className={`${s.text} font-bold tracking-tight text-white`}>
                    Planex
                </span>
            )}

            <style jsx>{`
                @keyframes surface-spin {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }

                @keyframes clouds {
                    0% { transform: translateX(0) rotate(0deg); }
                    100% { transform: translateX(-8px) rotate(2deg); }
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes spin-medium {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }

                @keyframes spin-fast {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes particle {
                    0%, 100% { opacity: 0.3; transform: rotate(var(--rotation, 0deg)) translateY(-${p / 2 + 8}px) scale(0.8); }
                    50% { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateY(-${p / 2 + 8}px) scale(1.2); }
                }

                .animate-surface-spin {
                    animation: surface-spin 10s linear infinite;
                }

                .animate-clouds {
                    animation: clouds 18s ease-in-out infinite alternate;
                }

                .animate-spin-slow {
                    animation: spin-slow 4s linear infinite;
                }

                .animate-spin-medium {
                    animation: spin-medium 2.5s linear infinite;
                }

                .animate-spin-fast {
                    animation: spin-fast 1.5s linear infinite;
                }

                .animate-particle {
                    animation: particle 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
