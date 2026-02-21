import { useNavigate } from "react-router-dom";
import type { Customer } from "../types";

const CURRENCY_FORMAT = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const DATE_FORMAT = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 55%, 45%)`;
}

interface CustomerRowProps {
  customer: Customer;
}

export function CustomerRow({ customer }: CustomerRowProps) {
  const navigate = useNavigate();
  const initials = getInitials(customer.name);
  const bgColor = avatarColor(customer.id);
  const lastOrderFormatted = customer.lastOrderAt
    ? DATE_FORMAT.format(new Date(customer.lastOrderAt))
    : "—";
  const totalSpentFormatted = CURRENCY_FORMAT.format(customer.totalSpent);
  const averageSpentFormatted = CURRENCY_FORMAT.format(customer.averageSpent);

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/admin/customers/${customer.id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/admin/customers/${customer.id}`)}
      className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
    >
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{customer.name}</span>
            <span className="text-xs text-gray-500">ID: {customer.id}</span>
          </div>
        </div>
      </td>
      <td className="py-3 px-2 text-sm text-gray-600">{customer.source}</td>
      <td className="py-3 px-2 text-sm text-gray-600">{lastOrderFormatted}</td>
      <td className="py-3 px-2 text-sm text-gray-900">
        {totalSpentFormatted} ({customer.tabsCount} Cuentas)
      </td>
      <td className="py-3 px-2 text-sm text-gray-900">{averageSpentFormatted}</td>
      <td className="py-3 pr-4 pl-2 text-sm text-gray-600">{customer.locationName}</td>
    </tr>
  );
}
