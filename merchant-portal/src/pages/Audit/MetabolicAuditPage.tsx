import React, { useEffect, useMemo, useState } from 'react';
import { MetabolicAudit, type MetabolicAuditEntry } from '../../intelligence/nervous-system/MetabolicAudit';
import { SystemEvents } from '../../core/events/SystemEvents';

// ------------------------------------------------------------------
// 🧾 METABOLIC AUDIT VIEWER (Read-only)
// "The owner can literally see the heart beating."
// ------------------------------------------------------------------

const fmt = (ts: number) => {
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return String(ts);
    }
};

export const MetabolicAuditPage: React.FC = () => {
    const [entries, setEntries] = useState<MetabolicAuditEntry[]>(() => MetabolicAudit.read());
    const [q, setQ] = useState('');

    useEffect(() => {
        // bootstrap refresh (in case other tabs wrote)
        const sync = () => setEntries(MetabolicAudit.read());
        sync();

        const onAudit = () => sync();
        SystemEvents.on('metabolic:audit', onAudit);

        const onStorage = (e: StorageEvent) => {
            if (e.key && e.key.includes('chef.metabolic.audit')) sync();
        };
        window.addEventListener('storage', onStorage);

        return () => {
            SystemEvents.off('metabolic:audit', onAudit);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return [...entries].reverse();
        return [...entries]
            .reverse()
            .filter(e => {
                const blob = `${e.type} ${e.pulseId} ${e.tickRate} ${e.note ?? ''} ${e.timestamp}`.toLowerCase();
                return blob.includes(term);
            });
    }, [entries, q]);

    const downloadJson = () => {
        const json = JSON.stringify(entries, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metabolic_audit_${Date.now()}.json`;
        a.click();
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">Metabolic Audit</h1>
                    <p className="text-sm opacity-70">
                        Ring buffer local (últimos {entries.length} batimentos). Read-only.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="px-3 py-2 rounded-md border"
                        onClick={() => setEntries(MetabolicAudit.read())}
                        title="Reload from localStorage"
                    >

                        Recarregar
                    </button>
                    <button
                        className="px-3 py-2 rounded-md border bg-white/5 hover:bg-white/10"
                        onClick={downloadJson}
                        title="Export Evidence (JSON)"
                    >
                        Export JSON
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                    className="w-full sm:max-w-md px-3 py-2 rounded-md border bg-transparent"
                    placeholder="Filtrar: pulseId, note, tickRate..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
                <div className="text-sm opacity-70">
                    Mostrando: <span className="font-medium">{filtered.length}</span>
                </div>
            </div>

            <div className="rounded-xl border overflow-hidden">
                <div className="grid grid-cols-12 text-xs uppercase tracking-wide opacity-70 px-3 py-2 border-b">
                    <div className="col-span-4">Timestamp</div>
                    <div className="col-span-4">Pulse</div>
                    <div className="col-span-2">Tick</div>
                    <div className="col-span-2">Note</div>
                </div>

                <div className="max-h-[70vh] overflow-auto">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-sm opacity-70">Nenhuma entrada.</div>
                    ) : (
                        filtered.map((e, idx) => (
                            <div
                                key={`${e.pulseId}_${e.timestamp}_${idx}`}
                                className="grid grid-cols-12 px-3 py-2 border-b text-sm"
                            >
                                <div className="col-span-4 font-mono">{fmt(e.timestamp)}</div>
                                <div className="col-span-4 font-mono">{e.pulseId}</div>
                                <div className="col-span-2 font-mono">{e.tickRate}ms</div>
                                <div className="col-span-2">{e.note ?? ''}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
