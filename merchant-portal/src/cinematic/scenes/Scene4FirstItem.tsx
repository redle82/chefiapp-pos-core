
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { InputGiant } from '../components/InputGiant';
import { MoneyInput } from '../components/MoneyInput';
import { DishCard } from '../components/DishCard';
import { PulseButton } from '../components/PulseButton';
import { motion, AnimatePresence } from 'framer-motion';

export const Scene4FirstItem: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'name' | 'price'>('name');
    const [dishName, setDishName] = useState('');
    const [price, setPrice] = useState('');

    const handleNext = () => {
        if (step === 'name' && dishName.length > 2) {
            setStep('price');
        } else if (step === 'price' && price && parseFloat(price) > 0) {
            // Logic to save dish would go here
            navigate('/start/cinematic/5');
        }
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-20 w-full max-w-4xl mx-auto h-full gap-8">

                {/* Step 1: Dish Name */}
                <AnimatePresence mode="wait">
                    {step === 'name' && (
                        <motion.div
                            key="step-name"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="w-full flex flex-col items-center"
                        >
                            <InputGiant
                                label="Qual é o prato que paga as contas?"
                                placeholder="Ex: Burger Chef"
                                value={dishName}
                                onChange={(e) => setDishName(e.target.value)}
                            />
                        </motion.div>
                    )}

                    {/* Step 2: Price */}
                    {step === 'price' && (
                        <motion.div
                            key="step-price"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="w-full flex flex-col items-center"
                        >
                            <h3 className="text-neutral-400 text-xl font-medium mb-8">Quanto vale essa obra de arte?</h3>
                            <MoneyInput
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                autoFocus
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Realtime Visual Result */}
                <div className="mt-8">
                    <DishCard name={dishName} price={price} />
                </div>

                {/* Controls */}
                <motion.div
                    className="mt-auto mb-12 w-full max-w-xs"
                    animate={{ opacity: (step === 'name' && dishName.length > 2) || (step === 'price' && price) ? 1 : 0.5 }}
                >
                    <PulseButton
                        onClick={handleNext}
                        disabled={step === 'name' ? dishName.length <= 2 : !price}
                    >
                        {step === 'name' ? 'Próximo 👉' : 'Adicionar ao Menu 🔥'}
                    </PulseButton>
                </motion.div>

            </div>
        </CinemaLayout>
    );
};
