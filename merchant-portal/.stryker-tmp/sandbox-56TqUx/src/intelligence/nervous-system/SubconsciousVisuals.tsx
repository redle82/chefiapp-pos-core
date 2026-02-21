// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNervousPhysics } from './useNervousPhysics';
import type { NervousMode } from './useNervousPhysics';

// ------------------------------------------------------------------
// 👁️ SUBCONSCIOUS VISUALS (VISUAL CORTEX)
// ------------------------------------------------------------------
// "It visualizes the Force Field."
// ------------------------------------------------------------------

export const SubconsciousVisuals: React.FC = () => {
    // We need a ticker to force re-render of the physics hook if it depends on time
    // But hooks usually react to state. `useNervousPhysics` depends on `lastActivityAt`.
    // It also needs to update as time passes (progressToIdle).
    // So we need a local ticker here to drive the hook's time-based calculations if explicit.
    // However, `useNervousPhysics` uses `useMemo` dependent on `getNow()`. 
    // `getNow()` is not a reactive state. 
    // We need to force update for the hook to re-run time diffs.

    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const { mode, phase, progressToIdle, pressureScore } = useNervousPhysics();

    // 🎨 ATMOSPHERE MAPPING
    const getAmbientValues = (mode: NervousMode) => {
        switch (mode) {
            case 'sympathetic': // FIGHT
                return {
                    bg: 'radial-gradient(circle at center, rgba(255, 68, 68, 0.05) 0%, transparent 70%)',
                    pulseScale: 1.02,
                    borderColor: '#ff4444'
                };
            case 'parasympathetic': // DREAM
                return {
                    bg: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, transparent 80%)',
                    pulseScale: 1.05,
                    borderColor: '#10b981'
                };
            case 'flow': // WORK
                return {
                    bg: 'none',
                    pulseScale: 1,
                    borderColor: 'transparent'
                };
            case 'wake': // ACTION
            default:
                return {
                    bg: 'none',
                    pulseScale: 1,
                    borderColor: 'transparent'
                };
        }
    };

    const ambient = getAmbientValues(mode);

    return (
        <AnimatePresence>
            {/* 1. BREATHING FIELD (The Atmosphere) */}
            {mode !== 'wake' && (
                <motion.div
                    key="field"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: mode === 'sympathetic' ? 1 : Math.min(progressToIdle, 1) * 0.8,
                        background: ambient.bg
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2 }}
                    className="fixed inset-0 pointer-events-none z-0"
                />
            )}

            {/* 2. DREAM PARTICLES (Pre-Reflex) */}
            {mode === 'parasympathetic' && (
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            className={`absolute rounded-full blur-3xl opacity-20`}
                            initial={{ x: `${Math.random() * 100}vw`, y: `${Math.random() * 100}vh`, scale: 0.5 }}
                            animate={{
                                y: [0, -40, 0],
                                scale: [0.5, 0.8, 0.5],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{
                                duration: 8 + i * 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{
                                width: '300px',
                                height: '300px',
                                background: phase === 'lull' ? '#3b82f6' : '#10b981' // Blue for Lull, Green for General
                            }}
                        />
                    ))}
                </div>
            )}

            {/* 3. SYNAPSE VIGNETTE (Pressure Alert) */}
            {mode === 'sympathetic' && (
                <motion.div
                    key="synapse"
                    className="fixed inset-0 pointer-events-none z-50 border-[0px]"
                    animate={{
                        boxShadow: `inset 0 0 40px ${pressureScore > 50 ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255, 165, 0, 0.1)'}`
                    }}
                    transition={{ duration: 0.5 }}
                />
            )}

            {/* 4. THE HINT (Visual Cortex Awareness) */}
            {progressToIdle > 0.8 && mode === 'parasympathetic' && (
                <motion.div
                    key="hint-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed bottom-12 left-0 right-0 pointer-events-none z-50 flex justify-center"
                >
                    <div className="bg-neutral-900/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/40 text-[10px] font-mono tracking-[0.2em] uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        System Dreaming...
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
