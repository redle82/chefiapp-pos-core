
import React from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';

interface StaffMetric {
    id: string;
    name: string;
    orders: number;
    revenue: number;
}

interface StaffPerformanceWidgetProps {
    data: StaffMetric[];
    isLoading: boolean;
}

export const StaffPerformanceWidget: React.FC<StaffPerformanceWidgetProps> = ({ data, isLoading }) => {
    return (
        <Card surface="layer1" padding="lg" className="h-full">
            <div className="flex justify-between items-center mb-4">
                <Text size="lg" weight="bold">Desempenho da Equipe</Text>
                <div className="bg-yellow-500/10 px-2 py-1 rounded text-xs text-yellow-300">
                    🏆 Top Performers
                </div>
            </div>

            {isLoading ? (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-white/5 rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {data.length === 0 ? (
                        <Text color="tertiary" className="text-center py-4">Nenhuma venda registrada por staff.</Text>
                    ) : (
                        data.map((staff, index) => (
                            <div key={staff.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                                        ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <Text size="sm" weight="medium" className="text-gray-200">{staff.name}</Text>
                                        <Text size="xs" color="tertiary">{staff.orders} pedidos</Text>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-bold text-green-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(staff.revenue / 100)}
                                    </div>
                                    <Text size="xs" color="tertiary">
                                        {staff.orders > 0 ?
                                            `Ticket: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((staff.revenue / staff.orders) / 100)}`
                                            : '--'}
                                    </Text>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </Card>
    );
};
