import { WebOrderStatus, WebPaymentStatus } from './contracts';

export type WebOrderEvent =
  | { type: 'ACCEPT' }
  | { type: 'START_PREP' }
  | { type: 'MARK_READY' }
  | { type: 'COMPLETE' }
  | { type: 'CANCEL' };

export class OrderStateMachine {
  static canTransition(from: WebOrderStatus, event: WebOrderEvent['type']): boolean {
    switch (event) {
      case 'ACCEPT':
        return from === 'PLACED';
      case 'START_PREP':
        return from === 'ACCEPTED';
      case 'MARK_READY':
        return from === 'IN_PREP';
      case 'COMPLETE':
        return from === 'READY';
      case 'CANCEL':
        return from !== 'COMPLETED' && from !== 'CANCELLED';
      default:
        return false;
    }
  }

  static transition(from: WebOrderStatus, event: WebOrderEvent): WebOrderStatus {
    if (!this.canTransition(from, event.type)) {
      throw new Error(`Invalid transition: ${from} -> ${event.type}`);
    }

    switch (event.type) {
      case 'ACCEPT':
        return 'ACCEPTED';
      case 'START_PREP':
        return 'IN_PREP';
      case 'MARK_READY':
        return 'READY';
      case 'COMPLETE':
        return 'COMPLETED';
      case 'CANCEL':
        return 'CANCELLED';
    }
  }
}

export class PaymentInvariants {
  static canMarkPaid(current: WebPaymentStatus): boolean {
    return current === 'REQUIRES_PAYMENT';
  }

  static canMarkFailed(current: WebPaymentStatus): boolean {
    return current === 'REQUIRES_PAYMENT';
  }

  static assertCanMarkPaid(current: WebPaymentStatus): void {
    if (!this.canMarkPaid(current)) {
      throw new Error(`Invalid payment transition: ${current} -> PAID`);
    }
  }

  static assertCanMarkFailed(current: WebPaymentStatus): void {
    if (!this.canMarkFailed(current)) {
      throw new Error(`Invalid payment transition: ${current} -> FAILED`);
    }
  }
}
