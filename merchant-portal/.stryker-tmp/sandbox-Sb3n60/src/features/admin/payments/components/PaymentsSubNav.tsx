import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/admin/payments/transactions", label: "Transacciones procesadas" },
  { to: "/admin/payments/payouts", label: "Payouts" },
] as const;

export function PaymentsSubNav() {
  return (
    <nav
      className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm"
      aria-label="Pagos sub-navegação"
    >
      {TABS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={false}
          className={({ isActive }) =>
            `rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
