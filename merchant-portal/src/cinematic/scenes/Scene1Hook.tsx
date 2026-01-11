
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { motion } from 'framer-motion';

export const Scene1Hook: React.FC = () => {
    const navigate = useNavigate();

    const handleStart = () => {
        // Optional: Play sound
        navigate('/start/cinematic/2');
    };

    return (
        <CinemaLayout>
            {/* Background Breathing Layer */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-500/20 via-neutral-900/50 to-black z-0 pointer-events-none"
            />

            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-20 h-full">

                {/* Floating Glass Brand Card */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12 px-6 py-3 rounded-full glass-panel"
                >
                    <span className="text-white/90 font-bold tracking-[0.2em] text-xs uppercase">ChefIApp OS</span>
                </motion.div>


                {/* Main Copy - Aggressive */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mb-10 max-w-lg"
                >
                    <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6 drop-shadow-2xl tracking-tight">
                        Isto já devia estar <br />
                        <span className="text-gradient">
                            a acontecer.
                        </span>
                    </h1>
                    <p className="text-white">
                        Pedidos. Cozinha. Dinheiro. <br />
                        <span className="text-neutral-500 text-lg">Sem fricção. Sem formatação. Apenas fluxo.</span>
                    </p>
                </motion.div>

                {/* CTA - Pulsing & Violent */}
                <motion.div
                    className="w-full max-w-xs flex flex-col items-center gap-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <PulseButton onClick={handleStart} style={{ fontSize: '1.25rem', padding: '1.25rem' }}>
                        Entrar no Fluxo ⚡
                    </PulseButton>

                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800/80 rounded-lg border border-neutral-700/50"
                    >
                        <span className="text-lg">🔔</span>
                        <span className="text-sm text-neutral-300">A Cozinha está à espera.</span>
                    </motion.div>
                </motion.div>

            </div>

            {/* Video Overlay (Optional - darkened for text pop) */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-20 pointer-events-none grayscale mix-blend-overlay"
            >
                <source src="/cinematic/hook.mp4" type="video/mp4" />
            </video>
        </CinemaLayout >
    );
};
