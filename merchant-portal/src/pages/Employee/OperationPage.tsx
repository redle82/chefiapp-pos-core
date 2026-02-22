/**
 * Employee Operation - Operação ao Vivo
 *
 * Pergunta: "O que está acontecendo agora?"
 *
 * Componentes:
 * - Pedidos ativos
 * - KDS por estação
 * - Backlog visível
 * - Atrasos reais
 * - Ações rápidas permitidas
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomTabs } from "../../components/navigation/BottomTabs";
import { Header } from "../../components/navigation/Header";
import { EmptyState } from "../../components/ui/EmptyState";
import styles from "./OperationPage.module.css";

export function EmployeeOperationPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"orders" | "kds" | "tables">("orders");

  // TODO: Integrar com Core para buscar pedidos ativos
  // TODO: Buscar KDS por estação
  // TODO: Buscar backlog
  // TODO: Buscar atrasos reais

  const activeOrders = [
    {
      id: "123",
      table: "Mesa 5",
      status: "Em preparo",
      time: "12min / 15min",
      progress: 80,
    },
    {
      id: "124",
      table: "Mesa 12",
      status: "Aguardando",
      time: "5min / 15min",
      progress: 33,
    },
  ];

  const kdsByStation = {
    bar: { items: 3, delayed: 2 },
    kitchen: { items: 5, delayed: 0 },
  };

  const backlog = {
    waiting: 3,
    avgWaitTime: "8min",
  };

  const delays = [
    {
      table: "Mesa 5",
      delay: "3min",
      cause: "Item bloqueado (falta)",
      orderId: "123",
    },
  ];

  const getOrderTimeClassName = (progress: number) =>
    progress >= 80 ? styles.badgeWarning : styles.badgeSuccess;

  return (
    <div className={styles.page}>
      <Header
        title="Operação ao Vivo"
        subtitle="O que está acontecendo agora"
        actions={
          <div className={styles.filterActions}>
            <button
              onClick={() => setView("orders")}
              className={`${styles.filterButton} ${
                view === "orders" ? styles.filterButtonActive : ""
              }`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setView("kds")}
              className={`${styles.filterButton} ${
                view === "kds" ? styles.filterButtonActive : ""
              }`}
            >
              KDS
            </button>
            <button
              onClick={() => setView("tables")}
              className={`${styles.filterButton} ${
                view === "tables" ? styles.filterButtonActive : ""
              }`}
            >
              Mesas
            </button>
          </div>
        }
      />

      <div className={styles.content}>
        {view === "orders" && (
          <>
            {/* Pedidos Ativos */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                📋 PEDIDOS ATIVOS ({activeOrders.length})
              </h3>
              {activeOrders.length === 0 ? (
                <EmptyState title="Nenhum pedido ativo" />
              ) : (
                <div className={styles.ordersList}>
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() =>
                        navigate(`/employee/operation/order/${order.id}`)
                      }
                      className={styles.orderCard}
                    >
                      <div className={styles.orderHeader}>
                        <div>
                          <div className={styles.orderTitle}>
                            {order.table} - Pedido #{order.id}
                          </div>
                          <div className={styles.orderMeta}>
                            Status: {order.status}
                          </div>
                        </div>
                        <span
                          className={`${
                            styles.timeBadge
                          } ${getOrderTimeClassName(order.progress)}`}
                        >
                          {order.time}
                        </span>
                      </div>
                      <div className={styles.progressWrap}>
                        <div className={styles.progressLabel}>Progresso</div>
                        <progress
                          className={styles.progressBar}
                          value={order.progress}
                          max={100}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Backlog Visível */}
            {backlog.waiting > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>📦 BACKLOG VISÍVEL</h3>
                <div className={styles.infoCard}>
                  <div className={styles.infoLead}>
                    {backlog.waiting} pedido{backlog.waiting > 1 ? "s" : ""}{" "}
                    aguardando preparo
                  </div>
                  <div className={styles.infoText}>
                    Tempo médio de espera: {backlog.avgWaitTime}
                  </div>
                </div>
              </div>
            )}

            {/* Atrasos Reais */}
            {delays.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>⏰ ATRASOS REAIS</h3>
                <div className={styles.delayList}>
                  {delays.map((delay, index) => (
                    <div key={index} className={styles.delayCard}>
                      <div className={styles.delayTitle}>
                        {delay.table} - {delay.delay} atrasado
                      </div>
                      <div className={styles.delayCause}>
                        Causa: {delay.cause}
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/employee/operation/order/${delay.orderId}`)
                        }
                        className={styles.resolveButton}
                      >
                        Resolver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {view === "kds" && (
          <div>
            <h3 className={styles.sectionTitle}>🍳 KDS POR ESTAÇÃO</h3>
            <div className={styles.kdsList}>
              <div className={styles.kdsCard}>
                <div className={styles.kdsTitle}>
                  BAR: {kdsByStation.bar.items} itens
                </div>
                {kdsByStation.bar.delayed > 0 && (
                  <div className={styles.kdsWarning}>
                    ⚠️ {kdsByStation.bar.delayed} atrasado
                    {kdsByStation.bar.delayed > 1 ? "s" : ""}
                  </div>
                )}
                <button
                  onClick={() => navigate("/employee/operation/kitchen")}
                  className={styles.primarySmallButton}
                >
                  Ver KDS BAR
                </button>
              </div>
              <div className={styles.kdsCard}>
                <div className={styles.kdsTitle}>
                  KITCHEN: {kdsByStation.kitchen.items} itens
                </div>
                <div className={styles.kdsSuccess}>✅ Todos em tempo</div>
                <button
                  onClick={() => navigate("/employee/operation/kitchen")}
                  className={styles.primarySmallButton}
                >
                  Ver KDS KITCHEN
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "tables" && (
          <div>
            <h3 className={styles.sectionTitle}>🪑 MESAS</h3>
            <EmptyState
              title="Funcionalidade não ativa"
              message="A visualização de mesas será disponibilizada em breve"
            />
          </div>
        )}

        {/* Ações Rápidas */}
        <div className={styles.quickActions}>
          <button
            onClick={() => navigate("/employee/operation/new-order")}
            className={styles.primaryActionButton}
          >
            Novo Pedido
          </button>
          <button
            onClick={() => navigate("/employee/operation/kitchen")}
            className={styles.secondaryActionButton}
          >
            Ver KDS
          </button>
        </div>
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
