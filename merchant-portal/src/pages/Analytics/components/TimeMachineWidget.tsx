import React, { useEffect, useState } from 'react';
import { historicalEngine, type SalesPeriodStats } from '../../../core/history/HistoricalDataEngine';
import { UpgradeLock } from '../../../ui/components/UpgradeLock';
import './TimeMachineWidget.css';

interface TimeMachineProps {
    restaurantId: string;
}

export const TimeMachineWidget: React.FC<TimeMachineProps> = ({ restaurantId }) => {
    const [stats, setStats] = useState<SalesPeriodStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'30days' | 'year'>('30days');

    // Logic extracted to function for clarity
    const loadData = async () => {
        setLoading(true);
        try {
            const end = new Date();
            const start = new Date();

            if (viewMode === '30days') {
                start.setDate(end.getDate() - 30);
            } else {
                start.setFullYear(end.getFullYear() - 1);
            }

            const data = await historicalEngine.getHybridSalesStats(restaurantId, start, end);
            setStats(data);
        } catch (e) {
            console.error('Failed to load time machine data', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [restaurantId, viewMode]);

    const totalSales = stats.reduce((acc, curr) => acc + curr.totalCents, 0);

    return (
        <UpgradeLock
            capability="analytics.historical"
            title="Time Machine Locked"
            description="Import and view your legacy sales history from GloriaFood or previous systems."
        >
            <div className="time-machine-card">
                <div className="time-machine-header">
                    <h3 className="time-machine-title">📊 Historical & Real-time Nexus</h3>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as any)}
                        className="time-machine-select"
                    >
                        <option value="30days">Last 30 Days</option>
                        <option value="year">Full Year</option>
                    </select>
                </div>

                <div className="time-machine-summary">
                    <div className="time-machine-kpi">
                        <span className="label">Total Revenue</span>
                        <span className="value">
                            {(totalSales / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                    <div className="time-machine-kpi">
                        <span className="label">Orders</span>
                        <span className="value">
                            {stats.reduce((acc, curr) => acc + curr.ordersCount, 0)}
                        </span>
                    </div>
                </div>

                <div className="time-machine-graph">
                    {loading ? (
                        <div className="loading-pulse">Reconstructing Timeline...</div>
                    ) : stats.length === 0 ? (
                        <div className="no-data">No history found. Import your legacy data to see it here.</div>
                    ) : (
                        <div className="bars-container">
                            {stats.map((day) => {
                                // Simple bar chart logic
                                const max = Math.max(...stats.map(s => s.totalCents));
                                const height = (day.totalCents / max) * 100;

                                return (
                                    <div key={day.period} className="bar-group" title={`${day.period}: R$ ${(day.totalCents / 100).toFixed(2)}`}>
                                        <div
                                            className={`bar ${day.source}`}
                                            style={{ height: `${height}%` }}
                                        />
                                        <span className="bar-label">{day.period.split('-')[2]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="time-machine-footer">
                    <div className="legend">
                        <span className="dot historical"></span> Legacy
                        <span className="dot chefiapp"></span> ChefIApp
                        <span className="dot hybrid"></span> Integrated
                    </div>
                    <button className="import-btn">Import CSV</button>
                </div>
            </div>
        </UpgradeLock>
    );
};
