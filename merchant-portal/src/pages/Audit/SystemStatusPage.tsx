import { useEffect, useState } from 'react';
import { supabase } from '../../core/supabase';
import { useTenant } from '../../core/tenant/TenantContext';

export function SystemStatusPage() {
    const { restaurant } = useTenant();
    const [appLogs, setAppLogs] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [performanceLogs, setPerformanceLogs] = useState<any[]>([]);
    const [feedbackLogs, setFeedbackLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'app' | 'audit' | 'perf' | 'feedback'>('app');

    useEffect(() => {
        if (restaurant?.id) {
            fetchLogs();
        }
    }, [restaurant?.id]);

    const fetchLogs = async () => {
        if (!restaurant?.id) return;
        setLoading(true);

        try {
            // Fetch app_logs (frontend logs - warn/error)
            const { data: appData } = await supabase
                .from('app_logs')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .neq('message', 'Performance Heartbeat') // Exclude heartbeats from main log view
                .order('created_at', { ascending: false })
                .limit(50);

            if (appData) setAppLogs(appData);

            // Fetch performance heartbeats
            const { data: perfData } = await supabase
                .from('app_logs')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('message', 'Performance Heartbeat')
                .order('created_at', { ascending: false })
                .limit(20);

            if (perfData) setPerformanceLogs(perfData);

            // Fetch beta feedback
            const { data: feedbackData } = await supabase
                .from('beta_feedback')
                .select('*')
                .eq('tenant_id', restaurant.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (feedbackData) setFeedbackLogs(feedbackData);

            // Fetch audit_logs (backend logs - actions)
            // Use gm_audit_logs table (tenant_id = restaurant_id)
            const { data: auditData, error: auditError } = await supabase
                .from('gm_audit_logs')
                .select('*')
                .eq('tenant_id', restaurant.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (auditData) setAuditLogs(auditData);
            if (auditError) console.warn('Audit logs fetch warning:', auditError.message);

        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActiveLogs = () => {
        switch (activeTab) {
            case 'app': return appLogs;
            case 'audit': return auditLogs;
            case 'perf': return performanceLogs;
            case 'feedback': return feedbackLogs;
            default: return [];
        }
    };

    const logs = getActiveLogs();

    return (
        <div className="p-8 bg-black min-h-screen text-green-500 font-mono text-xs">
            <h1 className="text-xl font-bold mb-4 uppercase border-b border-green-800 pb-2">
                Estado do Sistema // Diagnóstico
            </h1>

            {/* Tabs */}
            <div className="mb-4 flex gap-2 flex-wrap">
                <button
                    onClick={() => setActiveTab('app')}
                    className={`px-4 py-2 rounded uppercase font-bold transition-all ${activeTab === 'app' ? 'bg-green-900 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    App Logs ({appLogs.length})
                </button>
                <button
                    onClick={() => setActiveTab('perf')}
                    className={`px-4 py-2 rounded uppercase font-bold transition-all ${activeTab === 'perf' ? 'bg-cyan-900 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Performance ({performanceLogs.length})
                </button>
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`px-4 py-2 rounded uppercase font-bold transition-all ${activeTab === 'feedback' ? 'bg-purple-900 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Feedback ({feedbackLogs.length})
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-2 rounded uppercase font-bold transition-all ${activeTab === 'audit' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Audit ({auditLogs.length})
                </button>
            </div>

            <div className="mb-8">
                <h2 className="text-white mb-2 uppercase">{activeTab} - Eventos Recentes</h2>
                <div className="border border-green-900 bg-gray-900 p-4 h-96 overflow-y-auto rounded scrollbar-thin scrollbar-thumb-green-900">
                    {loading ? (
                        <div className="animate-pulse">A verificar integridade...</div>
                    ) : logs.length === 0 ? (
                        <div className="opacity-50">Nenhum registo encontrado.</div>
                    ) : (
                        logs.map((log, idx) => (
                            <div key={log.id || idx} className="mb-2 border-b border-gray-800 pb-2 hover:bg-gray-800/50 transition-colors">
                                <span className="opacity-50 mr-2">[{new Date(log.created_at).toLocaleTimeString()}]</span>

                                {activeTab === 'app' && (
                                    <>
                                        <span className={`mx-2 font-bold ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-yellow-500' : 'text-blue-400'}`}>
                                            {log.level?.toUpperCase() || 'INFO'}
                                        </span>
                                        <span className="text-white">{log.message}</span>
                                        {log.details && (
                                            <pre className="mt-1 text-[10px] opacity-70 overflow-x-auto whitespace-pre-wrap text-gray-400">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        )}
                                    </>
                                )}

                                {activeTab === 'perf' && (
                                    <div className="ml-4">
                                        <div className="text-cyan-400 font-bold mb-1">HEARTBEAT (Samples: {log.details?.sample_size})</div>
                                        {log.details?.metrics && Object.entries(log.details.metrics).map(([key, val]: [string, any]) => (
                                            <div key={key} className="grid grid-cols-2 gap-4 text-[10px] border-l-2 border-cyan-900 pl-2 mb-1">
                                                <span className="text-gray-300">{key}</span>
                                                <span className="text-cyan-300">Avg: {val.avg?.toFixed(2)}ms | Max: {val.max?.toFixed(2)}ms</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'feedback' && (
                                    <>
                                        <span className={`mx-2 font-bold px-1 rounded ${log.type === 'bug' ? 'bg-red-900 text-red-200' :
                                                log.type === 'feature' ? 'bg-blue-900 text-blue-200' : 'bg-gray-700 text-gray-200'
                                            }`}>
                                            {log.type?.toUpperCase()}
                                        </span>
                                        <span className={`mx-2 font-bold text-[10px] ${log.severity === 'critical' ? 'text-red-500' :
                                                log.severity === 'high' ? 'text-orange-500' : 'text-gray-500'
                                            }`}>
                                            {log.severity?.toUpperCase()}
                                        </span>
                                        <span className="text-white block mt-1">{log.message}</span>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            User: {log.user_id} | Status: {log.status}
                                        </div>
                                    </>
                                )}

                                {activeTab === 'audit' && (
                                    <>
                                        <span className="mx-2 font-bold text-gray-400">
                                            {log.action || 'ACTION'}
                                        </span>
                                        <span className="text-gray-300">{log.resource_entity || 'unknown'}</span>
                                        {log.resource_id && (
                                            <span className="text-gray-500 text-[10px] ml-2">
                                                ID: {log.resource_id.substring(0, 8)}...
                                            </span>
                                        )}
                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                            <pre className="mt-1 text-[10px] opacity-70 overflow-x-auto whitespace-pre-wrap">
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <button
                onClick={fetchLogs}
                className="bg-green-900 hover:bg-green-800 text-white px-6 py-3 rounded uppercase font-bold tracking-wider transition-all shadow-lg hover:shadow-green-900/50"
            >
                Atualizar Diagnóstico
            </button>
        </div>
    );
}

export default SystemStatusPage;
