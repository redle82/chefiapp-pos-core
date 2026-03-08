import { SectorScreen } from "./_SectorScreen";

export default function OwnerSectorCleaningScreen() {
  return (
    <SectorScreen
      sector="cleaning"
      primaryHref="/manager/tasks"
      primaryLabel="Abrir limpeza"
    />
  );
}
