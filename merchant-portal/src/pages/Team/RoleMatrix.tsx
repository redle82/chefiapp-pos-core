import React from 'react';

// Hardcoded Mirror of Mobile App's Role Config
// Source: mobile-app/context/AppStaffContext.tsx
const ROLE_PERMISSIONS_MAP = {
    manager: { label: 'Gerente', emoji: '🧑‍💼', description: 'Complete operational oversight. Can manage staff, menu, and refunds.', metrics: true },
    chef: { label: 'Chef', emoji: '👨‍🍳', description: 'Kitchen commander. Controls menu availability and quality standards.', metrics: true },
    waiter: { label: 'Garçom', emoji: '🍽️', description: 'Table service specialist. Can take orders and request payments.', metrics: false },
    bartender: { label: 'Barman', emoji: '🍹', description: 'Bar service. Manages drink queue and bar inventory.', metrics: false },
    cook: { label: 'Cozinheiro', emoji: '👨‍🍳', description: 'Kitchen execution. Receives and prepares food orders.', metrics: false },
    cleaning: { label: 'Limpeza', emoji: '🧹', description: 'Maintenance and hygiene. checklists and incident response.', metrics: false },
    cashier: { label: 'Caixa', emoji: '💸', description: 'Payment specialist. Handles cash and closing calculations.', metrics: true },
    delivery: { label: 'Entregador', emoji: '🛵', description: 'Logistics. Manages delivery queue and routes.', metrics: true },
    vendor: { label: 'Vendedor', emoji: '🏪', description: 'Quick service sales. Simplified POS interface.', metrics: true },
    owner: { label: 'Proprietário', emoji: '👑', description: 'Strategic view. Full access to all business metrics and settings.', metrics: true },
};

export const RoleMatrix = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Role & Permissions Matrix</h1>
                <p className="text-slate-500 mt-1">
                    Understanding the operational hierarchy and capabilities of each role.
                    <br />
                    <span className="text-xs text-slate-400">
                        * These policies are currently enforced by the Mobile App logic.
                    </span>
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Key Capability</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Metrics Access</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {Object.entries(ROLE_PERMISSIONS_MAP).map(([key, config]) => (
                            <tr key={key} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-100 rounded-full text-xl">
                                            {config.emoji}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-slate-900 capitalize">{config.label}</div>
                                            <div className="text-xs text-slate-500 font-mono">{key}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-500">{config.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                                        {key === 'manager' || key === 'owner' ? 'Management' : 'Operation'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {config.metrics ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Yes
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            No
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
