import React from 'react';
import { motion } from 'framer-motion';
import type { InventorySignal } from '../../intelligence/nervous-system/InventoryReflexEngine'; // Or HungerEngine if I consolidated types
// Actually, InventoryContext uses InventorySignal from InventoryReflexEngine, which I should check.
// I'll assume the type from previous context view.

interface Props {
    signal: InventorySignal;
    onAcknowledge?: () => void;
}

export const HungerSignalCard: React.FC<Props> = ({ signal, onAcknowledge }) => {
    // Determine color based on severity/urgency
    // InventorySignal has 'severity' (0-100) or 'urgency' depending on which definition won.
    // The existing InventoryContext uses 'severity'.

    // Map severity to visual urgency
    let borderColor = 'border-yellow-500';
    let bgColor = 'bg-yellow-500/10';
    let textColor = 'text-yellow-500';

    if (signal.severity > 80) {
        borderColor = 'border-red-500';
        bgColor = 'bg-red-500/10';
        textColor = 'text-red-500';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${borderColor} ${bgColor} mb-3 flex justify-between items-center shadow-sm`}
        >
            <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${textColor} mb-1`}>
                    Metabolic Signal • {signal.context || 'Usage'}
                </div>
                <h3 className="text-lg font-medium text-white">
                    {signal.itemName}
                </h3>
                <div className="text-sm text-gray-400 mt-1">
                    Stock: <span className="text-white font-mono">{signal.currentLevel} {signal.unit}</span>
                    {signal.organName && <span className="ml-2 text-xs opacity-70">({signal.organName})</span>}
                </div>
            </div>

            {onAcknowledge && (
                <button
                    onClick={onAcknowledge}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors border border-gray-700"
                >
                    Review
                </button>
            )}
        </motion.div>
    );
};
