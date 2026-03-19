/**
 * ReservationListView -- Filterable/sortable table of all reservations.
 *
 * Used as the "List" tab inside ReservationsPage.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { colors } from "../../../ui/design-system/tokens/colors";
import type { ReservationRow, ReservationStatus } from "./reservationTypes";
import { STATUS_COLORS, formatDate } from "./reservationUtils";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ReservationListViewProps {
  restaurantId: string;
  onSelectReservation?: (reservation: ReservationRow) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ReservationListView({
  restaurantId,
  onSelectReservation,
}: ReservationListViewProps) {
  const { t } = useTranslation("reservations");
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<"date" | "time" | "name" | "party">("date");
  const [sortAsc, setSortAsc] = useState(true);

  // Fetch
  const fetchReservations = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      let query = dockerCoreClient
        .from("gm_reservations")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("reservation_date", { ascending: false })
        .order("reservation_time", { ascending: true })
        .limit(200);

      if (filterDate) {
        query = query.eq("reservation_date", filterDate);
      }
      if (filterStatus && filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (!error && data) {
        setReservations(data as ReservationRow[]);
      } else {
        setReservations([]);
      }
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterDate, filterStatus]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Sort
  const sorted = useMemo(() => {
    const items = [...reservations];
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = a.reservation_date.localeCompare(b.reservation_date);
          if (cmp === 0)
            cmp = a.reservation_time.localeCompare(b.reservation_time);
          break;
        case "time":
          cmp = a.reservation_time.localeCompare(b.reservation_time);
          break;
        case "name":
          cmp = a.customer_name.localeCompare(b.customer_name);
          break;
        case "party":
          cmp = a.party_size - b.party_size;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return items;
  }, [reservations, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const allStatuses: ReservationStatus[] = [
    "CONFIRMED",
    "PENDING",
    "SEATED",
    "COMPLETED",
    "NO_SHOW",
    "CANCELLED",
  ];

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: 13,
    borderRadius: 6,
    border: `1px solid ${colors.border.subtle}`,
    backgroundColor: colors.surface.layer2,
    color: colors.text.primary,
    outline: "none",
  };

  const headerCellStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: colors.text.secondary,
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const cellStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 13,
    color: colors.text.primary,
    borderTop: "1px solid rgba(255,255,255,0.04)",
  };

  const sortIndicator = (field: typeof sortField) => {
    if (sortField !== field) return "";
    return sortAsc ? " \u25B2" : " \u25BC";
  };

  return (
    <div
      style={{
        backgroundColor: colors.surface.layer1,
        borderRadius: 12,
        border: `1px solid ${colors.border.subtle}`,
        overflow: "hidden",
      }}
    >
      {/* Filters */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <input
          type="date"
          style={inputStyle}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          placeholder={t("filterByDate")}
        />
        <select
          style={inputStyle}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">{t("allStatuses")}</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        {(filterDate || filterStatus !== "all") && (
          <button
            onClick={() => {
              setFilterDate("");
              setFilterStatus("all");
            }}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              backgroundColor: "rgba(239,68,68,0.1)",
              color: "#f87171",
            }}
          >
            {t("clearFilters")}
          </button>
        )}
        <div
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: colors.text.tertiary,
            alignSelf: "center",
          }}
        >
          {t("totalResults", { count: sorted.length })}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        {loading ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: colors.text.secondary,
            }}
          >
            {t("loading")}
          </div>
        ) : sorted.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: colors.text.tertiary,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {t("noResults")}
            </div>
            <div style={{ fontSize: 12 }}>{t("noResultsHint")}</div>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 700,
            }}
          >
            <thead>
              <tr>
                <th
                  style={headerCellStyle}
                  onClick={() => handleSort("date")}
                >
                  {t("date")}
                  {sortIndicator("date")}
                </th>
                <th
                  style={headerCellStyle}
                  onClick={() => handleSort("time")}
                >
                  {t("time")}
                  {sortIndicator("time")}
                </th>
                <th
                  style={headerCellStyle}
                  onClick={() => handleSort("name")}
                >
                  {t("customerName")}
                  {sortIndicator("name")}
                </th>
                <th
                  style={headerCellStyle}
                  onClick={() => handleSort("party")}
                >
                  {t("partySize")}
                  {sortIndicator("party")}
                </th>
                <th style={{ ...headerCellStyle, cursor: "default" }}>
                  {t("statusLabel")}
                </th>
                <th style={{ ...headerCellStyle, cursor: "default" }}>
                  {t("phone")}
                </th>
                <th style={{ ...headerCellStyle, cursor: "default" }}>
                  {t("source")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const statusInfo =
                  STATUS_COLORS[r.status] || STATUS_COLORS.CONFIRMED;
                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectReservation?.(r)}
                    style={{
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent";
                    }}
                  >
                    <td style={cellStyle}>{r.reservation_date}</td>
                    <td style={cellStyle}>
                      {r.reservation_time.slice(0, 5)}
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        fontWeight: 600,
                      }}
                    >
                      {r.customer_name}
                    </td>
                    <td style={cellStyle}>{r.party_size}</td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.text,
                        }}
                      >
                        {t(`status.${r.status}`)}
                      </span>
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        color: colors.text.tertiary,
                      }}
                    >
                      {r.customer_phone || "-"}
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        color: colors.text.tertiary,
                        fontSize: 12,
                      }}
                    >
                      {r.source || "internal"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
