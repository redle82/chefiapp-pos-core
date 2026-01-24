import React, { useState, useEffect } from 'react';
import { useStaff } from './context/StaffContext';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { colors } from '../../ui/design-system/tokens/colors';
import { radius } from '../../ui/design-system/tokens/radius';
import { BiometricService } from './core/BiometricService'; // Keeping for manual mode compatibility
import type { Employee } from './context/StaffCoreTypes';

export const WorkerCheckInView: React.FC = () => {
    const { checkIn, employees, verifyPin } = useStaff();

    // Modes: 'loading' | 'list' | 'pin' | 'manual'
    const [viewMode, setViewMode] = useState<'list' | 'pin' | 'manual'>('list');

    // Manual State
    const [name, setName] = useState('');

    // Real Data State
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [pin, setPin] = useState('');

    // Biometrics (Manual only for now)
    const [biometricsAvailable, setBiometricsAvailable] = useState(false);

    useEffect(() => {
        BiometricService.checkAvailability().then(setBiometricsAvailable);
    }, []);

    // Auto-switch to manual if no employees found after a short delay (simulating fetch)
    // In a real app we might want a loading state in context, but for now checking length is okay
    useEffect(() => {
        if (employees.length === 0) {
            setViewMode('manual');
        } else {
            setViewMode('list');
        }
    }, [employees.length]);

    const handleManualEnter = async () => {
        if (!name.trim()) return;

        // Enrollment Prompt (Legacy Flow)
        if (biometricsAvailable) {
            const wantsBio = window.confirm(`Deseja ativar Login Rápido (FaceID/TouchID) para "${name}"?`);
            if (wantsBio) {
                await BiometricService.registerUser(name);
            }
        }

        checkIn(name);
    };

    const handleEmployeeSelect = (employee: Employee) => {
        if (employee.pin && employee.pin.length > 0) {
            setSelectedEmployee(employee);
            setPin('');
            setViewMode('pin');
        } else {
            // No PIN required
            checkIn(employee.name, employee.id);
        }
    };

    const handlePinSubmit = () => {
        if (!selectedEmployee) return;

        const isValid = verifyPin(selectedEmployee.id, pin);

        if (isValid) {
            checkIn(selectedEmployee.name, selectedEmployee.id);
        } else {
            alert('PIN Incorreto');
            setPin('');
        }
    };

    const handleBiometricLogin = async () => {
        const username = await BiometricService.verifyUser();
        if (username) {
            setName(username);
            checkIn(username);
        }
    };

    // --- RENDER HELPERS ---

    const renderManualMode = () => (
        <>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <Text size="3xl" weight="black" color="primary">Olá!</Text>
                <Text size="lg" color="secondary" style={{ marginTop: 8 }}>Quem é você hoje?</Text>
            </div>

            <div style={{ marginBottom: 24 }}>
                <input
                    type="text"
                    placeholder="Seu Nome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualEnter()}
                    style={{
                        width: '100%',
                        backgroundColor: colors.surface.layer1,
                        border: `1px solid ${colors.border.subtle}`,
                        borderRadius: radius.md,
                        padding: 16,
                        fontSize: 18,
                        color: colors.text.primary,
                        outline: 'none',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                    }}
                    autoFocus
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Button tone="action" fullWidth size="lg" onClick={handleManualEnter} disabled={!name.trim()}>
                    Entrar
                </Button>

                {biometricsAvailable && (
                    <Button tone="neutral" variant="ghost" fullWidth size="lg" onClick={handleBiometricLogin}>
                        🔐 Usar Face ID
                    </Button>
                )}

                {employees.length > 0 && (
                    <Button tone="neutral" variant="ghost" fullWidth size="sm" onClick={() => setViewMode('list')}>
                        Voltar para Lista
                    </Button>
                )}
            </div>
        </>
    );

    const renderListMode = () => (
        <div style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Text size="2xl" weight="bold" color="primary">Quem está entrando?</Text>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: 12,
                maxHeight: '60vh',
                overflowY: 'auto',
                padding: 4
            }}>
                {employees.map(emp => (
                    <button
                        key={emp.id}
                        onClick={() => handleEmployeeSelect(emp)}
                        style={{
                            background: colors.surface.layer1,
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: radius.md,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            transition: 'transform 0.1s'
                        }}
                    >
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: colors.action.base,
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 'bold'
                        }}>
                            {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <Text size="sm" weight="medium" align="center">{emp.name}</Text>
                        <Text size="xs" color="tertiary" align="center">{emp.role}</Text>
                    </button>
                ))}
            </div>

            <div style={{ marginTop: 24 }}>
                <Button tone="neutral" variant="ghost" fullWidth onClick={() => setViewMode('manual')}>
                    Entrar Manualmente
                </Button>
            </div>
        </div>
    );

    const renderPinMode = () => (
        <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ marginBottom: 24 }}>
                <Text size="xl" weight="bold" color="primary">Olá, {selectedEmployee?.name}</Text>
                <Text size="md" color="secondary">Digite seu PIN para entrar</Text>
            </div>

            <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={e => setPin(e.target.value)}
                maxLength={6}
                autoFocus
                style={{
                    width: '80%',
                    maxWidth: 200,
                    backgroundColor: colors.surface.layer1,
                    border: `1px solid ${colors.action.base}`,
                    borderRadius: radius.md,
                    padding: 16,
                    fontSize: 32,
                    letterSpacing: 8,
                    textAlign: 'center',
                    marginBottom: 32,
                    color: colors.text.primary,
                    outline: 'none'
                }}
                onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Button tone="neutral" variant="ghost" fullWidth onClick={() => {
                    setViewMode('list');
                    setPin('');
                    setSelectedEmployee(null);
                }}>
                    Voltar
                </Button>
                <Button tone="action" fullWidth onClick={handlePinSubmit}>
                    Confirmar
                </Button>
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.surface.base,
            color: colors.text.primary,
            padding: 24
        }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                {/* BRAND HEADER */}
                <div style={{
                    marginBottom: 32,
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: colors.action.base,
                        boxShadow: `0 0 20px ${colors.action.base}40`
                    }} />
                </div>

                {viewMode === 'list' && renderListMode()}
                {viewMode === 'pin' && renderPinMode()}
                {viewMode === 'manual' && renderManualMode()}

                <div style={{ marginTop: 40, textAlign: 'center', opacity: 0.5 }}>
                    <Text size="xs" color="tertiary" style={{ fontFamily: 'monospace' }}>v1.2 (Connected)</Text>
                </div>
            </div>
        </div>
    );
};
