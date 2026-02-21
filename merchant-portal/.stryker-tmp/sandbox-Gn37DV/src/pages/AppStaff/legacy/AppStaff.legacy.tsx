/**
 * LEGADO — Arquivado. Não utilizado em rotas. Não importar.
 * Entrypoint real do AppStaff (web): AppStaffWrapper (Route path="/app/staff" em OperationalRoutes).
 * Cadeia real: AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout → páginas.
 * Este componente fazia routing por role (manager/owner/waiter) num único tree; foi substituído pelo shell + rotas por página.
 */
import React from "react";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import KitchenDisplay from "../../TPV/KDS/KitchenDisplay";
import { AppStaffLanding } from "../AppStaffLanding";
import { MiniPOS } from "../components/MiniPOS";
import { useStaff } from "../context/StaffContext";
import { OwnerGlobalDashboard } from "../dashboards/OwnerGlobalDashboard";
import { ManagerDashboard } from "../ManagerDashboard";
import { CleaningTaskView } from "../views/CleaningTaskView";
import { LocationSelectView } from "../views/LocationSelectView";
import { NoLocationsView } from "../views/NoLocationsView";
import { WorkerCheckInView } from "../WorkerCheckInView";
import { WorkerTaskFocus } from "../WorkerTaskFocus";
import { WorkerTaskStream } from "../WorkerTaskStream";

export default function AppStaffLegacy() {
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

  if (!activeLocation) {
    if (activeLocations.length === 0) return <NoLocationsView />;
    return <LocationSelectView />;
  }

  if (!operationalContract) {
    return <AppStaffLanding />;
  }

  if (!activeWorkerId) {
    return <WorkerCheckInView />;
  }

  if (activeRole === "manager") {
    return <ManagerDashboard />;
  }

  if (activeRole === "owner") {
    return <OwnerGlobalDashboard />;
  }

  const isPreview = operationalContract.mode === "local";
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
    return withPreview(<MiniPOS tasks={tasks} role={activeRole} />);
  }

  if (dominantTool === "production") {
    return withPreview(<KitchenDisplay />);
  }

  if (dominantTool === "check") {
    return withPreview(<CleaningTaskView tasks={tasks} role={activeRole} />);
  }

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
