/**
 * AlertSystem — Sistema de Alertas e Notificações (Cérebro do Sistema)
 * Princípio: Visual + Sonoro, Prioridades, Deduplicação, Nunca Spam.
 */
// @ts-nocheck


import React, { useEffect, useRef } from 'react';
import { AlertPriority } from '../types';
import type { WaiterCall } from '../types';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

interface AlertSystemProps {
  alerts: WaiterCall[];
  onAcknowledge: (alertId: string) => void;
  onSnooze?: (alertId: string, minutes: number) => void;
}

const PRIORITY_CONFIG = {
  [AlertPriority.P0]: {
    label: 'URGENTE',
    color: '#ff453a',
    bgColor: '#ff453a22',
    sound: 800, // Hz
    duration: 200, // ms
  },
  [AlertPriority.P1]: {
    label: 'ALTA',
    color: '#ff9500',
    bgColor: '#ff950022',
    sound: 600,
    duration: 150,
  },
  [AlertPriority.P2]: {
    label: 'MÉDIA',
    color: '#0a84ff',
    bgColor: '#0a84ff22',
    sound: 400,
    duration: 100,
  },
  [AlertPriority.P3]: {
    label: 'BAIXA',
    color: '#8e8e93',
    bgColor: '#8e8e9322',
    sound: 300,
    duration: 50,
  },
};

export function AlertSystem({ alerts, onAcknowledge, onSnooze }: AlertSystemProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const playedAlertsRef = useRef<Set<string>>(new Set());

  // Inicializar AudioContext (para beeps)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Tocar beep para novos alertas
  useEffect(() => {
    alerts.forEach((alert) => {
      if (!playedAlertsRef.current.has(alert.id)) {
        playedAlertsRef.current.add(alert.id);
        playBeep(alert.priority);
      }
    });
  }, [alerts]);

  const playBeep = (priority: AlertPriority) => {
    if (!audioContextRef.current) return;

    const config = PRIORITY_CONFIG[priority];
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = config.sound;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + config.duration / 1000);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + config.duration / 1000);
  };

  // Agrupar alertas por prioridade
  const alertsByPriority = alerts.reduce((acc, alert) => {
    if (!acc[alert.priority]) {
      acc[alert.priority] = [];
    }
    acc[alert.priority].push(alert);
    return acc;
  }, {} as Record<AlertPriority, WaiterCall[]>);

  // Ordenar por prioridade (P0 → P3)
  const sortedPriorities = [
    AlertPriority.P0,
    AlertPriority.P1,
    AlertPriority.P2,
    AlertPriority.P3,
  ].filter(p => alertsByPriority[p]?.length > 0);

  if (sortedPriorities.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 80, // Abaixo do mini-mapa
        right: spacing[4],
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[2],
        maxWidth: 320,
      }}
    >
      {sortedPriorities.map((priority) => {
        const priorityAlerts = alertsByPriority[priority];
        const config = PRIORITY_CONFIG[priority];
        const topAlert = priorityAlerts[0]; // Mostrar o mais urgente

        return (
          <div
            key={priority}
            style={{
              background: config.bgColor,
              border: `2px solid ${config.color}`,
              borderRadius: 12,
              padding: spacing[3],
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: priority === AlertPriority.P0 ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: spacing[2],
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                <span style={{ 
                  fontSize: 11, 
                  fontWeight: 'bold',
                  color: config.color,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  {config.label}
                </span>
                {priorityAlerts.length > 1 && (
                  <span style={{
                    background: config.color,
                    color: 'white',
                    borderRadius: 10,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}>
                    +{priorityAlerts.length - 1}
                  </span>
                )}
              </div>
              <button
                onClick={() => onAcknowledge(topAlert.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: config.color,
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                }}
                title="Marcar como lido"
              >
                ✓
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ marginBottom: spacing[2] }}>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 'bold',
                color: colors.text.primary,
                marginBottom: spacing[1],
              }}>
                Mesa {topAlert.tableNumber}
              </div>
              {topAlert.count >= 3 && (
                <div style={{ 
                  fontSize: 12, 
                  color: config.color,
                  marginBottom: spacing[1],
                }}>
                  {topAlert.count} chamados
                </div>
              )}
              {topAlert.message && (
                <div style={{ 
                  fontSize: 12, 
                  color: colors.text.secondary,
                }}>
                  {topAlert.message}
                </div>
              )}
            </div>

            {/* Ações */}
            <div style={{ 
              display: 'flex', 
              gap: spacing[2],
            }}>
              <button
                onClick={() => onAcknowledge(topAlert.id)}
                style={{
                  flex: 1,
                  padding: spacing[2],
                  background: config.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Atender
              </button>
              {onSnooze && (
                <button
                  onClick={() => onSnooze(topAlert.id, 2)}
                  style={{
                    padding: spacing[2],
                    background: 'transparent',
                    color: config.color,
                    border: `1px solid ${config.color}`,
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  title="Adiar 2 min"
                >
                  2min
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* CSS para animação piscante */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}

