
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { ToggleCard } from '../components/ToggleCard';
import { EstimateSelector } from '../components/EstimateSelector';
import { motion } from 'framer-motion';

export const Scene3Skeleton: React.FC = () => {
    const navigate = useNavigate();

    // State Management
    const [profile, setProfile] = useState({
        drinks: {
            soft: true, // Default Locked
            water: true, // Default Locked
            sparkling: true, // Default Locked
            coffee: { enabled: false, count: '5-8' },
            juice: { enabled: false, count: '2-4' }
        },
        alcohol: {
            beer: { enabled: false, count: '5-8' },
            wine: { enabled: false, count: '9+' },
            cocktails: { enabled: false, count: '5-8' }
        },
        food: {
            mains: { enabled: false, count: '9+' },
            snacks: { enabled: false, count: '5-8' },
            dessert: { enabled: false, count: '2-4' }
        }
    });

    // Helpers to toggle state safely
    const toggleNested = (category: 'drinks' | 'alcohol' | 'food', key: string) => {
        setProfile(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                // @ts-ignore
                [key]: {
                    // @ts-ignore
                    ...prev[category][key],
                    // @ts-ignore
                    enabled: !prev[category][key].enabled
                }
            }
        }));
    };

    const setEstimate = (category: 'drinks' | 'alcohol' | 'food', key: string, val: string) => {
        setProfile(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                // @ts-ignore
                [key]: {
                    // @ts-ignore
                    ...prev[category][key],
                    count: val
                }
            }
        }));
    };

    const hasSelections =
        profile.drinks.coffee.enabled || profile.drinks.juice.enabled ||
        profile.alcohol.beer.enabled || profile.alcohol.wine.enabled || profile.alcohol.cocktails.enabled ||
        profile.food.mains.enabled || profile.food.snacks.enabled || profile.food.dessert.enabled;

    const handleNext = () => {
        // Here we would save the profile to context/localstorage

        navigate('/start/cinematic/4'); // Navigation to the "First Plate" scene (Renamed)
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-start pt-20 px-6 relative z-20 w-full max-w-5xl mx-auto h-full overflow-y-auto pb-32">

                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">O que as pessoas podem pedir?</h1>
                    <p className="text-neutral-400 text-lg">Seleciona o que se aplica. Já começamos por ti.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">

                    {/* COLUMN 1: DRINKS (ESSENTIALS) */}
                    <div className="space-y-4">
                        <h3 className="text-gold-400 font-bold uppercase tracking-wider text-sm mb-2">Bebidas (Base)</h3>

                        {/* Locked Defaults */}
                        <div className="grid grid-cols-1 gap-2">
                            <ToggleCard label="Refrigerantes" sublabel="Coca-Cola, Fanta, Sprite..." isLocked isSelected />
                            <ToggleCard label="Água" sublabel="Natural e Com Gás" isLocked isSelected />
                        </div>

                        <div className="h-px bg-white/10 my-4" />

                        {/* Toggles */}
                        <ToggleCard
                            label="Café & Chá"
                            icon="☕"
                            isSelected={profile.drinks.coffee.enabled}
                            onClick={() => toggleNested('drinks', 'coffee')}
                        />
                        {profile.drinks.coffee.enabled && (
                            <EstimateSelector
                                options={['2-4', '5-8', '9+']}
                                value={profile.drinks.coffee.count}
                                onChange={(v) => setEstimate('drinks', 'coffee', v)}
                            />
                        )}

                        <ToggleCard
                            label="Sumos / Sucos"
                            icon="🧃"
                            isSelected={profile.drinks.juice.enabled}
                            onClick={() => toggleNested('drinks', 'juice')}
                        />
                        {profile.drinks.juice.enabled && (
                            <EstimateSelector
                                options={['2-4', '5-8', '9+']}
                                value={profile.drinks.juice.count}
                                onChange={(v) => setEstimate('drinks', 'juice', v)}
                            />
                        )}
                    </div>

                    {/* COLUMN 2: ALCOHOL */}
                    <div className="space-y-4">
                        <h3 className="text-purple-400 font-bold uppercase tracking-wider text-sm mb-2">Álcool</h3>

                        <ToggleCard
                            label="Cervejas"
                            icon="🍺"
                            isSelected={profile.alcohol.beer.enabled}
                            onClick={() => toggleNested('alcohol', 'beer')}
                        />
                        {profile.alcohol.beer.enabled && (
                            <EstimateSelector
                                options={['2-4', '5-8', '9+']}
                                value={profile.alcohol.beer.count}
                                onChange={(v) => setEstimate('alcohol', 'beer', v)}
                            />
                        )}

                        <ToggleCard
                            label="Vinhos"
                            icon="🍷"
                            isSelected={profile.alcohol.wine.enabled}
                            onClick={() => toggleNested('alcohol', 'wine')}
                        />
                        {profile.alcohol.wine.enabled && (
                            <EstimateSelector
                                options={['Cartas Pequenas', 'Cartas Grandes']}
                                value={profile.alcohol.wine.count}
                                onChange={(v) => setEstimate('alcohol', 'wine', v)}
                            />
                        )}

                        <ToggleCard
                            label="Cocktails / Destilados"
                            icon="🍸"
                            isSelected={profile.alcohol.cocktails.enabled}
                            onClick={() => toggleNested('alcohol', 'cocktails')}
                        />
                        {profile.alcohol.cocktails.enabled && (
                            <EstimateSelector
                                options={['Clássicos', 'Menu Completo']}
                                value={profile.alcohol.cocktails.count}
                                onChange={(v) => setEstimate('alcohol', 'cocktails', v)}
                            />
                        )}
                    </div>

                    {/* COLUMN 3: FOOD */}
                    <div className="space-y-4">
                        <h3 className="text-orange-400 font-bold uppercase tracking-wider text-sm mb-2">Comida</h3>

                        <ToggleCard
                            label="Pratos Principais"
                            icon="🍽️"
                            isSelected={profile.food.mains.enabled}
                            onClick={() => toggleNested('food', 'mains')}
                        />
                        {profile.food.mains.enabled && (
                            <EstimateSelector
                                options={['2-4', '5-10', '10+']}
                                value={profile.food.mains.count}
                                onChange={(v) => setEstimate('food', 'mains', v)}
                            />
                        )}

                        <ToggleCard
                            label="Petiscos / Tapas"
                            icon="🍟"
                            isSelected={profile.food.snacks.enabled}
                            onClick={() => toggleNested('food', 'snacks')}
                        />
                        {profile.food.snacks.enabled && (
                            <EstimateSelector
                                options={['2-4', '5-8', '9+']}
                                value={profile.food.snacks.count}
                                onChange={(v) => setEstimate('food', 'snacks', v)}
                            />
                        )}

                        <ToggleCard
                            label="Sobremesas"
                            icon="🍰"
                            isSelected={profile.food.dessert.enabled}
                            onClick={() => toggleNested('food', 'dessert')}
                        />
                        {profile.food.dessert.enabled && (
                            <EstimateSelector
                                options={['2-4', '5-8']}
                                value={profile.food.dessert.count}
                                onChange={(v) => setEstimate('food', 'dessert', v)}
                            />
                        )}
                    </div>

                </div>

                {/* Floating CTA */}
                <motion.div
                    className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: hasSelections ? 1 : 0, y: hasSelections ? 0 : 20 }}
                >
                    <div className="w-full max-w-xs pointer-events-auto shadow-2xl">
                        <PulseButton onClick={handleNext}>
                            Continuar 👉
                        </PulseButton>
                    </div>
                </motion.div>

            </div>
        </CinemaLayout>
    );
};
