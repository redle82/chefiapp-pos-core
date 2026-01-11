import React from 'react';
import { useDevicePermissions } from './useDevicePermissions';
import { type ToolId } from './DeviceMatrix';
import { RitualScreen } from '../../pages/Onboarding/RitualScreen';
import { useNavigate } from 'react-router-dom';

interface GuardToolProps {
    tool: ToolId;
    children: React.ReactNode;
}

export const GuardTool: React.FC<GuardToolProps> = ({ tool, children }) => {
    const { canAccess, role } = useDevicePermissions();
    const navigate = useNavigate();

    // Perform check
    const decision = canAccess(tool);

    if (!decision.allow) {
        return (
            <RitualScreen
                id="access_denied_device"
                title="Dispositivo Incompatível"
                subtitle={`Este dispositivo está configurado como '${role}' e não pode acessar '${tool}'.`}
                primaryAction={{
                    label: 'Voltar ao Dashboard',
                    onClick: () => navigate('/app/dashboard')
                }}
            >
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 64, marginBottom: 20 }}>🚫</div>
                    <div style={{ opacity: 0.6 }}>
                        Para usar o {tool.toUpperCase()}, use um terminal apropriado
                        <br />
                        (ex: Caixa/Gerente).
                    </div>
                </div>
            </RitualScreen>
        );
    }

    return <>{children}</>;
};
