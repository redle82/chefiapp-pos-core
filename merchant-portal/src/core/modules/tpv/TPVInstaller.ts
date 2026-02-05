/**
 * TPVInstaller - Installer do Módulo TPV
 * 
 * Implementa ModuleInterface para o módulo TPV
 */

import { invokeRpc } from '../../infra/coreRpc';
import type { ModuleInterface, ModuleConfig, InstallResult, UninstallResult, HealthStatus, ModuleStatus } from '../types';

export class TPVInstaller implements ModuleInterface {
  async install(restaurantId: string, config?: ModuleConfig): Promise<InstallResult> {
    try {
      // 1. Chamar RPC — Core quando Docker (FINANCIAL_CORE_VIOLATION_AUDIT)
      const { data, error } = await invokeRpc('install_tpv_module', {
        p_restaurant_id: restaurantId,
        p_config: config || {}
      });
      
      if (error) {
        throw new Error(`Failed to install TPV module: ${error.message}`);
      }
      
      // 2. Atualizar estado local (se necessário)
      await this.updateLocalState(restaurantId, 'installed');
      
      // 3. Emitir evento (se houver sistema de eventos)
      await this.emitEvent('module_installed', {
        module: 'tpv',
        restaurantId,
        timestamp: new Date()
      });
      
      return {
        success: true,
        moduleId: data,
        message: 'TPV instalado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        moduleId: '',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  async uninstall(restaurantId: string): Promise<UninstallResult> {
    try {
      const { error } = await invokeRpc('uninstall_tpv_module', {
        p_restaurant_id: restaurantId
      });
      
      if (error) {
        throw new Error(`Failed to uninstall TPV module: ${error.message}`);
      }
      
      // Atualizar estado local
      await this.updateLocalState(restaurantId, 'uninstalled');
      
      return {
        success: true,
        message: 'TPV desinstalado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  async health(restaurantId: string): Promise<HealthStatus> {
    try {
      const { data, error } = await invokeRpc<HealthStatus>('check_tpv_module_health', {
        p_restaurant_id: restaurantId
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as HealthStatus;
    } catch (error) {
      return {
        installed: false,
        status: 'not_installed',
        health: 'unhealthy',
        checks: {}
      };
    }
  }
  
  async configure(restaurantId: string, config: ModuleConfig): Promise<void> {
    // Implementar configuração
    const { error } = await supabase
      .from('installed_modules')
      .update({ config, updated_at: new Date().toISOString() })
      .eq('restaurant_id', restaurantId)
      .eq('module_id', 'tpv');
    
    if (error) throw error;
  }
  
  async status(restaurantId: string): Promise<ModuleStatus> {
    const { data, error } = await supabase
      .from('installed_modules')
      .select('version, installed_at, status')
      .eq('restaurant_id', restaurantId)
      .eq('module_id', 'tpv')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { installed: false };
      }
      throw error;
    }
    
    return {
      installed: true,
      version: data.version,
      installedAt: data.installed_at ? new Date(data.installed_at) : undefined,
      status: data.status,
    };
  }
  
  private async updateLocalState(restaurantId: string, state: string): Promise<void> {
    // Atualizar estado local (localStorage, context, etc.)
    // TODO: Implementar quando necessário
  }
  
  private async emitEvent(type: string, data: any): Promise<void> {
    // Emitir evento (se houver sistema de eventos)
    // TODO: Implementar quando necessário
  }
}

export const tpvInstaller = new TPVInstaller();
