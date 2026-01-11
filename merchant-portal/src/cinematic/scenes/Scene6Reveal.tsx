
import React from 'react';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Scene6Reveal: React.FC = () => {
    const navigate = useNavigate();

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-white relative z-20">

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8"
                >
                    <div className="w-32 h-32 bg-gold-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-[0_0_50px_rgba(232,197,71,0.5)]">
                        <span className="text-4xl text-black">🚀</span>
                    </div>
                    <h1 className="text-5xl font-black mb-4">Está pronto.</h1>
                    <p className="text-xl text-neutral-300">O mundo já pode pedir.</p>
                </motion.div>

                <div className="w-full max-w-xs space-y-4">
                    <PulseButton onClick={() => navigate('/app/tpv')}>
                        Abrir Minha Loja 🏪
                    </PulseButton>
                    <button className="text-sm text-neutral-500 hover:text-white transition-colors">
                        Configurar Pagamentos (Desbloquear €)
                    </button>
                </div>

            </div>
        </CinemaLayout>
    );
};
