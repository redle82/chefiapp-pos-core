import { HomeRoleScreen } from "./_HomeRoleScreen";

export default function AppStaffHomeOwnerScreen() {
  return (
    <HomeRoleScreen
      role="owner"
      primaryHref="/manager/operation"
      primaryLabel="Abrir visão de dono"
    />
  );
}
