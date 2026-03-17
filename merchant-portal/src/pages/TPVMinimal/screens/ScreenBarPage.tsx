/**
 * ScreenBarPage — Dedicated bar execution screen.
 *
 * Reuses KDSMinimal (the standalone KDS) inside ScreenLayout.
 * Locked to BAR station. No TPV sidebar/header/navigation.
 */

import { ScreenLayout } from "../../../components/operational/ScreenLayout";
import { KDSMinimal } from "../../KDSMinimal/KDSMinimal";

export function ScreenBarPage() {
  return (
    <ScreenLayout stationLabel="Bar KDS" stationColor="#a855f7">
      <KDSMinimal defaultStation="BAR" />
    </ScreenLayout>
  );
}
