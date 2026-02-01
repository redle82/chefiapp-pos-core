/**
 * Core Events — CORE_APPSTAFF_CONTRACT
 * AppStaff envia eventos (tarefa concluída, pedido aceite, etc.); Core regista e aplica.
 */

export { sendTaskCompleted, type TaskCompletedPayload, type TaskCompletedResult } from './taskCompleted';
export { sendOrderAccepted, type OrderAcceptedPayload, type OrderAcceptedResult } from './orderAccepted';
