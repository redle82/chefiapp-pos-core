// @ts-nocheck
import { Outlet } from "react-router-dom";
import { PaymentsSubNav } from "../components/PaymentsSubNav";

export function PaymentsLayout() {
  return (
    <>
      <PaymentsSubNav />
      <Outlet />
    </>
  );
}
