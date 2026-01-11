import React from 'react';
import { useStaff } from './context/StaffContext';
import { AppStaffLanding } from './AppStaffLanding';
import { ManagerDashboard } from './ManagerDashboard';
import { OwnerDashboard } from './OwnerDashboard';
import { WorkerCheckInView } from './WorkerCheckInView';
import { WorkerTaskStream } from './WorkerTaskStream';
import { WorkerTaskFocus } from './WorkerTaskFocus';
import KitchenDisplay from '../TPV/KDS/KitchenDisplay'; // The Production Tool
import { MiniPOS } from './components/MiniPOS';
import { CleaningTaskView } from './views/CleaningTaskView';
import { colors } from '../../ui/design-system/tokens/colors';
import { Text } from '../../ui/design-system/primitives/Text';

export default function AppStaff() {
  const { activeWorkerId, activeRole, operationalContract, tasks, dominantTool, unfocusTask } = useStaff();
  const [booting, setBooting] = React.useState(true);

  React.useEffect(() => {
    // Artificial stability delay
    const timer = setTimeout(() => setBooting(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (booting) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: colors.surface.base,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: `4px solid ${colors.surface.layer2}`,
          borderTopColor: colors.action.base,
          animation: 'spin 1s linear infinite'
        }}>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text size="sm" weight="black" color="tertiary" style={{ letterSpacing: '0.2em' }}>CHEFIAPP</Text>
          <Text size="xs" color="quaternary" style={{ marginTop: 8 }}>A carregar operação...</Text>
        </div>
      </div>
    );
  }

  // 1. THE DOOR (No Contract)
  if (!operationalContract) {
    return <AppStaffLanding />;
  }

  // 2. THE IDENTITY (No Worker)
  if (!activeWorkerId) {
    return <WorkerCheckInView />;
  }

  // 3. THE CORTEX (Manager)
  if (activeRole === 'manager') {
    return <ManagerDashboard />;
  }

  // 4. THE CONSCIOUSNESS (Owner)
  if (activeRole === 'owner') {
    return <OwnerDashboard />;
  }

  // 5. THE DOMINANT STATE LAYER (Always-On Tools)

  if (dominantTool === 'order') {
    // WAITERS get the POS
    return <MiniPOS tasks={tasks} role={activeRole} />;
  }

  if (dominantTool === 'production') {
    // KITCHEN (Busy) gets the KDS. Use standard component.
    return <KitchenDisplay />;
  }

  if (dominantTool === 'check') {
    // CLEANING (or Kitchen Idle) gets the Checklist.
    return <CleaningTaskView tasks={tasks} role={activeRole} />;
  }

  // 6. THE STREAM (Generic Hand / No Dominant Tool)

  // Check for Blockers (Critical Interrupts)
  const focusedTask = tasks.find(t => t.status === 'focused');
  const shouldBlockScreen = focusedTask && focusedTask.priority === 'critical';

  if (shouldBlockScreen && focusedTask) {
    return <WorkerTaskFocus task={focusedTask} onBack={() => unfocusTask(focusedTask.id)} />;
  }

  return <WorkerTaskStream />;
}
