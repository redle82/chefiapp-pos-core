import React from 'react';
import type { CashSession } from '../../core/finance/FinanceTypes';

// 👑 OWNER VIEW: FINANCIAL RECONCILIATION
// "The Z Report that tells the truth."

interface Props {
    session: CashSession; // The Session being audited
    userName: string;
}

export const FinancialReconciliation: React.FC<Props> = ({ session, userName }) => {
    const formatMoney = (cents: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    const divergence = session.divergenceCents || 0;
    const isPerfect = divergence === 0;
    const isSurplus = divergence > 0;
    const isLeak = divergence < 0;

    return (
        <div className="bg-black text-white p-8 rounded-2xl max-w-3xl mx-auto font-mono">
            {/* HEADER */}
            <div className="flex justify-between items-end border-b border-gray-800 pb-6 mb-8">
                <div>
                    <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Protocolo H3 • Auditoria</div>
                    <h1 className="text-2xl font-bold text-white">Sessão #{session.id.slice(-6)}</h1>
                    <div className="text-sm text-gray-400 mt-1">Responsável: {userName} • Terminal: {session.terminalId}</div>
                </div>
                <div className="text-right">
                    <div className={`text-4xl font-bold ${isPerfect ? 'text-green-500' : isLeak ? 'text-red-500' : 'text-yellow-500'}`}>
                        {isPerfect ? '100% BLINDADO' : isLeak ? 'QUEBRA' : 'SOBRA'}
                    </div>
                </div>
            </div>

            {/* THE TRINITY OF TRUTHS */}
            <div className="grid grid-cols-3 gap-8 mb-12">
                {/* 1. NARRATIVE TRUTH */}
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 opacity-70">
                    <div className="text-xs text-gray-500 uppercase mb-2">Narrativa (Sistema)</div>
                    <div className="text-2xl font-bold">{formatMoney(session.computedClosingCents)}</div>
                    <div className="text-xs text-gray-600 mt-2">O que deveria estar lá.</div>
                </div>

                {/* 2. PHYSICAL TRUTH */}
                <div className="p-6 bg-gray-800 rounded-xl border border-gray-600 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">👁️</div>
                    <div className="text-xs text-gray-400 uppercase mb-2">Realidade (Físico)</div>
                    <div className="text-3xl font-bold text-white">{formatMoney(session.declaredClosingCents || 0)}</div>
                    <div className="text-xs text-gray-400 mt-2">O que foi contado (Blind).</div>
                </div>

                {/* 3. IMMUNOLOGICAL TRUTH */}
                <div className={`p-6 rounded-xl border ${isLeak ? 'bg-red-900/20 border-red-500' : isSurplus ? 'bg-yellow-900/20 border-yellow-500' : 'bg-green-900/20 border-green-500'}`}>
                    <div className={`text-xs uppercase mb-2 ${isLeak ? 'text-red-400' : isSurplus ? 'text-yellow-400' : 'text-green-400'}`}>
                        Imunidade (Divergência)
                    </div>
                    <div className={`text-3xl font-bold ${isLeak ? 'text-red-400' : isSurplus ? 'text-yellow-400' : 'text-green-400'}`}>
                        {divergence > 0 ? '+' : ''}{formatMoney(divergence)}
                    </div>
                    <div className="text-xs opacity-75 mt-2">
                        {isLeak ? 'Dinheiro sumiu. Investigar.' : isSurplus ? 'Dinheiro extra. Venda não lançada?' : 'Perfeição Operacional.'}
                    </div>
                </div>
            </div>

            {/* AUDIT TRAIL (Governance) */}
            <div className="border-t border-gray-800 pt-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Governança (Eventos de Saída)</h3>
                {/* This would map over TransactionEvents filtered by refunds/voids */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 bg-gray-900 rounded border border-gray-800">
                        <span className="text-red-400">[VOID] Mesa 04</span>
                        <span className="text-gray-400">Motivo: <span className="text-white">Erro Cozinha (Queimado)</span></span>
                        <span className="font-mono text-red-400">-€ 12,50</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-gray-900 rounded border border-gray-800">
                        <span className="text-yellow-400">[REFUND] Balcão</span>
                        <span className="text-gray-400">Motivo: <span className="text-white">Cliente Mudou Ideia</span></span>
                        <span className="font-mono text-yellow-400">-€ 4,50</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-600">
                Imunidade Financeira Ativa • Protocolo H3
            </div>
        </div>
    );
};
