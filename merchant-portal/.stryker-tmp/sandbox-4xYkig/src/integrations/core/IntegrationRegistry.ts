/**
 * IntegrationRegistry — Singleton que gerencia todos os adapters
 * 
 * Responsabilidades:
 * - Registrar/desregistrar adapters
 * - Dispatch de eventos para todos os adapters
 * - Health check agregado
 * - Isolamento de falhas
 */

import type { IntegrationAdapter, IntegrationCapability } from './IntegrationContract';
import type { IntegrationEvent } from '../types/IntegrationEvent';
import type { IntegrationStatus, IntegrationInfo } from '../types/IntegrationStatus';

// ─────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────

class IntegrationRegistryImpl {
  private adapters = new Map<string, IntegrationAdapter>();
  private statusCache = new Map<string, IntegrationStatus>();
  private enabled = new Set<string>();

  /**
   * Registra um adapter no sistema
   */
  async register(adapter: IntegrationAdapter): Promise<void> {
    if (this.adapters.has(adapter.id)) {
      console.warn(`[IntegrationRegistry] Adapter "${adapter.id}" already registered, replacing...`);
    }

    // Initialize if needed
    if (adapter.initialize) {
      try {
        await adapter.initialize();
      } catch (err) {
        console.error(`[IntegrationRegistry] Failed to initialize "${adapter.id}":`, err);
        throw err;
      }
    }

    this.adapters.set(adapter.id, adapter);
    this.enabled.add(adapter.id);
    
    console.log(`[IntegrationRegistry] ✅ Registered: ${adapter.name} (${adapter.id})`);
  }

  /**
   * Remove um adapter do sistema
   */
  async unregister(id: string): Promise<void> {
    const adapter = this.adapters.get(id);
    if (!adapter) return;

    // Dispose if needed
    if (adapter.dispose) {
      try {
        await adapter.dispose();
      } catch (err) {
        console.error(`[IntegrationRegistry] Failed to dispose "${id}":`, err);
      }
    }

    this.adapters.delete(id);
    this.enabled.delete(id);
    this.statusCache.delete(id);
    
    console.log(`[IntegrationRegistry] ❌ Unregistered: ${id}`);
  }

  /**
   * Habilita/desabilita um adapter sem removê-lo
   */
  setEnabled(id: string, enabled: boolean): void {
    if (!this.adapters.has(id)) return;
    
    if (enabled) {
      this.enabled.add(id);
    } else {
      this.enabled.delete(id);
    }
  }

  /**
   * Retorna se um adapter está habilitado
   */
  isEnabled(id: string): boolean {
    return this.enabled.has(id);
  }

  /**
   * Lista todos os adapters registrados
   */
  list(): IntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Lista adapters com uma capability específica
   */
  listByCapability(capability: IntegrationCapability): IntegrationAdapter[] {
    return this.list().filter(a => a.capabilities.includes(capability));
  }

  /**
   * Retorna info completa de todos os adapters (para UI)
   */
  getInfo(): IntegrationInfo[] {
    return this.list().map(adapter => ({
      id: adapter.id,
      name: adapter.name,
      description: adapter.description,
      capabilities: adapter.capabilities,
      status: this.statusCache.get(adapter.id) || { status: 'unknown', lastCheckedAt: 0 },
      enabled: this.enabled.has(adapter.id),
    }));
  }

  /**
   * Dispatch de evento para todos os adapters habilitados
   *
   * IMPORTANTE: Erros são capturados e logados individualmente.
   * Uma falha em um adapter NÃO afeta os outros.
   */
  async dispatch(event: IntegrationEvent): Promise<void> {
    if (!event?.payload) {
      console.warn('[IntegrationRegistry] Ignoring event without payload:', event?.type ?? event);
      return;
    }
    const promises: Promise<void>[] = [];

    for (const adapter of this.adapters.values()) {
      // Skip disabled adapters
      if (!this.enabled.has(adapter.id)) continue;
      
      // Skip adapters without event handler
      if (!adapter.onEvent) continue;

      promises.push(
        Promise.resolve()
          .then(() => adapter.onEvent!(event))
          .catch(err => {
            console.error(
              `[Integration:${adapter.id}] ❌ Failed on ${event.type}:`,
              err
            );
            // Update status cache on error
            this.statusCache.set(adapter.id, {
              status: 'degraded',
              lastCheckedAt: Date.now(),
              message: `Error on ${event.type}: ${err.message}`,
            });
          })
      );
    }

    await Promise.all(promises);
  }

  /**
   * Health check de todos os adapters
   */
  async healthCheckAll(): Promise<Map<string, IntegrationStatus>> {
    const results = new Map<string, IntegrationStatus>();

    for (const adapter of this.adapters.values()) {
      if (!adapter.healthCheck) {
        results.set(adapter.id, { status: 'ok', lastCheckedAt: Date.now() });
        continue;
      }

      try {
        const status = await adapter.healthCheck();
        results.set(adapter.id, status);
        this.statusCache.set(adapter.id, status);
      } catch (err) {
        const status: IntegrationStatus = {
          status: 'down',
          lastCheckedAt: Date.now(),
          message: err instanceof Error ? err.message : 'Unknown error',
        };
        results.set(adapter.id, status);
        this.statusCache.set(adapter.id, status);
      }
    }

    return results;
  }

  /**
   * Retorna status agregado de todas as integrações
   */
  getAggregatedStatus(): 'ok' | 'degraded' | 'down' {
    const statuses = Array.from(this.statusCache.values());
    
    if (statuses.length === 0) return 'ok';
    if (statuses.some(s => s.status === 'down')) return 'down';
    if (statuses.some(s => s.status === 'degraded')) return 'degraded';
    return 'ok';
  }

  /**
   * Limpa todos os adapters (útil para testes)
   */
  async clear(): Promise<void> {
    for (const id of this.adapters.keys()) {
      await this.unregister(id);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────

export const IntegrationRegistry = new IntegrationRegistryImpl();
