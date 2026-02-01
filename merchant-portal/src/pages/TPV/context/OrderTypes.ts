/**
 * FASE 3.2: Re-exporta dos contratos centralizados.
 * 
 * Este arquivo mantém compatibilidade com código legado.
 * Novos imports devem usar diretamente: import { Order, OrderItem } from '@/core/contracts'
 */
export type { Order, OrderItem } from '../../../core/contracts';
