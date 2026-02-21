// @ts-nocheck
import React from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';

/* 
  TPV Split Layout (Last.app Style)
  Zone A: Navigation (Sidebar) - Fixed 80px (Icons)
  Zone B: Workspace (Dynamic) - Flexible
  Zone C: Ticket (Permanent) - Fixed 350px
*/

interface TPVLayoutSplitProps {
    navigation: React.ReactNode; // Zone A
    workspace: React.ReactNode;  // Zone B (Map, Menu, Orders)
    ticket: React.ReactNode;     // Zone C (Active Order)
}

export const TPVLayoutSplit: React.FC<TPVLayoutSplitProps> = ({ navigation, workspace, ticket }) => {
    return (
        <div
            style={{
                backgroundColor: colors.surface.base, // TRUE BLACK
                color: colors.text.primary,
                height: '100vh',
                width: '100%',
                display: 'flex',
                overflow: 'hidden'
            }}
        >
            {/* ZONE A: NAVIGATION SIDEBAR */}
            <div style={{
                width: '80px',
                borderRight: `1px solid ${colors.border.subtle}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: spacing[4],
                paddingBottom: spacing[4],
                backgroundColor: colors.surface.layer1,
                zIndex: 10
            }}>
                {navigation}
            </div>

            {/* MAIN CONTENT AREA (Grid for Workspace + Ticket) */}
            <div style={{
                flex: 1,
                display: 'flex', // Using flex instead of grid for smoother transitions if needed
                height: '100%',
                overflow: 'hidden'
            }}>
                {/* ZONE B: WORKSPACE (Middle) */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: colors.surface.base,
                    padding: spacing[4]
                }}>
                    {workspace}
                </div>

                {/* ZONE C: TICKET (Right) */}
                <div style={{
                    width: '380px', // Slightly wider for readability
                    borderLeft: `1px solid ${colors.border.subtle}`,
                    backgroundColor: colors.surface.layer1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    position: 'relative',
                    zIndex: 20
                }}>
                    {ticket}
                </div>
            </div>
        </div>
    );
};
