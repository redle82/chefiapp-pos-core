/**
 * Core Readers — CORE_APPSTAFF_CONTRACT
 * AppStaff lê estado do Core; não calcula regras nem prioridade.
 */

export { readTasks, type CoreTask, type ReadTasksResult } from './readTasks';
export { readOrders, type CoreOrder, type CoreOrderItem, type ReadOrdersResult } from './readOrders';
