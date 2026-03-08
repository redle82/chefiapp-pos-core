import { SectorScreen } from "./_SectorScreen";

export default function OwnerSectorTasksScreen() {
  return (
    <SectorScreen
      sector="tasks"
      primaryHref="/manager/tasks"
      primaryLabel="Abrir tarefas"
    />
  );
}
