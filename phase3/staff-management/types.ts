/**
 * Phase 3 — Staff Management System
 *
 * Manages staff schedules, tracks clock-in/out, monitors performance,
 * and distributes tips transparently.
 *
 * Core insight: Staff can see their own data (transparency). Manager can see all staff data.
 */

import { UUID, ISOTimestamp, Decimal } from '../shared/types';

/**
 * Staff Member: Person working at restaurant
 */
export interface StaffMember {
  id: UUID;
  restaurant_id: UUID;
  name: string;
  email: string;
  phone_number: string;
  role: StaffRole;
  status: StaffStatus; // active, on_leave, terminated
  hire_date: ISOTimestamp;
  hourly_rate: Decimal; // Base pay
  employment_type: EmploymentType; // full_time, part_time, contractor
  avatar_url?: string;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export enum StaffRole {
  KITCHEN = 'kitchen', // Prep, cooking
  COUNTER = 'counter', // Register, customer service
  DELIVERY = 'delivery', // Delivery driver
  MANAGER = 'manager', // Schedule, hiring
  OWNER = 'owner', // Restaurant owner
}

export enum StaffStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACTOR = 'contractor',
}

/**
 * Shift: Time period when staff member works
 */
export interface Shift {
  id: UUID;
  restaurant_id: UUID;
  staff_member_id: UUID;
  shift_date: string; // ISO format YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  role_assigned: StaffRole;
  status: ShiftStatus;
  is_confirmed: boolean; // Staff confirmed they'll show up?
  notes?: string;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

/**
 * Clock Event: Staff member clocks in/out
 */
export interface ClockEvent {
  id: UUID;
  restaurant_id: UUID;
  staff_member_id: UUID;
  event_type: ClockEventType;
  timestamp: ISOTimestamp;
  location?: {
    latitude: number;
    longitude: number;
  }; // For delivery staff tracking
  notes?: string;
  verified_by?: UUID; // Manager who verified (for manual corrections)
  created_at: ISOTimestamp;
}

export enum ClockEventType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  BREAK_START = 'break_start',
  BREAK_END = 'break_end',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
}

/**
 * Work Session: Period from clock-in to clock-out
 */
export interface WorkSession {
  id: UUID;
  restaurant_id: UUID;
  staff_member_id: UUID;
  shift_id?: UUID;
  clock_in: ISOTimestamp;
  clock_out?: ISOTimestamp;
  duration_minutes?: number; // Calculated
  status: WorkSessionStatus;
  break_duration_minutes?: number;
  total_pay?: Decimal; // hourly_rate * (duration - breaks) / 60
  notes?: string;
  created_at: ISOTimestamp;
}

export enum WorkSessionStatus {
  ACTIVE = 'active', // Staff still clocked in
  COMPLETED = 'completed',
  AWAITING_APPROVAL = 'awaiting_approval', // Manual entry needs approval
}

/**
 * Delivery Assignment: Order assigned to delivery staff
 */
export interface DeliveryAssignment {
  id: UUID;
  restaurant_id: UUID;
  order_id: UUID;
  staff_member_id: UUID;
  assigned_at: ISOTimestamp;
  pickup_time?: ISOTimestamp;
  delivery_time?: ISOTimestamp;
  distance_km?: Decimal;
  status: DeliveryStatus;
  customer_rating?: number; // 1–5
  tip_amount?: Decimal;
}

export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Tip: Gratuity from customer
 */
export interface Tip {
  id: UUID;
  restaurant_id: UUID;
  order_id: UUID;
  staff_member_id?: UUID; // Who gets the tip?
  amount: Decimal;
  payment_method: TipPaymentMethod;
  tip_date: ISOTimestamp;
  distribution_status: TipDistributionStatus;
  payout_date?: ISOTimestamp;
  created_at: ISOTimestamp;
}

export enum TipPaymentMethod {
  CREDIT_CARD = 'credit_card',
  CASH = 'cash',
  DIGITAL_WALLET = 'digital_wallet',
}

export enum TipDistributionStatus {
  PENDING = 'pending', // Waiting to be distributed
  DISTRIBUTED = 'distributed',
  REJECTED = 'rejected', // Staff refused, goes back to restaurant
}

/**
 * Staff Performance: Metrics for staff member
 */
export interface StaffPerformance {
  staff_member_id: UUID;
  restaurant_id: UUID;
  period: 'day' | 'week' | 'month';
  period_start: ISOTimestamp;
  period_end: ISOTimestamp;
  // Delivery metrics
  deliveries_completed: number;
  average_delivery_time_minutes?: Decimal;
  customer_rating_average?: Decimal; // 1–5
  // Kitchen metrics
  orders_prepared?: number;
  average_prep_time_minutes?: Decimal;
  accuracy_rate?: Decimal; // 0–1, correct orders / total orders
  // General
  hours_worked: Decimal;
  on_time_arrival_rate: Decimal; // 0–1, showed up on time?
  tips_earned: Decimal;
  created_at: ISOTimestamp;
}

/**
 * Staff Availability: When staff member can work
 */
export interface StaffAvailability {
  staff_member_id: UUID;
  restaurant_id: UUID;
  date: string; // ISO format YYYY-MM-DD
  status: AvailabilityStatus;
  start_time?: string; // HH:MM, optional (full day available)
  end_time?: string; // HH:MM
  notes?: string;
  created_at: ISOTimestamp;
}

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  PARTIALLY_AVAILABLE = 'partially_available',
  UNAVAILABLE = 'unavailable',
}

