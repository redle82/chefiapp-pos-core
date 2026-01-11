import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { useAutopilot } from '../context/AutopilotContext';
import { useOnboardingEngine } from '../context/OnboardingEngineProvider';
import { motion } from 'framer-motion';

export const SceneTasksIntro: React.FC = () => {
    const navigate = useNavigate();
    const { setTasksEnabled, generateTasks, activeTasks } = useAutopilot();
    const { engine, refresh } = useOnboardingEngine();

    // Get Context from Engine
    const businessType = engine.getSession().businessType || 'restaurant';
    const teamSize = engine.getSession().data.staff?.totalCount || 1;

    const handleAccept = () => {
        setTasksEnabled(true);
        generateTasks(); // Pre-calculate tasks for UI preview
        // Engine commit happens in NEXT screen (Staff Distribution)
        navigate('/start/cinematic/staff-dist');
    };

    const handleSkip = () => {
        setTasksEnabled(false);

        try {
            // Update session with Defaults
            engine.updateSession(s => {
                s.data.staff = {
                    totalCount: teamSize,
                    kitchen: 0,
                    bar: 0,
                    floor: teamSize // All on floor if skipped
                };
                s.data.tasks = { enabled: false, mode: 'MANUAL' };
            });

            refresh();
            navigate('/start/cinematic/4'); // Skip to Menu (Scene 4)
        } catch (e) {
            console.error("Error skipping tasks:", e);
        }
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="text-6xl mb-6 block">⚡</span>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Piloto Automático Operacional
                    </h1>
                    <p className="text-neutral-400 text-xl leading-relaxed mb-12">
                        O ChefIApp sabe como funciona um {businessType === 'bar' ? 'Bar' : businessType === 'cafe' ? 'Café' : 'Restaurante'}.
                        <br /><br />
                        Podemos configurar <strong>{activeTasks.length > 0 ? activeTasks.length : '150+'} tarefas essenciais</strong> e distribuí-las pela tua equipa automaticamente?
                    </p>

                    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
                        <button
                            onClick={handleAccept}
                            className="bg-gold-500 text-black font-bold py-4 px-8 rounded-xl text-lg hover:bg-gold-400 transition-all shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:scale-105"
                        >
                            ✅ Sim, organizar tudo
                        </button>
                        <button
                            onClick={handleSkip}
                            className="text-neutral-500 py-4 px-8 hover:text-white transition-colors"
                        >
                            ⚙️ Prefiro configurar depois
                        </button>
                    </div>
                </motion.div>
            </div>
        </CinemaLayout>
    );
};
