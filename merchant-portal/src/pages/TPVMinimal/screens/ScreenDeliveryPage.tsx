/**
 * ScreenDeliveryPage — Dedicated delivery management screen.
 *
 * Reuses TPVDeliveryPage inside ScreenLayout.
 * No TPV sidebar/header/navigation.
 */

import { ScreenLayout } from "../../../components/operational/ScreenLayout";
import { TPVDeliveryPage } from "../TPVDeliveryPage";

export function ScreenDeliveryPage() {
  return (
    <ScreenLayout stationLabel="Delivery" stationColor="#3b82f6">
      <TPVDeliveryPage />
    </ScreenLayout>
  );
}
