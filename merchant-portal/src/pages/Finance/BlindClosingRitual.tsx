import React, { useState } from 'react';
import type { CashSession, BlindCount } from '../../core/finance/FinanceTypes';
// import { validateBlindCount } from '../../core/finance/FinanceReflex';

// 🛡️ THE BLIND COUNT RITUAL
// "You tell me what you have. Then I tell you what exists."

interface Props {
    session: CashSession;
    onCommit: (count: BlindCount) => void;
    onCancel: () => void;
}

export const BlindClosingRitual: React.FC<Props> = ({ session, onCommit, onCancel }) => {
    // OBSERVATION: We DO NOT show session.computedClosingCents here.
    // That would pollute the user's perception of reality.

    const [step, setStep] = useState<'count' | 'verify'>('count');

    // State for physical inputs
    const [bills, setBills] = useState<Record<string, number>>({});
    const [coins, setCoins] = useState<Record<string, number>>({});
    const [extraCents, setExtraCents] = useState<number>(0);
    void setExtraCents; // Silence unused

    // CURRENCY CONFIG (EUR)
    const BILL_DENOMINATIONS = [50000, 20000, 10000, 5000, 2000, 1000, 500]; // 500€ to 5€ (in cents)
    const COIN_DENOMINATIONS = [200, 100, 50, 20, 10, 5, 2, 1]; // 2€ to 1c

    const formatMoney = (cents: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    const calculateTotal = () => {
        let total = extraCents;
        Object.entries(bills).forEach(([denom, count]) => total += parseInt(denom) * count);
        Object.entries(coins).forEach(([denom, count]) => total += parseInt(denom) * count);
        return total;
    };

    const handleBillChange = (denom: number, delta: number) => {
        setBills(prev => ({
            ...prev,
            [denom]: Math.max(0, (prev[denom] || 0) + delta)
        }));
    };

    const handleCoinChange = (denom: number, delta: number) => {
        setCoins(prev => ({
            ...prev,
            [denom]: Math.max(0, (prev[denom] || 0) + delta)
        }));
    };

    const handleCommit = () => {
        const finalCount: BlindCount = {
            sessionId: session.id,
            timestamp: Date.now(),
            bills,
            coins,
            totalDeclaredCents: calculateTotal()
        };
        onCommit(finalCount);
    };

    if (step === 'verify') {
        const total = calculateTotal();
        return (
            <div className="fixed inset-0 bg-black/95 text-white flex items-center justify-center p-4 z-50">
                <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-700 p-8 text-center">
                    <div className="text-4xl mb-4">🔐</div>
                    <h2 className="text-xl font-bold mb-2">Confirmar Realidade Física?</h2>
                    <p className="text-gray-400 mb-8">
                        Você declarou ter em caixa:
                    </p>

                    <div className="text-5xl font-bold text-white mb-8 tracking-tighter">
                        {formatMoney(total)}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep('count')}
                            className="flex-1 py-4 rounded-xl font-bold border border-gray-600 hover:bg-gray-800"
                        >
                            Recontar
                        </button>
                        <button
                            onClick={handleCommit}
                            className="flex-1 py-4 rounded-xl font-bold bg-white text-black hover:bg-gray-200"
                        >
                            Assinar Declaração
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 text-white flex flex-col z-50 overflow-hidden">
            {/* HEADER */}
            <div className="p-6 flex justify-between items-center border-b border-gray-800">
                <h2 className="text-xl font-bold text-gray-400">FECHAMENTO CEGO</h2>
                <div className="text-2xl font-bold text-blue-400">
                    {formatMoney(calculateTotal())}
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">

                {/* NOTAS */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Notas</h3>
                    {BILL_DENOMINATIONS.map(denom => (
                        <div key={denom} className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <div className="text-xl font-mono text-gray-300">{formatMoney(denom)}</div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => handleBillChange(denom, -1)} className="w-10 h-10 rounded-full bg-gray-700 hover:bg-red-900/50 text-xl font-bold">-</button>
                                <span className="w-8 text-center text-xl font-bold">{bills[denom] || 0}</span>
                                <button onClick={() => handleBillChange(denom, 1)} className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-xl font-bold">+</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* MOEDAS */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Moedas</h3>
                    {COIN_DENOMINATIONS.map(denom => (
                        <div key={denom} className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <div className="text-xl font-mono text-gray-300">{formatMoney(denom)}</div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => handleCoinChange(denom, -1)} className="w-10 h-10 rounded-full bg-gray-700 hover:bg-red-900/50 text-xl font-bold">-</button>
                                <span className="w-8 text-center text-xl font-bold">{coins[denom] || 0}</span>
                                <button onClick={() => handleCoinChange(denom, 1)} className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-xl font-bold">+</button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-6 border-t border-gray-800 flex justify-end gap-4 bg-black">
                <button
                    onClick={onCancel}
                    className="px-8 py-4 rounded-xl font-bold text-gray-500 hover:text-white"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => setStep('verify')}
                    className="px-8 py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                >
                    Revisar Contagem
                </button>
            </div>
        </div>
    );
};
