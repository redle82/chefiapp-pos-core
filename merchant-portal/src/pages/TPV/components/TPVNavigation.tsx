import React from 'react';
import { Button } from '../../../ui/design-system/primitives/Button';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { colors } from '../../../ui/design-system/tokens/colors';

// Simple SVG Icons for the Navigation
const GridIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

const MapIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
        <line x1="8" y1="2" x2="8" y2="18"></line>
        <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
);

const ListIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

const UserIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const CalendarIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const DeliveryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
);

// War Map / Command Center icon (compass/brain)
const CommandIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>
);

type TPVView = 'menu' | 'tables' | 'orders' | 'reservations' | 'delivery' | 'warmap';

interface TPVNavigationProps {
    currentView: TPVView;
    onChangeView: (view: TPVView) => void;
    onSettings?: () => void;
    cashStatus?: 'open' | 'closed';
}

export const TPVNavigation: React.FC<TPVNavigationProps> = ({ currentView, onChangeView, onSettings, cashStatus }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', gap: spacing[4] }}>
            {/* Logo / Brand Placeholder */}
            <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: colors.action.base,
                marginBottom: spacing[4],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '20px'
            }}>
                GM
            </div>

            {/* War Map - Command Center at top */}
            <NavButton
                isActive={currentView === 'warmap'}
                onClick={() => onChangeView('warmap')}
                icon={<CommandIcon />}
                label="Situação"
            />

            <NavButton
                isActive={currentView === 'tables'}
                onClick={() => onChangeView('tables')}
                icon={<MapIcon />}
                label="Mesas"
            />

            <NavButton
                isActive={currentView === 'menu'}
                onClick={() => onChangeView('menu')}
                icon={<GridIcon />}
                label="Menu"
            />

            <NavButton
                isActive={currentView === 'orders'}
                onClick={() => onChangeView('orders')}
                icon={<ListIcon />}
                label="Pedidos"
            />

            <NavButton
                isActive={currentView === 'reservations'}
                onClick={() => onChangeView('reservations')}
                icon={<CalendarIcon />}
                label="Reservas"
            />

            <NavButton
                isActive={currentView === 'delivery'}
                onClick={() => onChangeView('delivery')}
                icon={<DeliveryIcon />}
                label="Delivery"
            />

            <div style={{ flex: 1 }} />

            {/* Bottom Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4], paddingBottom: spacing[4] }}>
                <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: cashStatus === 'open' ? colors.success.base : colors.destructive.base
                }} title={cashStatus === 'open' ? "Caixa Aberto" : "Caixa Fechado"} />

                <NavButton
                    isActive={false}
                    onClick={onSettings}
                    icon={<UserIcon />}
                    label="Perfil"
                />
            </div>
        </div>
    );
};

const NavButton = ({ isActive, onClick, icon, label }: { isActive: boolean, onClick?: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 12,
            backgroundColor: isActive ? colors.surface.layer2 : 'transparent',
            color: isActive ? colors.action.base : colors.text.secondary,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            gap: 4
        }}
    >
        {icon}
        <span style={{ fontSize: '10px', fontWeight: 500 }}>{label}</span>
    </button>
);
