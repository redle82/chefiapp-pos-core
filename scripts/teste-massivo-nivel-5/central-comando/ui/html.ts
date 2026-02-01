/**
 * Gerador de HTML do Central de Comando
 *
 * Renderiza todas as camadas de monitoramento em uma interface unificada
 */

import type { CentralCommandMetrics } from "../index";
import type { ViewMode } from "../views/index";
import { getViewConfig } from "../views/index";

export function createHTML(
  metrics: CentralCommandMetrics,
  viewMode: ViewMode,
  startTime: Date,
): string {
  const config = getViewConfig(viewMode);
  const elapsed = Date.now() - startTime.getTime();

  // Coletar todos os alertas
  const allAlerts = [
    ...(metrics.infrastructure?.alerts || []),
    ...(metrics.database?.alerts || []),
    ...(metrics.events?.alerts || []),
    ...(metrics.tasks?.alerts || []),
    ...(metrics.operation?.alerts || []),
    ...(metrics.users?.alerts || []),
  ].sort((a, b) => {
    const severityOrder: Record<string, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    };
    return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎯 Central de Comando - ChefIApp</title>
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <div class="container${viewMode === "owner" ? " owner-mode" : ""}">
    ${
      viewMode === "owner"
        ? createOwnerLayout(metrics, viewMode, elapsed, allAlerts, config)
        : `
        ${createHeader(metrics, viewMode, elapsed, allAlerts)}
        ${createModeSelector(viewMode)}
        ${createAlertsSection(allAlerts, config)}
        ${createTestProgressSection(metrics.testProgress, config)}
        ${createInfrastructureSection(metrics.infrastructure, config)}
        ${createDatabaseSection(metrics.database, config)}
        ${createEventsSection(metrics.events, config)}
        ${createTasksSection(metrics.tasks, config)}
        ${createOperationSection(metrics.operation, config)}
        ${createUsersSection(metrics.users, config)}
        ${createFooter(config)}
      `
    }
  </div>
  <script>
    ${getScript(config)}
  </script>
</body>
</html>`;
}

function createHeader(
  metrics: any,
  viewMode: ViewMode,
  elapsed: number,
  alerts: any[],
): string {
  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
  const warningAlerts = alerts.filter((a) => a.severity === "warning").length;

  return `
    <div class="header">
      <h1>🎯 Central de Comando - ChefIApp</h1>
      <div class="header-subtitle">Sistema Nervoso Visível do Restaurant Operating System</div>

      <div class="header-stats">
        <div class="header-stat">
          <div class="header-stat-label">⏱️ Tempo Ativo</div>
          <div class="header-stat-value">${formatDuration(elapsed)}</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-label">🔴 Alertas Críticos</div>
          <div class="header-stat-value ${
            criticalAlerts > 0 ? "critical" : ""
          }">${criticalAlerts}</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-label">⚠️ Avisos</div>
          <div class="header-stat-value ${
            warningAlerts > 0 ? "warning" : ""
          }">${warningAlerts}</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-label">📊 Modo</div>
          <div class="header-stat-value">${getModeName(viewMode)}</div>
        </div>
      </div>
    </div>
  `;
}

function createModeSelector(currentMode: ViewMode): string {
  const modes: { mode: ViewMode; label: string; icon: string }[] = [
    { mode: "owner", label: "Dono", icon: "🏠" },
    { mode: "laboratory", label: "Laboratório", icon: "🧪" },
    { mode: "operational", label: "Operacional", icon: "🧠" },
    { mode: "executive", label: "Executivo", icon: "👔" },
    { mode: "audit", label: "Auditoria", icon: "⚖️" },
  ];

  return `
    <div class="mode-selector">
      ${modes
        .map(
          (m) => `
        <a href="?mode=${m.mode}" class="mode-btn ${
            currentMode === m.mode ? "active" : ""
          }">
          ${m.icon} ${m.label}
        </a>
      `,
        )
        .join("")}
    </div>
  `;
}

function createAlertsSection(alerts: any[], config: any): string {
  if (!config.showAlerts || alerts.length === 0) return "";

  const critical = alerts.filter((a) => a.severity === "critical");
  const warning = alerts.filter((a) => a.severity === "warning");

  return `
    <div class="section alerts-section">
      <h2>🚨 Alertas Ativos</h2>
      ${
        critical.length > 0
          ? `
        <div class="alert-group critical">
          <h3>🔴 Críticos (${critical.length})</h3>
          ${critical
            .slice(0, 10)
            .map(
              (a) => `
            <div class="alert-item critical">
              <strong>${a.message}</strong>
              ${
                a.container
                  ? `<span class="alert-context">Container: ${a.container}</span>`
                  : ""
              }
              ${
                a.restaurantId
                  ? `<span class="alert-context">Restaurante: ${a.restaurantId.substring(
                      0,
                      8,
                    )}...</span>`
                  : ""
              }
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }
      ${
        warning.length > 0
          ? `
        <div class="alert-group warning">
          <h3>⚠️ Avisos (${warning.length})</h3>
          ${warning
            .slice(0, 10)
            .map(
              (a) => `
            <div class="alert-item warning">
              <strong>${a.message}</strong>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
}

