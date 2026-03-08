import { HomeRoleScreen } from "./_HomeRoleScreen";

export default function AppStaffHomeManagerScreen() {
  return (
    <HomeRoleScreen
      role="manager"
      primaryHref="/manager/operation"
      primaryLabel="Abrir gestão"
    />
  );
}
