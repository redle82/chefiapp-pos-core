import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { useAutopilot } from '../context/AutopilotContext';
import { useOnboardingEngine } from '../context/OnboardingEngineProvider';
import { PulseButton } from '../components/PulseButton';
import { motion } from 'framer-motion';

export const SceneStaffDistribution: React.FC = () => {
    const navigate = useNavigate();
    const { teamSize, setStaffDistribution } = useAutopilot();
    const { engine, refresh } = useOnboardingEngine();

    // Local state for sliders
    const [kitchen, setKitchen] = useState(0);
    const [floor, setFloor] = useState(0);
    const [bar, setBar] = useState(0);

    // Initial intelligent distribution based on team size
    useEffect(() => {
        // Simple heuristic for defaults
        if (teamSize === 1) { setFloor(1); }
        else if (teamSize <= 3) { setKitchen(1); setFloor(teamSize - 1); }
        else {
            const k = Math.floor(teamSize * 0.4);
            const b = Math.floor(teamSize * 0.2);
            setKitchen(k);
            setBar(b);
            setFloor(teamSize - k - b);
        }
    }, [teamSize]);

    const totalAssigned = kitchen + floor + bar;
    const remaining = teamSize - totalAssigned;
    const isValid = totalAssigned === teamSize;

    const handleNext = () => {
        setStaffDistribution({ kitchen, floor, bar });

        try {
            // Save distribution to generic data bucket
            engine.updateSession(s => {
                s.data.staff = {
                    totalCount: teamSize,
                    kitchen,
                    floor,
                    bar
                };

                // Assume automation is desired
                s.data.tasks = { enabled: true, mode: 'AUTOPILOT' };
            });

            refresh();
            navigate('/start/cinematic/4'); // Go to Menu (Beverages)
        } catch (e) {
            console.error("Error saving distribution:", e);
        }
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-start pt-12 px-6 max-w-3xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                        Distribuição da Equipa
                    </h1>
                    <p className="text-neutral-400 text-lg">
                        Tens <strong>{teamSize} pessoas</strong>. Onde é que elas trabalham?
                    </p>
                </motion.div>

                <div className="w-full space-y-8 bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800">
                    <StaffSlider
                        label="Cozinha"
                        icon="🍳"
                        value={kitchen}
                        onChange={setKitchen}
                        max={teamSize}
                    />

                    <StaffSlider
                        label="Sala / Atendimento"
                        icon="👋"
                        value={floor}
                        onChange={setFloor}
                        max={teamSize}
                    />

                    <StaffSlider
                        label="Bar"
                        icon="🍹"
                        value={bar}
                        onChange={setBar}
                        max={teamSize}
                    />
                </div>

                <div className="mt-8 text-center h-12">
                    {!isValid && (
                        <p className="text-red-400">
                            {remaining > 0
                                ? `Ainda tens ${remaining} pessoas por atribuir.`
                                : `Atribuíste pessoas a mais (${Math.abs(remaining)}).`}
                        </p>
                    )}
                </div>

                {isValid && (
                    <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 px-6">
                        <div className="w-full max-w-sm shadow-2xl">
                            <PulseButton onClick={handleNext}>Continuar 👉</PulseButton>
                        </div>
                    </div>
                )}
            </div>
        </CinemaLayout>
    );
};

// Sub-component for Slider
const StaffSlider = ({ label, icon, value, onChange, max }: any) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
                <span className="text-white font-medium flex items-center gap-2">
                    <span className="text-2xl">{icon}</span> {label}
                </span>
                <span className="text-gold-500 font-bold text-2xl">{value}</span>
            </div>
            <input
                type="range"
                min="0"
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
            />
        </div>
    );
};
