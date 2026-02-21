/**
 * ORDER CONTEXT — Re-export para Compatibilidade (LEGADO)
 * 
 * FASE 3.4: Consolidação de Contexts
 * 
 * ⚠️ ESTE ARQUIVO É LEGADO
 * 
 * O token está em OrderContextToken.tsx
 * O provider real está em OrderContextReal.tsx
 * 
 * Este arquivo mantém compatibilidade com código legado.
 * TODO: Remover após confirmar que BootstrapComposer não é usado.
 */
// @ts-nocheck


// FASE 3.4: Re-exporta token do arquivo centralizado
export { OrderContext, type OrderContextType } from './OrderContextToken';

// Re-export types para compatibilidade
export type { Order, OrderItem } from '../../../core/contracts';

// FASE 3.4: Provider legado removido - não é usado
// O provider real está em OrderContextReal.tsx
// Se precisar do provider, use OrderContextReal.tsx
