/**
 * ScreenCustomerDisplayPage — Dedicated customer-facing display.
 *
 * Reuses TPVCustomerDisplayPage inside ScreenLayout.
 * No back button — this is a public-facing screen.
 * No TPV sidebar/header/navigation.
 */

import { ScreenLayout } from "../../../components/operational/ScreenLayout";
import { TPVCustomerDisplayPage } from "../TPVCustomerDisplayPage";

export function ScreenCustomerDisplayPage() {
  return (
    <ScreenLayout
      stationLabel="Display Cliente"
      stationColor="#8b5cf6"
      hideBackButton
    >
      <TPVCustomerDisplayPage />
    </ScreenLayout>
  );
}
