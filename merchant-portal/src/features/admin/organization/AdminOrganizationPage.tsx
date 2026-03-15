/**
 * AdminOrganizationPage — Organization management for the SaaS corporate layer.
 *
 * 4 sections:
 *   1. Company Info — name, slug, billing email, tax ID, country
 *   2. Plan & Limits — current plan tier, device/restaurant limits
 *   3. Restaurants — list of restaurants under this org
 *   4. Team — org member list with roles
 *
 * Rota: /admin/organization
 */

import { useFormatLocale } from "@/core/i18n/useFormatLocale";
import { useCallback, useEffect, useState } from "react";
import type {
  Organization,
  OrgMember,
} from "../../../../../billing-core/types";
import {
  getPlanDisplayName,
  getPlanLimits,
} from "../../../core/billing/featureGating";
import { Logger } from "../../../core/logger";
import { useTenant } from "../../../core/tenant/TenantContext";
import { AdminPageHeader } from "../dashboard/components/AdminPageHeader";
import styles from "./AdminOrganizationPage.module.css";
import {
  fetchOrganization,
  fetchOrgMembers,
  fetchOrgRestaurants,
} from "./api/orgApi";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrgRestaurant {
  id: string;
  name: string;
  status: string;
  billing_status: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function planBadgeClass(tier: string): string {
  switch (tier) {
    case "enterprise":
      return styles.planEnterprise;
    case "pro":
      return styles.planPro;
    case "starter":
      return styles.planStarter;
    case "trial":
      return styles.planTrial;
    default:
      return styles.planFree;
  }
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case "owner":
      return styles.roleOwner;
    case "admin":
      return styles.roleAdmin;
    case "billing":
      return styles.roleBilling;
    default:
      return styles.roleViewer;
  }
}

function statusDotClass(status: string): string {
  switch (status) {
    case "active":
      return styles.statusActive;
    case "draft":
      return styles.statusDraft;
    default:
      return styles.statusPaused;
  }
}

function limitBarFillClass(ratio: number): string {
  if (ratio >= 1) return styles.limitBarFillFull;
  if (ratio >= 0.75) return styles.limitBarFillWarn;
  return styles.limitBarFillOk;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** A progress bar that sets its width via a ref (no inline style). */
function LimitBarFill({ ratio }: { ratio: number }) {
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) {
        el.style.width = `${Math.min(100, ratio * 100)}%`;
      }
    },
    [ratio],
  );
  return (
    <div
      ref={ref}
      className={`${styles.limitBarFill} ${limitBarFillClass(ratio)}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminOrganizationPage() {
  const { organization: ctxOrg, planTier } = useTenant();
  const locale = useFormatLocale();

  const [org, setOrg] = useState<Organization | null>(ctxOrg);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [restaurants, setRestaurants] = useState<OrgRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── fetch data ── */
  const loadData = useCallback(async () => {
    const orgId = ctxOrg?.id;
    if (!orgId) {
      setLoading(false);
      return;
    }
    try {
      const [freshOrg, membersList, restaurantsList] = await Promise.all([
        fetchOrganization(orgId),
        fetchOrgMembers(orgId),
        fetchOrgRestaurants(orgId),
      ]);
      if (freshOrg) setOrg(freshOrg);
      setMembers(membersList);
      setRestaurants(restaurantsList as OrgRestaurant[]);
    } catch (err) {
      Logger.error("[AdminOrganizationPage] Failed to load org data:", err);
    } finally {
      setLoading(false);
    }
  }, [ctxOrg?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── derived ── */
  const tier = org?.plan_tier ?? planTier ?? "free";
  const limits = getPlanLimits(tier);
  const deviceCount = 0; // TODO: wire from gm_terminals count
  const restaurantCount = restaurants.length;

  /* ── loading / no-org states ── */
  if (loading) {
    return (
      <div className={styles.wrapper}>
        <AdminPageHeader title="Organização" subtitle="A carregar..." />
        <div className={styles.loading}>A carregar dados da organização…</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className={styles.wrapper}>
        <AdminPageHeader title="Organização" subtitle="Gestão da sua empresa" />
        <div className={styles.noOrg}>
          <p className={styles.noOrgTitle}>Sem organização associada</p>
          <p className={styles.noOrgDesc}>
            O seu restaurante ainda não está ligado a uma organização. Esta
            funcionalidade será ativada automaticamente quando a sua conta for
            migrada para o novo modelo SaaS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} page-enter admin-content-page`}>
      <AdminPageHeader title="Organização" subtitle={org.name} />

      {/* ── Section 1: Company Info ── */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Informações da Empresa</h3>
        <p className={styles.sectionDesc}>
          Dados legais e de faturação da sua organização.
        </p>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nome</span>
            <span className={styles.infoValue}>{org.name}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Slug</span>
            <span className={styles.infoValue}>{org.slug}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email de Faturação</span>
            <span className={styles.infoValue}>{org.billing_email ?? "—"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>NIF / Tax ID</span>
            <span className={styles.infoValue}>{org.tax_id ?? "—"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>País</span>
            <span className={styles.infoValue}>{org.country}</span>
          </div>
        </div>
      </div>

      {/* ── Section 2: Plan & Limits ── */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Plano & Limites</h3>
        <p className={styles.sectionDesc}>
          O seu plano define os dispositivos e funcionalidades disponíveis.
        </p>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Plano Atual</span>
            <span className={`${styles.planBadge} ${planBadgeClass(tier)}`}>
              {getPlanDisplayName(tier)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Restaurantes</span>
            <span className={styles.infoValue}>
              {restaurantCount} / {limits.max_restaurants}
            </span>
            <div className={styles.limitBar}>
              <div className={styles.limitBarTrack}>
                <LimitBarFill
                  ratio={restaurantCount / limits.max_restaurants}
                />
              </div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Dispositivos</span>
            <span className={styles.infoValue}>
              {deviceCount} / {limits.max_devices}
            </span>
            <div className={styles.limitBar}>
              <div className={styles.limitBarTrack}>
                <LimitBarFill ratio={deviceCount / limits.max_devices} />
              </div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Integrações</span>
            <span className={styles.infoValue}>
              0 / {limits.max_integrations}
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 3: Restaurants ── */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Restaurantes</h3>
        <p className={styles.sectionDesc}>
          Restaurantes pertencentes a esta organização.
        </p>
        {restaurants.length === 0 ? (
          <div className={styles.emptyState}>
            Nenhum restaurante registado nesta organização.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Estado</th>
                <th>Faturação</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>
                    <span
                      className={`${styles.statusDot} ${statusDotClass(
                        r.status,
                      )}`}
                    />
                    {r.status}
                  </td>
                  <td>{r.billing_status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Section 4: Team ── */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Equipa</h3>
        <p className={styles.sectionDesc}>
          Membros com acesso à gestão desta organização.
        </p>
        {members.length === 0 ? (
          <div className={styles.emptyState}>Nenhum membro registado.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Utilizador</th>
                <th>Função</th>
                <th>Desde</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.user_id}</td>
                  <td>
                    <span
                      className={`${styles.roleBadge} ${roleBadgeClass(
                        m.role,
                      )}`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td>
                    {m.created_at
                      ? new Date(m.created_at).toLocaleDateString(locale)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