/**
 * Payroll Record: Summary for payment
 */
export interface PayrollRecord {
  id: UUID;
  restaurant_id: UUID;
  staff_member_id: UUID;
  pay_period_start: ISOTimestamp;
  pay_period_end: ISOTimestamp;
  regular_hours: Decimal;
  overtime_hours: Decimal; // Hours > 40/week
  regular_pay: Decimal;
  overtime_pay: Decimal; // Usually 1.5x hourly rate
  tips_earned: Decimal;
  deductions?: Decimal; // Taxes, etc.
  total_pay: Decimal;
  status: PayrollStatus;
  notes?: string;
  created_at: ISOTimestamp;
}

export enum PayrollStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  DISPUTED = 'disputed',
}

/**
 * Staff Management Service Interface
 */
export interface StaffManagementService {
  // Staff Management
  createStaff(input: CreateStaffInput): Promise<StaffMember>;
  getStaff(staffId: UUID): Promise<StaffMember | null>;
  listStaff(restaurantId: UUID): Promise<StaffMember[]>;
  updateStaff(staffId: UUID, input: UpdateStaffInput): Promise<StaffMember>;
  terminateStaff(staffId: UUID): Promise<void>;

  // Shifts
  generateSchedule(input: GenerateScheduleInput): Promise<Shift[]>;
  createShift(input: CreateShiftInput): Promise<Shift>;
  listShifts(restaurantId: UUID, date?: string): Promise<Shift[]>;
  confirmShift(shiftId: UUID): Promise<Shift>;
  cancelShift(shiftId: UUID): Promise<void>;

  // Clock In/Out
  clockIn(input: ClockInInput): Promise<ClockEvent>;
  clockOut(staffMemberId: UUID): Promise<ClockEvent>;
  getWorkSessions(staffMemberId: UUID): Promise<WorkSession[]>;

  // Delivery Assignments
  assignOrderForDelivery(input: AssignDeliveryInput): Promise<DeliveryAssignment>;
  updateDeliveryStatus(assignmentId: UUID, status: DeliveryStatus): Promise<DeliveryAssignment>;

  // Tips & Payroll
  recordTip(input: RecordTipInput): Promise<Tip>;
  distributeTips(restaurantId: UUID): Promise<void>;
  getPayroll(restaurantId: UUID, period: PayPeriod): Promise<PayrollRecord[]>;
  approvePayroll(payrollId: UUID): Promise<PayrollRecord>;

  // Performance
  getPerformance(staffMemberId: UUID, period?: 'day' | 'week' | 'month'): Promise<StaffPerformance>;
  listPerformance(restaurantId: UUID): Promise<StaffPerformance[]>;

  // Availability
  recordAvailability(input: RecordAvailabilityInput): Promise<StaffAvailability>;
  getAvailability(restaurantId: UUID, date?: string): Promise<StaffAvailability[]>;
}

/**
 * Input/Output Contracts
 */

export interface CreateStaffInput {
  name: string;
  email: string;
  phone_number: string;
  role: StaffRole;
  hourly_rate: Decimal;
  employment_type?: EmploymentType;
  avatar_url?: string;
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  phone_number?: string;
  role?: StaffRole;
  hourly_rate?: Decimal;
  employment_type?: EmploymentType;
  status?: StaffStatus;
}

export interface CreateShiftInput {
  staff_member_id: UUID;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  role_assigned: StaffRole;
  notes?: string;
}

export interface GenerateScheduleInput {
  restaurant_id: UUID;
  week_start: string; // YYYY-MM-DD
  demand_forecast?: Record<string, number>; // day → predicted orders
}

export interface ClockInInput {
  staff_member_id: UUID;
  shift_id?: UUID;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AssignDeliveryInput {
  order_id: UUID;
  staff_member_id: UUID;
  delivery_location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface RecordTipInput {
  order_id: UUID;
  staff_member_id?: UUID; // Optional if not assigned yet
  amount: Decimal;
  payment_method: TipPaymentMethod;
}

export interface RecordAvailabilityInput {
  staff_member_id: UUID;
  date: string; // YYYY-MM-DD
  status: AvailabilityStatus;
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  notes?: string;
}

export interface PayPeriod {
  start_date: ISOTimestamp;
  end_date: ISOTimestamp;
}

/**
 * Factory Functions
 */

export function createStaffMember(input: CreateStaffInput): StaffMember {
  return {
    id: crypto.randomUUID() as UUID,
    restaurant_id: '' as UUID, // Set by service
    name: input.name,
    email: input.email,
    phone_number: input.phone_number,
    role: input.role,
    status: StaffStatus.ACTIVE,
    hire_date: new Date().toISOString() as ISOTimestamp,
    hourly_rate: input.hourly_rate,
    employment_type: input.employment_type ?? EmploymentType.PART_TIME,
    avatar_url: input.avatar_url,
    created_at: new Date().toISOString() as ISOTimestamp,
    updated_at: new Date().toISOString() as ISOTimestamp,
  };
}

export function calculateShiftDuration(
  startTime: string,
  endTime: string,
  breakDurationMinutes: number = 0,
): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  return Math.max(0, endTotalMin - startTotalMin - breakDurationMinutes);
}

export function calculatePayForShift(
  hourlyRate: Decimal,
  durationMinutes: number,
): Decimal {
  const hours = new Decimal(durationMinutes).dividedBy(60);
  return hourlyRate.times(hours);
}