function createTestProgressSection(testProgress: any, config: any): string {
  if (!testProgress || !testProgress.phases) return "";

  const phases = testProgress.phases;
  const completed = phases.filter((p: any) => p.status === "complete").length;
  const total = phases.length;
  const progress = (completed / total) * 100;

  return `
    <div class="section test-progress-section" id="test-progress-section">
      <h2>🧪 Progresso do Teste</h2>
      ${
        testProgress.runId
          ? `<div class="run-id">Run ID: ${testProgress.runId}</div>`
          : ""
      }
      <div class="progress-summary">
        <div class="progress-bar-large">
          <div class="progress-bar-fill" style="width: ${progress}%"></div>
          <div class="progress-bar-text">${completed} / ${total} fases completas (${Math.round(
    progress,
  )}%)</div>
        </div>
      </div>
      <div class="phases-grid">
        ${phases
          .map((phase: any) => {
            const icon =
              phase.status === "complete"
                ? "✅"
                : phase.status === "running"
                ? "🔄"
                : phase.status === "failed"
                ? "❌"
                : "⏳";
            const progressInfo =
              phase.current !== undefined && phase.total !== undefined
                ? `<div class="phase-progress">${phase.current} / ${
                    phase.total
                  } (${Math.floor((phase.current / phase.total) * 100)}%)</div>`
                : "";
            return `
            <div class="phase-card ${phase.status}">
              <div class="phase-icon">${icon}</div>
              <div class="phase-name">${phase.name}</div>
              ${progressInfo}
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function createInfrastructureSection(infra: any, config: any): string {
  if (!infra || (!config.showTechnicalDetails && config.mode !== "laboratory"))
    return "";

  const containers = infra.containers || [];
  const system = infra.system || {};
  const alerts = infra.alerts || [];

  return `
    <div class="section infrastructure-section">
      <h2>🔹 Infraestrutura (Docker/Host)</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">CPU Sistema</div>
          <div class="metric-value">${system.cpu?.total?.toFixed(1) || 0}%</div>
          <div class="metric-bar">
            <div class="metric-bar-fill" style="width: ${
              system.cpu?.total || 0
            }%; background: ${
    (system.cpu?.total || 0) > 90 ? "#dc3545" : "#28a745"
  };"></div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">RAM Sistema</div>
          <div class="metric-value">${
            system.memory?.percentage?.toFixed(1) || 0
          }%</div>
          <div class="metric-bar">
            <div class="metric-bar-fill" style="width: ${
              system.memory?.percentage || 0
            }%; background: ${
    (system.memory?.percentage || 0) > 95 ? "#dc3545" : "#28a745"
  };"></div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Containers Ativos</div>
          <div class="metric-value">${
            containers.filter((c: any) => c.status === "running").length
          } / ${containers.length}</div>
        </div>
      </div>
      ${
        containers.length > 0
          ? `
        <div class="containers-list">
          <h3>Containers</h3>
          ${containers
            .slice(0, 10)
            .map(
              (c: any) => `
            <div class="container-item ${c.status}">
              <div class="container-name">${c.name}</div>
              <div class="container-stats">
                <span>CPU: ${c.cpu?.usage?.toFixed(1) || 0}%</span>
                <span>RAM: ${c.memory?.percentage?.toFixed(1) || 0}%</span>
                <span>Status: ${c.status}</span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }
      <div class="docker-stream-section">
        <h3>🧵 Fluxo em Tempo Real do Docker</h3>
        <div id="docker-events-stream" class="docker-events-stream">
          <div class="docker-events-placeholder">
            Conectando ao Docker... se nada aparecer, verifique se o Docker está rodando.
          </div>
        </div>
      </div>
    </div>
  `;
}

function createDatabaseSection(db: any, config: any): string {
  if (!db || (!config.showTechnicalDetails && config.mode !== "laboratory"))
    return "";

  const perf = db.performance || {};
  const locks = db.locks || {};
  const eventStore = db.eventStore || {};

  return `
    <div class="section database-section">
      <h2>🔹 Banco de Dados (Postgres)</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">TPS Total</div>
          <div class="metric-value">${perf.tps?.total || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Latência P95</div>
          <div class="metric-value">${
            perf.queryLatency?.p95?.toFixed(0) || 0
          }ms</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Locks Ativos</div>
          <div class="metric-value">${locks.active || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Eventos/seg</div>
          <div class="metric-value">${eventStore.eventsPerSecond || 0}</div>
        </div>
      </div>
      ${
        perf.slowQueries && perf.slowQueries.length > 0
          ? `
        <div class="slow-queries">
          <h3>Queries Lentas</h3>
          ${perf.slowQueries
            .slice(0, 5)
            .map(
              (q: any) => `
            <div class="query-item">
              <div class="query-text">${q.query.substring(0, 100)}...</div>
              <div class="query-stats">${q.meanTime.toFixed(0)}ms (${
                q.calls
              } chamadas)</div>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
}

function createEventsSection(events: any, config: any): string {
  if (!events || (!config.showTechnicalDetails && config.mode !== "laboratory"))
    return "";

  const rate = events.rate || {};
  const types = events.types || {};
  const processing = events.processing || {};

  return `
    <div class="section events-section">
      <h2>🔹 Event System</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Eventos/seg</div>
          <div class="metric-value">${rate.eventsPerSecond || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Backlog</div>
          <div class="metric-value">${processing.backlog || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Latência P95</div>
          <div class="metric-value">${
            processing.latency?.p95?.toFixed(0) || 0
          }ms</div>
        </div>
      </div>
      <div class="event-types">
        <h3>Tipos de Evento</h3>
        <div class="event-types-grid">
          <div class="event-type-item">Pedidos Criados: ${
            types.orderCreated || 0
          }</div>
          <div class="event-type-item">Pedidos Cancelados: ${
            types.orderCancelled || 0
          }</div>
          <div class="event-type-item">Tasks Criadas: ${
            types.taskCreated || 0
          }</div>
        </div>
      </div>
    </div>
  `;
}

function createTasksSection(tasks: any, config: any): string {
  if (!tasks) return "";

  const creation = tasks.creation || {};
  const sla = tasks.sla || {};
  const distribution = tasks.distribution || {};

  return `
    <div class="section tasks-section">
      <h2>🔹 Task Engine</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Criadas/seg</div>
          <div class="metric-value">${creation.createdPerSecond || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Resolvidas/seg</div>
          <div class="metric-value">${creation.resolvedPerSecond || 0}</div>
        </div>
        <div class="metric-card ${sla.violated > 0 ? "critical" : ""}">
          <div class="metric-label">SLA Violados</div>
          <div class="metric-value">${sla.violated || 0}</div>
        </div>
        <div class="metric-card ${sla.atRisk > 0 ? "warning" : ""}">
          <div class="metric-label">SLA em Risco</div>
          <div class="metric-value">${sla.atRisk || 0}</div>
        </div>
      </div>
      ${
        sla.violationRate > 0
          ? `
        <div class="sla-warning">
          <strong>Taxa de violação de SLA: ${sla.violationRate.toFixed(
            1,
          )}%</strong>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function createOperationSection(operation: any, config: any): string {
  if (!operation) return "";

  const restaurants = operation.restaurants || {};
  const orders = operation.orders || {};
  const kds = operation.kds || {};
  const stock = operation.stock || {};

  return `
    <div class="section operation-section">
      <h2>🔹 Operação (Restaurantes)</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Restaurantes Ativos</div>
          <div class="metric-value">${restaurants.active || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Restaurantes Offline</div>
          <div class="metric-value ${
            restaurants.offline > 0 ? "warning" : ""
          }">${restaurants.offline || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Pedidos em Progresso</div>
          <div class="metric-value">${orders.inProgress || 0}</div>
        </div>
        <div class="metric-card ${orders.delayed > 0 ? "warning" : ""}">
          <div class="metric-label">Pedidos Atrasados</div>
          <div class="metric-value">${orders.delayed || 0}</div>
        </div>
        <div class="metric-card ${
          stock.critical?.length > 0 ? "critical" : ""
        }">
          <div class="metric-label">Estoque Crítico</div>
          <div class="metric-value">${stock.critical?.length || 0}</div>
        </div>
        <div class="metric-card ${kds.congested?.length > 0 ? "warning" : ""}">
          <div class="metric-label">KDS Congestionado</div>
          <div class="metric-value">${kds.congested?.length || 0}</div>
        </div>
      </div>
      ${
        stock.critical && stock.critical.length > 0
          ? `
        <div class="stock-critical">
          <h3>Estoque Crítico (Top 10)</h3>
          ${stock.critical
            .slice(0, 10)
            .map(
              (item: any) => `
            <div class="stock-item">
              <strong>${item.ingredientName}</strong> em ${item.location}
              <span class="stock-level">${item.current} / ${
                item.minimum
              } (${item.percentage.toFixed(0)}%)</span>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
}

function createUsersSection(users: any, config: any): string {
  if (!users || (!config.showTechnicalDetails && config.mode !== "laboratory"))
    return "";

  const active = users.active || {};

  return `
    <div class="section users-section">
      <h2>🔹 Usuários & Dispositivos</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Garçons Ativos</div>
          <div class="metric-value">${active.waiters || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Cozinheiros Ativos</div>
          <div class="metric-value">${active.kitchen || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Bar Ativo</div>
          <div class="metric-value">${active.bar || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Gerentes Ativos</div>
          <div class="metric-value">${active.managers || 0}</div>
        </div>
      </div>
    </div>
  `;
}

function createFooter(config: any): string {
  return `
    <div class="footer">
      <div class="footer-info">
        <div>🔄 Atualização automática a cada ${
          config.updateInterval
        } segundos</div>
        <div>📊 Modo: ${getModeName(config.mode)}</div>
        <div>⏰ Última atualização: <span id="last-update">${new Date().toLocaleTimeString()}</span></div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OWNER MODE - Zero Technical Metrics, 100% Business Focus
// ═══════════════════════════════════════════════════════════════════════════════

function createOwnerLayout(
  metrics: any,
  viewMode: ViewMode,
  elapsed: number,
  allAlerts: any[],
  config: any,
): string {
  const operation = metrics.operation || {};
  const tasks = metrics.tasks || {};
  const orders = operation.orders || {};
  const stock = operation.stock || {};
  const kds = operation.kds || {};
  const restaurants = operation.restaurants || {};

  // Gerar ações recomendadas com base nos dados
  const actions = generateRecommendedActions(operation, tasks, allAlerts);
  const criticalAlerts = allAlerts.filter(
    (a) => a.severity === "critical",
  ).length;

  return `
    ${createOwnerHeader(criticalAlerts, orders)}
    ${createModeSelector(viewMode)}
    ${createActionRecommendationsSection(actions)}
    ${createBusinessHealthSection(orders, restaurants)}
    ${createCustomerSatisfactionSection(tasks, kds)}
    ${createKitchenFlowSection(kds, orders)}
    ${createStockSection(stock)}
    ${createOwnerFooter(config)}
  `;
}

function createOwnerHeader(criticalAlerts: number, orders: any): string {
  const statusIcon = criticalAlerts > 0 ? "⚠️" : "✅";
  const statusText =
    criticalAlerts > 0 ? "Precisa de atenção" : "Tudo funcionando";
  const statusClass = criticalAlerts > 0 ? "needs-attention" : "all-good";

  return `
    <div class="header owner-header">
      <div class="owner-header-main">
        <h1>🏠 Meu Restaurante</h1>
        <div class="owner-status ${statusClass}">
          ${statusIcon} ${statusText}
        </div>
      </div>
      <div class="owner-quick-stats">
        <div class="quick-stat">
          <span class="quick-stat-value">${orders.inProgress || 0}</span>
          <span class="quick-stat-label">Pedidos Ativos</span>
        </div>
        <div class="quick-stat ${(orders.delayed || 0) > 0 ? "warning" : ""}">
          <span class="quick-stat-value">${orders.delayed || 0}</span>
          <span class="quick-stat-label">Atrasados</span>
        </div>
      </div>
    </div>
  `;
}

function generateRecommendedActions(
  operation: any,
  tasks: any,
  alerts: any[],
): any[] {
  const actions: any[] = [];

  // Prioridade 1: Alertas críticos
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  for (const alert of criticalAlerts.slice(0, 2)) {
    actions.push({
      priority: "high",
      icon: "🔴",
      title: alert.message,
      action: "Verificar agora",
    });
  }

  // Prioridade 2: Estoque crítico
  const criticalStock = operation.stock?.critical || [];
  if (criticalStock.length > 0) {
    actions.push({
      priority: "medium",
      icon: "📦",
      title: `${criticalStock.length} ${
        criticalStock.length === 1 ? "item" : "itens"
      } com estoque crítico`,
      action: "Verificar reposição",
    });
  }

  // Prioridade 3: KDS congestionado
  const congested = operation.kds?.congested || [];
  if (congested.length > 0) {
    actions.push({
      priority: "medium",
      icon: "🍳",
      title: "Cozinha com acúmulo de pedidos",
      action: "Monitorar fluxo",
    });
  }

  // Prioridade 4: SLA em risco
  const slaAtRisk = tasks.sla?.atRisk || 0;
  if (slaAtRisk > 0) {
    actions.push({
      priority: "low",
      icon: "⏱️",
      title: `${slaAtRisk} tarefas próximas do prazo`,
      action: "Acompanhar",
    });
  }

  // Se não há nada urgente
  if (actions.length === 0) {
    actions.push({
      priority: "info",
      icon: "✅",
      title: "Tudo sob controle",
      action: "Continue acompanhando",
    });
  }

  return actions.slice(0, 3);
}

function createActionRecommendationsSection(actions: any[]): string {
  return `
    <div class="section action-section">
      <h2>🎯 O Que Fazer Agora</h2>
      <div class="actions-list">
        ${actions
          .map(
            (a, i) => `
          <div class="action-card priority-${a.priority}">
            <div class="action-number">${i + 1}</div>
            <div class="action-icon">${a.icon}</div>
            <div class="action-content">
              <div class="action-title">${a.title}</div>
              <div class="action-cta">${a.action}</div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function createBusinessHealthSection(orders: any, restaurants: any): string {
  const totalOrders = (orders.completed || 0) + (orders.inProgress || 0);

  return `
    <div class="section business-section">
      <h2>💰 Saúde do Negócio</h2>
      <div class="business-grid">
        <div class="business-card primary">
          <div class="business-icon">📋</div>
          <div class="business-value">${totalOrders}</div>
          <div class="business-label">Pedidos Hoje</div>
        </div>
        <div class="business-card">
          <div class="business-icon">✅</div>
          <div class="business-value">${orders.completed || 0}</div>
          <div class="business-label">Concluídos</div>
        </div>
        <div class="business-card">
          <div class="business-icon">🔄</div>
          <div class="business-value">${orders.inProgress || 0}</div>
          <div class="business-label">Em Preparo</div>
        </div>
        <div class="business-card ${
          (orders.cancelled || 0) > 0 ? "warning" : ""
        }">
          <div class="business-icon">❌</div>
          <div class="business-value">${orders.cancelled || 0}</div>
          <div class="business-label">Cancelados</div>
        </div>
      </div>
    </div>
  `;
}

function createCustomerSatisfactionSection(tasks: any, kds: any): string {
  const sla = tasks.sla || {};
  const avgWaitTime = kds.avgWaitTime || 0;
  const violationRate = sla.violationRate || 0;

  // Determinar status do cliente
  let satisfactionStatus = "😊 Excelente";
  let satisfactionClass = "good";
  if (violationRate > 20) {
    satisfactionStatus = "😟 Precisa melhorar";
    satisfactionClass = "bad";
  } else if (violationRate > 10) {
    satisfactionStatus = "😐 Regular";
    satisfactionClass = "medium";
  }

  return `
    <div class="section satisfaction-section">
      <h2>😊 Satisfação do Cliente</h2>
      <div class="satisfaction-grid">
        <div class="satisfaction-main ${satisfactionClass}">
          <div class="satisfaction-emoji">${
            satisfactionStatus.split(" ")[0]
          }</div>
          <div class="satisfaction-status">${
            satisfactionStatus.split(" ")[1]
          }</div>
        </div>
        <div class="satisfaction-details">
          <div class="satisfaction-detail">
            <span class="detail-label">Pedidos no prazo</span>
            <span class="detail-value">${(100 - violationRate).toFixed(
              0,
            )}%</span>
          </div>
          <div class="satisfaction-detail">
            <span class="detail-label">Em risco de atraso</span>
            <span class="detail-value ${
              (sla.atRisk || 0) > 0 ? "warning" : ""
            }">${sla.atRisk || 0}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createKitchenFlowSection(kds: any, orders: any): string {
  const congested = kds.congested || [];
  const isFlowing = congested.length === 0;

  return `
    <div class="section kitchen-section">
      <h2>🍳 Fluxo da Cozinha</h2>
      <div class="kitchen-status ${isFlowing ? "flowing" : "congested"}">
        <div class="kitchen-indicator">
          ${isFlowing ? "✅ Fluindo bem" : "⚠️ Acúmulo detectado"}
        </div>
        ${
          !isFlowing
            ? `
          <div class="kitchen-details">
            ${congested
              .slice(0, 3)
              .map(
                (c: any) => `
              <div class="kitchen-item">${c.station || "Estação"}: ${
                  c.pending || 0
                } itens aguardando</div>
            `,
              )
              .join("")}
          </div>
        `
            : `
          <div class="kitchen-details">
            <div class="kitchen-item">🟢 ${
              orders.inProgress || 0
            } pedidos em preparação</div>
          </div>
        `
        }
      </div>
    </div>
  `;
}

function createStockSection(stock: any): string {
  const critical = stock.critical || [];
  const low = stock.low || [];

  if (critical.length === 0 && low.length === 0) {
    return `
      <div class="section stock-section">
        <h2>📦 Estoque</h2>
        <div class="stock-ok">
          <span class="stock-ok-icon">✅</span>
          <span class="stock-ok-text">Estoque em dia</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="section stock-section">
      <h2>📦 Estoque</h2>
      ${
        critical.length > 0
          ? `
        <div class="stock-alert critical">
          <div class="stock-alert-header">🔴 Crítico (${critical.length} ${
              critical.length === 1 ? "item" : "itens"
            })</div>
          <div class="stock-items">
            ${critical
              .slice(0, 5)
              .map(
                (item: any) => `
              <div class="stock-item">${
                item.ingredientName || item.name || "Item"
              }</div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }
      ${
        low.length > 0
          ? `
        <div class="stock-alert warning">
          <div class="stock-alert-header">🟡 Baixo (${low.length} ${
              low.length === 1 ? "item" : "itens"
            })</div>
          <div class="stock-items">
            ${low
              .slice(0, 5)
              .map(
                (item: any) => `
              <div class="stock-item">${
                item.ingredientName || item.name || "Item"
              }</div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function createOwnerFooter(config: any): string {
  return `
    <div class="footer owner-footer">
      <div>⏰ Atualiza a cada ${config.updateInterval} segundos</div>
      <div>Última atualização: <span id="last-update">${new Date().toLocaleTimeString()}</span></div>
    </div>
  `;
}

function getStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: #333;
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-align: center;
    }
    .header-subtitle {
      text-align: center;
      opacity: 0.9;
      font-size: 1.1em;
      margin-bottom: 20px;
    }
    .header-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .header-stat {
      background: rgba(255,255,255,0.2);
      padding: 15px;
      border-radius: 10px;
      text-align: center;
    }
    .header-stat-label {
      font-size: 0.9em;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .header-stat-value {
      font-size: 2em;
      font-weight: bold;
    }
    .header-stat-value.critical { color: #ff6b6b; }
    .header-stat-value.warning { color: #ffd93d; }
    .mode-selector {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .mode-btn {
      padding: 12px 24px;
      border-radius: 10px;
      text-decoration: none;
      color: #333;
      background: #f0f0f0;
      font-weight: 500;
      transition: all 0.3s;
    }
    .mode-btn:hover {
      background: #e0e0e0;
      transform: translateY(-2px);
    }
    .mode-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .section {
      margin: 30px 0;
      padding: 25px;
      background: #f8f9fa;
      border-radius: 15px;
    }
    .section h2 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 1.5em;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-card.critical {
      border-left: 4px solid #dc3545;
    }
    .metric-card.warning {
      border-left: 4px solid #ffc107;
    }
    .metric-label {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 10px;
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #333;
    }
    .metric-value.critical { color: #dc3545; }
    .metric-value.warning { color: #ffc107; }
    .metric-bar {
      margin-top: 10px;
      background: #e0e0e0;
      border-radius: 5px;
      height: 8px;
      overflow: hidden;
    }
    .metric-bar-fill {
      height: 100%;
      transition: width 0.3s ease;
    }
    .alert-item {
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      border-left: 4px solid;
    }
    .alert-item.critical {
      background: #f8d7da;
      border-color: #dc3545;
      color: #721c24;
    }
    .alert-item.warning {
      background: #fff3cd;
      border-color: #ffc107;
      color: #856404;
    }
    .alert-context {
      display: block;
      font-size: 0.85em;
      opacity: 0.8;
      margin-top: 5px;
    }
    .phases-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }
    .phase-card {
      background: white;
      padding: 15px;
      border-radius: 10px;
      border-left: 4px solid #ccc;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .phase-card.running { border-color: #17a2b8; background: #e7f3ff; }
    .phase-card.complete { border-color: #28a745; background: #d4edda; }
    .phase-card.failed { border-color: #dc3545; background: #f8d7da; }
    .phase-icon { font-size: 1.5em; }
    .phase-name { flex: 1; font-weight: 500; }
    .phase-progress {
      font-size: 0.85em;
      color: #666;
    }
    .progress-bar-large {
      background: #e0e0e0;
      border-radius: 10px;
      height: 40px;
      position: relative;
      overflow: hidden;
      margin: 20px 0;
    }
    .progress-bar-fill {
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      height: 100%;
      transition: width 0.3s ease;
    }
    .progress-bar-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-weight: bold;
      color: #333;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
    .footer-info {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    /* ═══════════════════════════════════════════════════ */
    /* OWNER MODE STYLES */
    /* ═══════════════════════════════════════════════════ */

    .container.owner-mode {
      max-width: 900px;
    }

    .owner-header {
      background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
      text-align: center;
    }

    .owner-header h1 {
      font-size: 2em;
      margin-bottom: 15px;
    }

    .owner-header-main {
      margin-bottom: 20px;
    }

    .owner-status {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
    }

    .owner-status.all-good {
      background: rgba(40, 167, 69, 0.3);
      color: #90EE90;
    }

    .owner-status.needs-attention {
      background: rgba(255, 193, 7, 0.3);
      color: #FFD93D;
    }

    .owner-quick-stats {
      display: flex;
      justify-content: center;
      gap: 30px;
    }

    .quick-stat {
      text-align: center;
    }

    .quick-stat.warning .quick-stat-value {
      color: #FFD93D;
    }

    .quick-stat-value {
      display: block;
      font-size: 2.5em;
      font-weight: bold;
    }

    .quick-stat-label {
      font-size: 0.9em;
      opacity: 0.9;
    }

    /* Action Section */
    .action-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .action-section h2 {
      color: white;
    }

    .actions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 15px;
      background: rgba(255,255,255,0.15);
      padding: 15px 20px;
      border-radius: 12px;
      border-left: 4px solid white;
    }

    .action-card.priority-high {
      border-left-color: #ff6b6b;
      background: rgba(255, 107, 107, 0.2);
    }

    .action-card.priority-medium {
      border-left-color: #ffd93d;
    }

    .action-card.priority-low {
      border-left-color: #74b9ff;
    }

    .action-card.priority-info {
      border-left-color: #00cec9;
    }

    .action-number {
      width: 30px;
      height: 30px;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .action-icon {
      font-size: 1.5em;
    }

    .action-content {
      flex: 1;
    }

    .action-title {
      font-weight: 600;
      margin-bottom: 3px;
    }

    .action-cta {
      font-size: 0.85em;
      opacity: 0.9;
    }

    /* Business Section */
    .business-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .business-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .business-card.primary {
      background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
      color: white;
    }

    .business-card.warning {
      border: 2px solid #ffc107;
    }

    .business-icon {
      font-size: 1.5em;
      margin-bottom: 8px;
    }

    .business-value {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .business-label {
      font-size: 0.85em;
      color: #666;
    }

    .business-card.primary .business-label {
      color: rgba(255,255,255,0.9);
    }

    /* Satisfaction Section */
    .satisfaction-grid {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    .satisfaction-main {
      background: white;
      padding: 25px 40px;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .satisfaction-main.good {
      border: 3px solid #00b894;
    }

    .satisfaction-main.medium {
      border: 3px solid #fdcb6e;
    }

    .satisfaction-main.bad {
      border: 3px solid #e17055;
    }

    .satisfaction-emoji {
      font-size: 3em;
    }

    .satisfaction-status {
      font-weight: 600;
      color: #333;
    }

    .satisfaction-details {
      flex: 1;
    }

    .satisfaction-detail {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }

    .detail-label {
      color: #666;
    }

    .detail-value {
      font-weight: 600;
    }

    .detail-value.warning {
      color: #e17055;
    }

    /* Kitchen Section */
    .kitchen-status {
      background: white;
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #00b894;
    }

    .kitchen-status.congested {
      border-left-color: #fdcb6e;
    }

    .kitchen-indicator {
      font-size: 1.2em;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .kitchen-details {
      color: #666;
    }

    .kitchen-item {
      padding: 5px 0;
    }

    /* Stock Section */
    .stock-ok {
      background: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      border: 2px solid #00b894;
    }

    .stock-ok-icon {
      font-size: 2em;
      display: block;
      margin-bottom: 10px;
    }

    .stock-ok-text {
      font-weight: 600;
      color: #00b894;
    }

    .stock-alert {
      background: white;
      padding: 15px;
      border-radius: 12px;
      margin-bottom: 10px;
    }

    .stock-alert.critical {
      border-left: 4px solid #e17055;
    }

    .stock-alert.warning {
      border-left: 4px solid #fdcb6e;
    }

    .stock-alert-header {
      font-weight: 600;
      margin-bottom: 10px;
    }

    .stock-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .stock-item {
      background: #f8f9fa;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 0.9em;
    }

    /* Owner Footer */
    .owner-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.85em;
    }

    .docker-stream-section {
      margin-top: 16px;
    }

    .docker-events-stream {
      background: #050715;
      border-radius: 8px;
      padding: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11px;
      max-height: 220px;
      overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .docker-events-placeholder {
      color: rgba(255, 255, 255, 0.5);
      padding: 4px 2px;
    }

    .docker-event-item {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 2px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #e0e0e0;
    }

    .docker-event-item.error {
      color: #ff6b6b;
    }

    .docker-event-time {
      color: #9ca3af;
      min-width: 80px;
    }

    .docker-event-status {
      min-width: 70px;
      font-weight: 600;
      color: #22c55e;
      text-transform: uppercase;
    }

    .docker-event-name {
      color: #e5e7eb;
    }

    .docker-event-type {
      margin-left: auto;
      color: #60a5fa;
      font-size: 10px;
      text-transform: uppercase;
    }
  `;
}

function getScript(config: any): string {
  const interval = config.updateInterval * 1000;
  return `
    // Smooth AJAX refresh (no page flicker)
    async function refreshContent() {
      try {
        const response = await fetch(window.location.href, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (response.ok) {
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const newContainer = doc.querySelector('.container');
          const currentContainer = document.querySelector('.container');
          if (newContainer && currentContainer) {
            // Preserve scroll position
            const scrollY = window.scrollY;
            currentContainer.innerHTML = newContainer.innerHTML;
            window.scrollTo(0, scrollY);
          }
        }
      } catch (error) {
        console.error('Refresh error:', error);
      }
    }

    // Auto-refresh at configured interval
    setInterval(refreshContent, ${interval});

    // Atualizar timestamp
    function updateTimestamp() {
      const el = document.getElementById('last-update');
      if (el) {
        el.textContent = new Date().toLocaleTimeString();
      }
    }
    setInterval(updateTimestamp, 1000);
    updateTimestamp();

    // Visual indicator when refreshing
    let refreshing = false;
    const originalRefresh = refreshContent;
    refreshContent = async function() {
      if (refreshing) return;
      refreshing = true;
      document.body.style.opacity = '0.95';
      await originalRefresh();
      document.body.style.opacity = '1';
      refreshing = false;
    };

    // Stream em tempo real de eventos Docker (SSE)
    function initDockerStream() {
      const container = document.getElementById('docker-events-stream');
      if (!container || !window.EventSource) return;

      const list = document.createElement('div');
      list.className = 'docker-events-list';
      container.innerHTML = '';
      container.appendChild(list);

      const source = new EventSource('/stream/docker-events');

      source.onmessage = function(event) {
        let data;
        try {
          data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch {
          return;
        }

        const item = document.createElement('div');
        item.className = 'docker-event-item';

        if (data.error) {
          item.classList.add('error');
          item.textContent = 'Erro Docker: ' + data.error;
        } else {
          const status = data.status || data.Action || '';
          const name = (data.Actor && data.Actor.Attributes && data.Actor.Attributes.name) || data.id || '';
          const type = data.Type || '';
          const time = data.time || '';

          item.innerHTML =
            "<span class='docker-event-time'>" + time + "</span>" +
            "<span class='docker-event-status'>" + status + "</span>" +
            "<span class='docker-event-name'>" + name + "</span>" +
            (type ? "<span class='docker-event-type'>" + type + "</span>" : "");
        }

        list.insertBefore(item, list.firstChild);

        // Limitar a 100 eventos
        const children = list.children;
        if (children.length > 100) {
          list.removeChild(children[children.length - 1]);
        }
      };

      source.onerror = function() {
        const err = document.createElement('div');
        err.className = 'docker-event-item error';
        err.textContent = 'Não foi possível conectar ao stream do Docker.';
        list.insertBefore(err, list.firstChild);
      };
    }

    // Atualização em tempo real do progresso de teste (SSE)
    function initTestProgressStream() {
      const section = document.getElementById('test-progress-section');
      if (!section || !window.EventSource) {
        console.warn('[CENTRAL] test-progress-section not found or EventSource not available');
        return;
      }

      console.log('[CENTRAL] Initializing test progress SSE stream...');
      const source = new EventSource('/stream/test-progress');

      source.onopen = function() {
        console.log('[CENTRAL] Test progress SSE stream connected');
      };

      source.onerror = function(e) {
        console.error('[CENTRAL] Test progress SSE stream error:', e);
        // Tentar reconectar após 3 segundos
        setTimeout(function() {
          if (source.readyState === EventSource.CLOSED) {
            console.log('[CENTRAL] Attempting to reconnect test progress stream...');
            source.close();
            initTestProgressStream();
          }
        }, 3000);
      };

      source.onmessage = function(event) {
        let data;
        try {
          data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) {
          console.error('[CENTRAL] Failed to parse SSE data:', e, event.data);
          return;
        }
        
        if (!data) {
          console.warn('[CENTRAL] Empty data received from SSE');
          return;
        }

        if (data.error) {
          console.error('[CENTRAL] SSE error:', data.error);
          return;
        }

        if (!Array.isArray(data.phases)) {
          console.warn('[CENTRAL] Invalid phases data:', data);
          return;
        }

        const phaseCards = section.querySelectorAll('.phase-card');
        const byName = {};
        phaseCards.forEach(function(card) {
          const nameEl = card.querySelector('.phase-name');
          if (nameEl && nameEl.textContent) {
            byName[nameEl.textContent.trim()] = card;
          }
        });

        data.phases.forEach(function(phase) {
          const card = byName[phase.name];
          if (!card) return;

          // Atualizar status (classe + ícone)
          card.classList.remove('pending', 'running', 'complete', 'failed');
          if (phase.status) {
            card.classList.add(phase.status);
          }
          const iconEl = card.querySelector('.phase-icon');
          if (iconEl) {
            let icon = '⏳';
            if (phase.status === 'complete') icon = '✅';
            else if (phase.status === 'running') icon = '🔄';
            else if (phase.status === 'failed') icon = '❌';
            iconEl.textContent = icon;
          }

          // Atualizar barra de progresso numérica
          let progressEl = card.querySelector('.phase-progress');
          if (phase.current != null && phase.total != null) {
            if (!progressEl) {
              progressEl = document.createElement('div');
              progressEl.className = 'phase-progress';
              card.appendChild(progressEl);
            }
            var pct = Math.floor((phase.current / phase.total) * 100);
            progressEl.textContent = phase.current + ' / ' + phase.total + ' (' + pct + '%)';
          }
        });
      };
    }

    // Só inicializar streams em modos técnicos (laboratory / operational)
    const currentMode = '${config.mode}';
    if (['laboratory', 'operational'].includes(currentMode)) {
      console.log('[CENTRAL] Initializing SSE streams for mode:', currentMode);
      initDockerStream();
      initTestProgressStream();
    } else {
      console.log('[CENTRAL] SSE streams disabled for mode:', currentMode);
    }
  `;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function getModeName(mode: ViewMode): string {
  const names: { [key in ViewMode]: string } = {
    laboratory: "🧪 Laboratório",
    operational: "🧠 Operacional",
    executive: "👔 Executivo",
    audit: "⚖️ Auditoria",
    owner: "🏠 Dono",
  };
  return names[mode] || mode;
}
