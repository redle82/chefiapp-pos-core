import { HomeRoleScreen } from "./_HomeRoleScreen";

export default function AppStaffHomeCleaningScreen() {
  return (
    <HomeRoleScreen
      role="cleaning"
      primaryHref="/manager/tasks"
      primaryLabel="Abrir checklist"
    />
  );
}
