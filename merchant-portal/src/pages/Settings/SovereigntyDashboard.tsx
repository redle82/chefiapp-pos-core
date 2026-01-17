import React, { useEffect, useState, useCallback } from 'react';
import { SovereigntyService, type SovereigntyMetrics, type ReconciliationJob } from '../../core/governance/SovereigntyService';
import { useSupabaseAuth } from '../../core/auth/useSupabaseAuth';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';
import { Logger } from '../../core/logger';

// --- STYLES (Inline for simplicity, should be moved to CSS/Tailwind) ---
const styles = {
    container: 'p-6 max-w-7xl mx-auto space-y-8',
    header: 'flex justify-between items-center mb-6',
    title: 'text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent',
    grid: 'grid grid-cols-1 md:grid-cols-4 gap-6',
    card: 'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700',
    metricTitle: 'text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide',
    metricValue: 'text-3xl font-bold mt-2 text-gray-900 dark:text-gray-100',
    statusBadge: (status: string) => {
        const colors: any = {
            'CLEAN': 'bg-green-100 text-green-800',
            'DIRTY': 'bg-yellow-100 text-yellow-800',
            'QUARANTINED': 'bg-red-100 text-red-800',
            'PENDING': 'bg-blue-100 text-blue-800',
            'PROCESSING': 'bg-purple-100 text-purple-800',
            'RESOLVED': 'bg-green-100 text-green-800',
            'FAILED': 'bg-orange-100 text-orange-800',
            'DEAD': 'bg-red-900 text-white',
        };
        return `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`;
    }
};

export function SovereigntyDashboard() {
    const { user } = useSupabaseAuth();
    const { identity } = useRestaurantIdentity();
    const restaurantId = identity.id;
    const [metrics, setMetrics] = useState<SovereigntyMetrics | null>(null);
    const [jobs, setJobs] = useState<ReconciliationJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [healing, setHealing] = useState(false);

    const loadData = useCallback(async () => {
        if (!restaurantId) return;
        try {
            const [m, q] = await Promise.all([
                SovereigntyService.getMetrics(restaurantId),
                SovereigntyService.getQueue(restaurantId)
            ]);
            setMetrics(m);
            setJobs(q);
        } catch (err) {
            Logger.error('Failed to load Sovereignty Dashboard', err);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        loadData();
        // Live poll every 5s for dramatic dashboard effect
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleHeal = async () => {
        setHealing(true);
        try {
            await SovereigntyService.triggerHealer();
            await loadData();
            alert('Healing Ritual Complete. The System is cleaner.');
        } catch (err) {
            alert('Healer Function Failed. Check Logs.');
        } finally {
            setHealing(false);
        }
    };

    if (loading && !metrics) return <div className="p-8 text-center">Loading Constitutional Data...</div>;

    const healthScore = metrics ?
        (100 - (metrics.dirtyCount * 10) - (metrics.quarantinedCount * 50) - (metrics.queue.dead * 20)) : 100;

    // Normalize score
    const safeScore = Math.max(0, healthScore);
    const healthColor = safeScore > 90 ? 'text-green-500' : safeScore > 70 ? 'text-yellow-500' : 'text-red-600';

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Sovereignty Health</h1>
                    <p className="text-gray-500">Domain Write Authority Monitor</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <div className="text-xs uppercase text-gray-400">System Integrity</div>
                        <div className={`text-2xl font-black ${healthColor}`}>{safeScore}%</div>
                    </div>
                </div>
            </div>

            {/* METRICS ROW */}
            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.metricTitle}>Dirty Entities</div>
                    <div className={styles.metricValue}>
                        <span className={metrics?.dirtyCount === 0 ? 'text-green-500' : 'text-yellow-500'}>
                            {metrics?.dirtyCount}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Rows pending reconciliation</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.metricTitle}>Quarantined</div>
                    <div className={styles.metricValue}>
                        <span className={metrics?.quarantinedCount === 0 ? 'text-green-500' : 'text-red-600'}>
                            {metrics?.quarantinedCount}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Unrecoverable (Zombie) State</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.metricTitle}>Active Queue</div>
                    <div className={styles.metricValue}>
                        {metrics?.queue.pending! + metrics?.queue.processing!}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Jobs waiting for Healer</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.metricTitle}>Healer Status</div>
                    <button
                        onClick={handleHeal}
                        disabled={healing}
                        className={`mt-2 w-full py-2 px-4 rounded-lg font-bold text-white transition-all
                            ${healing ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-purple-500/30'}
                        `}
                    >
                        {healing ? 'Healing...' : 'INVOKE HEALER'}
                    </button>
                    <p className="text-xs text-gray-400 mt-2 text-center">Triggers Edge Function</p>
                </div>
            </div>

            {/* QUEUE TABLE */}
            <div className={`${styles.card} overflow-hidden`}>
                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Reconciliation Log</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700">
                                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Entity</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Attempts</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Last Error</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => (
                                <tr key={job.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3">
                                        <span className={styles.statusBadge(job.status)}>{job.status}</span>
                                    </td>
                                    <td className="p-3 font-mono text-sm text-gray-600 dark:text-gray-300">
                                        {job.entity_type}:{job.entity_id.split('-')[0]}...
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{job.reason}</td>
                                    <td className="p-3 text-sm">
                                        {job.attempts} / {job.max_attempts}
                                    </td>
                                    <td className="p-3 text-sm text-red-500 max-w-xs truncate" title={job.last_error}>
                                        {job.last_error || '-'}
                                    </td>
                                    <td className="p-3 text-xs text-gray-400 text-right whitespace-nowrap">
                                        {new Date(job.created_at).toLocaleTimeString()}
                                    </td>
                                </tr>
                            ))}
                            {jobs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">
                                        No active reconciliation jobs. The system is pure.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
