// @ts-nocheck
import React from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';

/* 
  TPV Layout (Canonical 3-Zone)
  Zone A: Command (Stability) - 25%
  Zone B: Stream (Focus) - 45%
  Zone C: Context (Utility) - 30%
*/

interface TPVLayoutProps {
    header: React.ReactNode;
    command: React.ReactNode; // Zone A
    stream: React.ReactNode;  // Zone B
    context: React.ReactNode; // Zone C (Menu, etc)
}

export const TPVLayout: React.FC<TPVLayoutProps> = ({ header, command, stream, context }) => {
    return (
        <div
            style={{
                backgroundColor: colors.surface.base, // TRUE BLACK
                color: colors.text.primary,
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* 1. FIXED HEADER */}
            <div style={{
                padding: spacing[6],
                paddingBottom: spacing[4],
                borderBottom: `1px solid ${colors.border.subtle}`,
                height: '80px',
                display: 'flex',
                alignItems: 'center'
            }}>
                <div style={{ width: '100%' }}>{header}</div>
            </div>

            {/* 2. OPERATIONAL GRID (3 ZONES) */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '280px 1fr 320px', // Fixed Sides, Fluid Stream
                gap: spacing[6],
                padding: spacing[6],
                paddingTop: spacing[4],
                height: 'calc(100vh - 80px)'
            }}>

                {/* ZONE A: COMMAND CENTER */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
                    {command}
                </div>

                {/* ZONE B: STREAM TUNNEL */}
                <div style={{
                    backgroundColor: colors.surface.layer1, // Zinc-950
                    borderRadius: 24,
                    border: `1px solid ${colors.border.subtle}`,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                }}>
                    {stream}
                </div>

                {/* ZONE C: CONTEXT (Menu/Details) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: colors.surface.layer2, // Slightly lighter for Panel feel
                    borderRadius: 24,
                    border: `1px solid ${colors.border.subtle}`,
                    overflow: 'hidden'
                }}>
                    {context}
                </div>

            </div>
        </div>
    );
};
