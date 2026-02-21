// @ts-nocheck
import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { CustomersKPIBar } from "../components/CustomersKPIBar";
import { CustomersTable } from "../components/CustomersTable";
import { getCustomers, getCustomersKPIs } from "../services/customersService";
import type { Customer, CustomersKPIs } from "../types";

const DEFAULT_PAGE_SIZE = 10;

export function CustomersPage() {
  const [kpis, setKpis] = useState<CustomersKPIs | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    getCustomersKPIs().then((data) => {
      if (!cancelled) setKpis(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCustomers({ search, page, pageSize })
      .then((result) => {
        if (cancelled) return;
        setCustomers(result.data);
        setTotal(result.total);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <section className="flex flex-col gap-6">
      <AdminPageHeader
        title="Clientes"
        subtitle="Veja quem são seus clientes, quanto consomem e como se comportam."
      />

      <CustomersKPIBar kpis={kpis} loading={loading} />

      <CustomersTable
        customers={customers}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        search={search}
        onSearchChange={handleSearchChange}
      />
    </section>
  );
}
