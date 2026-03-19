/**
 * ScreenKitchenPage — Dedicated kitchen execution screen.
 *
 * Reuses KDSMinimal (the standalone KDS) inside ScreenLayout.
 * Locked to KITCHEN station. No TPV sidebar/header/navigation.
 */

import { ScreenLayout } from "../../../components/operational/ScreenLayout";
import { KDSMinimal } from "../../KDSMinimal/KDSMinimal";

export function ScreenKitchenPage() {
  return (
    <ScreenLayout stationLabel="Cozinha KDS" stationColor="#22c55e">
      <KDSMinimal defaultStation="KITCHEN" />
    </ScreenLayout>
  );
}
