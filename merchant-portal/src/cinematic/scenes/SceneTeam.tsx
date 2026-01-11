import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { motion } from 'framer-motion';
import { useAutopilot } from '../context/AutopilotContext';

// Logic: This scene just DRAFTS the team size. 
// Committal happens in SceneStaffDistribution OR SceneTasksIntro (if skipped).

export const SceneTeam: React.FC = () => {
    const navigate = useNavigate();
    const { setTeamSize, teamSize } = useAutopilot();
    const [people, setPeople] = useState(teamSize || 1);

    const handleNext = () => {
        setTeamSize(people);
        navigate('/start/cinematic/tasks-intro');
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-10"
                >
                    <span className="text-6xl mb-6 block">👥</span>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Qual o tamanho da tua equipa?
                    </h1>
                    <p className="text-neutral-400 text-lg">
                        Contando contigo.
                    </p>
                </motion.div>

                <div className="w-full bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800 mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-white font-medium text-xl">Pessoas</span>
                        <span className="text-gold-500 font-bold text-4xl">{people}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={people}
                        onChange={(e) => setPeople(Number(e.target.value))}
                        className="w-full h-4 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
                    />
                    <div className="flex justify-between mt-2 text-xs text-neutral-500">
                        <span>Eu sozinho</span>
                        <span>Exército</span>
                    </div>
                </div>

                <PulseButton onClick={handleNext}>Continuar 👉</PulseButton>
            </div>
        </CinemaLayout>
    );
};
