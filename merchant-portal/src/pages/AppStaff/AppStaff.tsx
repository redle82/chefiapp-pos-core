/**
 * LEGADO — Não utilizado em rotas. Não importar para novas funcionalidades.
 * Entrypoint real do AppStaff (web): AppStaffWrapper (Route path="/app/staff" em App.tsx).
 * Cadeia real: AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout → StaffLauncherPage → AppStaffHome.
 * Este componente fazia routing por role (manager/owner/waiter) num único tree; foi substituído pelo shell + rotas por página.
 */
import React from "react";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import KitchenDisplay from "../TPV/KDS/KitchenDisplay"; // The Production Tool
import { AppStaffLanding } from "./AppStaffLanding";
import { MiniPOS } from "./components/MiniPOS";
import { useStaff } from "./context/StaffContext";
import { OwnerGlobalDashboard } from "./dashboards/OwnerGlobalDashboard";
import { ManagerDashboard } from "./ManagerDashboard";
import { CleaningTaskView } from "./views/CleaningTaskView";
import { LocationSelectView } from "./views/LocationSelectView";
import { NoLocationsView } from "./views/NoLocationsView";
import { WorkerCheckInView } from "./WorkerCheckInView";
import { WorkerTaskFocus } from "./WorkerTaskFocus";
import { WorkerTaskStream } from "./WorkerTaskStream";

export default function AppStaff() {
  const {
    activeLocation,
    activeLocations,
    activeWorkerId,
    activeRole,
    operationalContract,
    tasks,
    dominantTool,
    unfocusTask,
  } = useStaff();
  const [booting, setBooting] = React.useState(true);

  React.useEffect(() => {
    // Artificial stability delay
    const timer = setTimeout(() => setBooting(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (booting) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          backgroundColor: colors.surface.base,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: `4px solid ${colors.surface.layer2}`,
            borderTopColor: colors.action.base,
            animation: "spin 1s linear infinite",
          }}
        >
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
        <div style={{ textAlign: "center" }}>
          <Text
            size="sm"
            weight="black"
            color="tertiary"
            style={{ letterSpacing: "0.2em" }}
          >
            CHEFIAPP
          </Text>
          <Text size="xs" color="quaternary" style={{ marginTop: 8 }}>
            A carregar operação...
          </Text>
        </div>
      </div>
    );
  }

  // 0. LOCATION (Staff Session requires Location — STAFF_SESSION_LOCATION_CONTRACT)
  if (!activeLocation) {
    if (activeLocations.length === 0) return <NoLocationsView />;
    return <LocationSelectView />;
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
  if (activeRole === "manager") {
    return <ManagerDashboard />;
  }

  // 4. THE CONSCIOUSNESS (Owner) — Modo Consciência no app: variante "app" (Visão do Dono)
  if (activeRole === "owner") {
    return <OwnerGlobalDashboard />;
  }

  // 5. THE DOMINANT STATE LAYER (Always-On Tools)
  const isPreview = operationalContract.mode === "local";

  // WRAPPER FOR PREVIEW BANNER
  const withPreview = (component: React.ReactNode) => (
    <>
      {isPreview && (
        <div
          style={{
            background: colors.warning.base,
            color: colors.warning.contrastText,
            padding: "4px 12px",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: "bold",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
        >
          MODO PREVIEW — Alterações não serão salvas
        </div>
      )}
      {component}
    </>
  );

  if (dominantTool === "order") {
    // WAITERS get the POS
    return withPreview(<MiniPOS tasks={tasks} role={activeRole} />);
  }

  if (dominantTool === "production") {
    // KITCHEN (Busy) gets the KDS. Use standard component.
    return withPreview(<KitchenDisplay />);
  }

  if (dominantTool === "check") {
    // CLEANING (or Kitchen Idle) gets the Checklist.
    return withPreview(<CleaningTaskView tasks={tasks} role={activeRole} />);
  }

  // 6. THE STREAM (Generic Hand / No Dominant Tool)

  // Check for Blockers (Critical Interrupts)
  const focusedTask = tasks.find((t) => t.status === "focused");
  const shouldBlockScreen = focusedTask && focusedTask.priority === "critical";

  if (shouldBlockScreen && focusedTask) {
    return withPreview(
      <WorkerTaskFocus
        task={focusedTask}
        onBack={() => unfocusTask(focusedTask.id)}
      />,
    );
  }

  return withPreview(<WorkerTaskStream />);
}
