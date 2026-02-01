import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinemaLayout } from '../CinemaLayout';
import { PulseButton } from '../components/PulseButton';
import { BEVERAGE_TEMPLATES, BRAND_GROUPS } from '../data/beverageTemplates';
import { useOnboardingEngine } from '../context/OnboardingEngineProvider';
import { useProducts } from '../context/ProductContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Scene4Beverages: React.FC = () => {
    const navigate = useNavigate();

    // Connect to Brains
    const { engine } = useOnboardingEngine();
    // Valid BusinessType from Contract
    const businessType = engine.getSession().businessType;

    // Local UI State for Brand (since it's transient before commit)
    const [brandGroup, setBrandGroup] = useState<'coca' | 'pepsi'>('coca'); // Default

    const { addProduct, getMenu, lastError, clearLastError } = useProducts();

    // State for Selected Item IDs { 'coca': true, 'water_s': true ... }
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

    // Initialize selections on mount or when brand changes
    useEffect(() => {
        const newSelections = { ...selectedItems };

        // 1. Get the current brand's items
        const brandItems = (BRAND_GROUPS as any)[brandGroup].items;

        // 2. Select default items from this brand
        brandItems.forEach((item: any) => {
            if (newSelections[item.id] === undefined) {
                newSelections[item.id] = item.selected;
            }
        });

        // 3. Ensure other categories are initialized if empty
        Object.values(BEVERAGE_TEMPLATES).forEach((category: any) => {
            if (category.id !== 'soft') {
                category.items.forEach((item: any) => {
                    if (newSelections[item.id] === undefined) {
                        newSelections[item.id] = item.selected;
                    }
                });
            }
        });

        setSelectedItems(newSelections);
    }, [brandGroup]);

    const toggleItem = (id: string) => {
        setSelectedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // LOGIC: SORT CATEGORIES BASED ON BUSINESS TYPE
    // Helper to get categories in display order
    const getSortedCategories = () => {
        const cats = Object.values(BEVERAGE_TEMPLATES).map(cat => {
            if (cat.id === 'soft') {
                return {
                    ...cat,
                    items: (BRAND_GROUPS as any)[brandGroup].items
                };
            }
            return cat;
        });

        // The Brain Logic 🧠
        let result = cats;
        if (businessType === 'cafe' || businessType === 'bakery') {
            result = [
                cats.find(c => c.id === 'coffee'),
                cats.find(c => c.id === 'water'),
                cats.find(c => c.id === 'soft'),
                cats.find(c => c.id === 'beer'),
            ].filter(Boolean) as any[];
        } else if (businessType === 'bar' || businessType === 'club') {
            result = [
                cats.find(c => c.id === 'beer'),
                cats.find(c => c.id === 'soft'),
                cats.find(c => c.id === 'water'),
                cats.find(c => c.id === 'coffee'),
            ].filter(Boolean) as any[];
        }

        return result as any[];
    };

    const categories = getSortedCategories();

    // Count *active* items only
    const visibleIds = new Set(categories.flatMap(c => c.items.map((i: any) => i.id)));
    const totalSelected = Object.keys(selectedItems).filter(id => selectedItems[id] && visibleIds.has(id)).length;

    const handleNext = () => {
        // COMMIT TO LIVING MENU (The Memory) 🧠

        const existingIds = new Set(getMenu().map(p => p.id));
        const drinkTemplateIds: string[] = [];

        categories.forEach(cat => {
            cat.items.forEach((item: any) => {
                // If selected and visible and not already executed
                if (selectedItems[item.id] && visibleIds.has(item.id)) {
                    drinkTemplateIds.push(item.id);
                    if (!existingIds.has(item.id)) {
                        addProduct({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            category: 'drinks',
                            origin: 'autopilot',
                            status: 'permanent',
                            brand: item.isBranded ? brandGroup : undefined
                        });
                    }
                }
            });
        });

        // Pass the IDs to Scene 5 to fulfill Contract 4
        navigate('/start/cinematic/5', { state: { drinkTemplates: drinkTemplateIds } });
    };

    return (
        <CinemaLayout>
            <div className="flex-1 flex flex-col items-center justify-start pt-16 px-6 relative z-20 w-full max-w-4xl mx-auto h-full overflow-y-auto pb-32">

                {lastError && (
                    <div role="alert" className="mb-4 p-4 bg-red-900/80 text-white rounded-lg flex justify-between items-center">
                        <span>{lastError}</span>
                        <button type="button" onClick={clearLastError} className="text-sm underline">Fechar</button>
                    </div>
                )}
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">Bebidas & Marcas</h1>
                    <p className="text-neutral-400 text-lg">Escolhe o teu parceiro principal.</p>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    {categories.map((category: any, idx) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-gold-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                    {category.id === 'soft' && '🥤'}
                                    {category.id === 'water' && '💧'}
                                    {category.id === 'beer' && '🍺'}
                                    {category.id === 'coffee' && '☕'}
                                    {category.label}
                                </h3>

                                {/* BRAND TOGGLE (Only for Soft Drinks) */}
                                {category.isBranded && (
                                    <div className="flex bg-neutral-800 rounded-lg p-1 gap-1">
                                        <button
                                            onClick={() => setBrandGroup('coca')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${brandGroup === 'coca' ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                                        >
                                            Coca-Cola
                                        </button>
                                        <button
                                            onClick={() => setBrandGroup('pepsi')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${brandGroup === 'pepsi' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                                        >
                                            Pepsi
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={brandGroup} // Force re-render animation when brand changes
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {category.items.map((item: any) => (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleItem(item.id)}
                                                className="flex items-center justify-between cursor-pointer group mb-3 last:mb-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                                                        ${selectedItems[item.id] ? 'bg-green-500 border-green-500' : 'border-neutral-600 group-hover:border-neutral-500'}
                                                    `}>
                                                        {selectedItems[item.id] && <span className="text-black text-[10px] font-bold">✓</span>}
                                                    </div>
                                                    <span className={`text-sm ${selectedItems[item.id] ? 'text-white' : 'text-neutral-500'}`}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                                {selectedItems[item.id] && (
                                                    <span className="text-xs text-neutral-600 font-mono">€{item.price}</span>
                                                )}
                                            </div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Floating CTA */}
                <motion.div
                    className="fixed bottom-10 left-0 right-0 flex justify-center z-50 px-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="w-full max-w-sm shadow-2xl">
                        <PulseButton onClick={handleNext}>
                            Confirmar {totalSelected} Bebidas ✅
                        </PulseButton>
                        <p className="text-center text-xs text-neutral-500 mt-3">
                            Podes editar preços e nomes depois.
                        </p>
                    </div>
                </motion.div>

            </div>
        </CinemaLayout>
    );
};
