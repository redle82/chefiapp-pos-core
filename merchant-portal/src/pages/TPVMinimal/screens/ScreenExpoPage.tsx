/**
 * ScreenExpoPage — Dedicated expo/expedição screen.
 *
 * Reuses TPVExpoPage inside ScreenLayout.
 * No TPV sidebar/header/navigation.
 */

import { ScreenLayout } from "../../../components/operational/ScreenLayout";
import { TPVExpoPage } from "../TPVExpoPage";

export function ScreenExpoPage() {
  return (
    <ScreenLayout stationLabel="Expo" stationColor="#fbbf24">
      <TPVExpoPage />
    </ScreenLayout>
  );
}
