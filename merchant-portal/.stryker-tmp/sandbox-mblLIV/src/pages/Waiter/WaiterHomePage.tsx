/**
 * WaiterHomePage — Home do Comandeiro (Mapa da Área)
 * Princípio: 1 dedo, primeira tela = mapa.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavBar } from "./components/BottomNavBar";
import { FloorMap } from "./components/FloorMap";
import type { Table } from "./types";
import { TableStatus } from "./types";

// Estado trial: 12 mesas
const TRIAL_TABLES: Table[] = [
  { id: "1", number: 1, status: TableStatus.FREE },
  {
    id: "2",
    number: 2,
    status: TableStatus.CALLING,
    callCount: 3,
    lastCallAt: new Date(Date.now() - 120000),
  },
  { id: "3", number: 3, status: TableStatus.BILL_REQUESTED },
  { id: "4", number: 4, status: TableStatus.FREE },
  {
    id: "5",
    number: 5,
    status: TableStatus.OCCUPIED,
    seatedAt: new Date(Date.now() - 1080000),
  },
  { id: "6", number: 6, status: TableStatus.FREE },
  { id: "7", number: 7, status: TableStatus.FREE },
  { id: "8", number: 8, status: TableStatus.FREE },
  { id: "9", number: 9, status: TableStatus.FREE },
  { id: "10", number: 10, status: TableStatus.KITCHEN_READY },
  { id: "11", number: 11, status: TableStatus.FREE },
  { id: "12", number: 12, status: TableStatus.FREE },
];

export function WaiterHomePage() {
  const navigate = useNavigate();
  const [tables] = useState<Table[]>(TRIAL_TABLES);
  const [area] = useState<string>("Área 1");

  // Contar chamados e pedidos para badges
  const callsCount = useMemo(() => {
    return tables.filter(
      (t) =>
        t.status === TableStatus.CALLING ||
        t.status === TableStatus.BILL_REQUESTED,
    ).length;
  }, [tables]);

  const ordersCount = useMemo(() => {
    return tables.filter((t) => t.status === TableStatus.KITCHEN_READY).length;
  }, [tables]);

  const handleTableClick = (table: Table) => {
    navigate(`/app/waiter/table/${table.id}`);
  };

  const handleTableLongPress = (table: Table) => {
    // TODO: Abrir menu rápido (transferir, chamar ajuda, etc.)
    console.log("Long press on table", table.number);
  };

  return (
    <div
      style={{
        paddingBottom: 100, // Espaço para barra inferior
        minHeight: "100vh",
        background: "#000",
      }}
    >
      <FloorMap
        tables={tables}
        area={area}
        onTableClick={handleTableClick}
        onTableLongPress={handleTableLongPress}
      />

      <BottomNavBar callsCount={callsCount} ordersCount={ordersCount} />
    </div>
  );
}
