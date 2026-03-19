/**
 * EmailService — Transactional email system for ChefIApp POS.
 *
 * Sends emails via Docker Core RPC (backend does the actual SMTP send).
 * Frontend queues emails in IndexedDB for offline resilience and
 * flushes the queue when connectivity is restored.
 *
 * Rate limiting: max 100 emails/hour per restaurant.
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import { Logger } from "../logger";
import type { ReceiptData } from "../../pages/TPVMinimal/types/ReceiptData";
import {
  receiptTemplate,
  orderConfirmationTemplate,
  reservationTemplate,
  staffAlertTemplate,
  type OrderConfirmationData,
  type ReservationConfirmationData,
  type StaffAlertData,
} from "./emailTemplates";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SendEmailOptions {
  /** Reply-to address (defaults to restaurant email). */
  replyTo?: string;
  /** BCC addresses. */
  bcc?: string[];
  /** Metadata tags for tracking. */
  tags?: string[];
}

export interface EmailQueueItem {
  id: string;
  restaurantId: string;
  to: string;
  subject: string;
  htmlBody: string;
  options?: SendEmailOptions;
  createdAt: string;
  retries: number;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Rate limiter (in-memory, per restaurant)                           */
/* ------------------------------------------------------------------ */

const MAX_EMAILS_PER_HOUR = 100;

/** Map<restaurantId, timestamps[]> of sent emails in the current window. */
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(restaurantId: string): boolean {
  const now = Date.now();
  const oneHourAgo = now - 3600_000;

  let timestamps = rateLimitMap.get(restaurantId) ?? [];
  // Prune old entries
  timestamps = timestamps.filter((ts) => ts > oneHourAgo);
  rateLimitMap.set(restaurantId, timestamps);

  return timestamps.length < MAX_EMAILS_PER_HOUR;
}

function recordEmailSent(restaurantId: string): void {
  const timestamps = rateLimitMap.get(restaurantId) ?? [];
  timestamps.push(Date.now());
  rateLimitMap.set(restaurantId, timestamps);
}

/* ------------------------------------------------------------------ */
/*  IndexedDB offline queue                                            */
/* ------------------------------------------------------------------ */

const DB_NAME = "chefiapp_email_queue";
const DB_VERSION = 1;
const STORE_NAME = "emails";

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function enqueueEmail(item: EmailQueueItem): Promise<void> {
  try {
    const db = await openQueueDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(item);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    Logger.warn("[EmailService] Failed to enqueue email", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function dequeueEmail(id: string): Promise<void> {
  try {
    const db = await openQueueDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    Logger.warn("[EmailService] Failed to dequeue email", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function getAllQueued(): Promise<EmailQueueItem[]> {
  try {
    const db = await openQueueDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        db.close();
        resolve(request.result as EmailQueueItem[]);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Core RPC: send email via backend                                   */
/* ------------------------------------------------------------------ */

async function sendViaCore(
  restaurantId: string,
  to: string,
  subject: string,
  htmlBody: string,
  options?: SendEmailOptions,
): Promise<SendResult> {
  try {
    const { data, error } = await dockerCoreClient
      .rpc("send_email", {
        p_restaurant_id: restaurantId,
        p_to: to,
        p_subject: subject,
        p_html_body: htmlBody,
        p_reply_to: options?.replyTo ?? null,
        p_bcc: options?.bcc ?? null,
        p_tags: options?.tags ?? null,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as Record<string, unknown> | null;
    return {
      success: true,
      messageId: (result?.message_id as string) ?? undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown RPC error",
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Send a generic email. Queues to IndexedDB if offline or rate-limited.
 */
export async function sendEmail(
  restaurantId: string,
  to: string,
  subject: string,
  htmlBody: string,
  options?: SendEmailOptions,
): Promise<SendResult> {
  // Validate email format
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { success: false, error: "Invalid email address" };
  }

  // Rate limit check
  if (!checkRateLimit(restaurantId)) {
    Logger.warn("[EmailService] Rate limit exceeded", { restaurantId });
    // Queue for later
    await enqueueEmail({
      id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      restaurantId,
      to,
      subject,
      htmlBody,
      options,
      createdAt: new Date().toISOString(),
      retries: 0,
    });
    return { success: false, error: "Rate limit exceeded. Email queued." };
  }

  // Check connectivity
  if (!navigator.onLine) {
    await enqueueEmail({
      id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      restaurantId,
      to,
      subject,
      htmlBody,
      options,
      createdAt: new Date().toISOString(),
      retries: 0,
    });
    Logger.info("[EmailService] Offline — email queued", { to, subject });
    return { success: false, error: "Offline. Email queued for later." };
  }

  const result = await sendViaCore(restaurantId, to, subject, htmlBody, options);

  if (result.success) {
    recordEmailSent(restaurantId);
    Logger.info("[EmailService] Email sent", {
      to,
      subject,
      messageId: result.messageId,
    });
  } else {
    // Queue failed email for retry
    await enqueueEmail({
      id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      restaurantId,
      to,
      subject,
      htmlBody,
      options,
      createdAt: new Date().toISOString(),
      retries: 0,
    });
    Logger.warn("[EmailService] Send failed, queued for retry", {
      to,
      error: result.error,
    });
  }

  return result;
}

/**
 * Send a formatted receipt email.
 */
export async function sendReceiptEmail(
  restaurantId: string,
  customerEmail: string,
  receiptData: ReceiptData,
  currencySymbol?: string,
): Promise<SendResult> {
  const subject = `Receipt #${receiptData.orderIdShort.toUpperCase()} — ${receiptData.restaurant.name}`;
  const htmlBody = receiptTemplate(receiptData, currencySymbol);
  return sendEmail(restaurantId, customerEmail, subject, htmlBody, {
    tags: ["receipt", `order:${receiptData.orderId}`],
  });
}

/**
 * Send an order confirmation email.
 */
export async function sendOrderConfirmation(
  restaurantId: string,
  customerEmail: string,
  orderData: OrderConfirmationData,
): Promise<SendResult> {
  const subject = `Order #${orderData.orderIdShort.toUpperCase()} — ${orderData.restaurant.name}`;
  const htmlBody = orderConfirmationTemplate(orderData);
  return sendEmail(restaurantId, customerEmail, subject, htmlBody, {
    tags: ["order_confirmation", `order:${orderData.orderId}`],
  });
}

/**
 * Send a reservation confirmation email.
 */
export async function sendReservationConfirmation(
  restaurantId: string,
  customerEmail: string,
  reservationData: ReservationConfirmationData,
): Promise<SendResult> {
  const subject = `Reservation Confirmed — ${reservationData.restaurant.name}`;
  const htmlBody = reservationTemplate(reservationData);
  return sendEmail(restaurantId, customerEmail, subject, htmlBody, {
    tags: ["reservation", `reservation:${reservationData.reservationId}`],
  });
}

/**
 * Send a staff alert/notification email.
 */
export async function sendStaffAlert(
  restaurantId: string,
  staffEmail: string,
  alertType: StaffAlertData["alertType"],
  data: Omit<StaffAlertData, "alertType">,
): Promise<SendResult> {
  const fullData: StaffAlertData = { ...data, alertType };
  const subject = `[${alertType.toUpperCase().replace("_", " ")}] ${data.title} — ${data.restaurant.name}`;
  const htmlBody = staffAlertTemplate(fullData);
  return sendEmail(restaurantId, staffEmail, subject, htmlBody, {
    tags: ["staff_alert", alertType],
  });
}

/* ------------------------------------------------------------------ */
/*  Queue flush (call when app comes back online)                      */
/* ------------------------------------------------------------------ */

const MAX_RETRIES = 3;

/**
 * Flush the offline email queue. Call on `online` event or periodically.
 */
export async function flushEmailQueue(): Promise<{
  sent: number;
  failed: number;
}> {
  if (!navigator.onLine) return { sent: 0, failed: 0 };

  const items = await getAllQueued();
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    if (!checkRateLimit(item.restaurantId)) {
      failed++;
      continue;
    }

    const result = await sendViaCore(
      item.restaurantId,
      item.to,
      item.subject,
      item.htmlBody,
      item.options,
    );

    if (result.success) {
      await dequeueEmail(item.id);
      recordEmailSent(item.restaurantId);
      sent++;
    } else if (item.retries >= MAX_RETRIES) {
      // Give up after max retries
      await dequeueEmail(item.id);
      Logger.warn("[EmailService] Dropping email after max retries", {
        to: item.to,
        subject: item.subject,
      });
      failed++;
    } else {
      // Update retry count
      await enqueueEmail({ ...item, retries: item.retries + 1 });
      failed++;
    }
  }

  if (sent > 0 || failed > 0) {
    Logger.info("[EmailService] Queue flush complete", { sent, failed });
  }

  return { sent, failed };
}

/* ------------------------------------------------------------------ */
/*  Email settings helpers                                             */
/* ------------------------------------------------------------------ */

export interface EmailSettings {
  emailReceiptsEnabled: boolean;
  autoSendAfterPayment: boolean;
  sendOrderConfirmation: boolean;
  customerEmailPrompt: "at_checkout" | "optional" | "never";
}

const EMAIL_SETTINGS_KEY = "chefiapp_email_settings";

export function getEmailSettings(): EmailSettings {
  try {
    const raw = localStorage.getItem(EMAIL_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as EmailSettings;
  } catch {
    // Corrupted settings, return defaults
  }
  return {
    emailReceiptsEnabled: false,
    autoSendAfterPayment: false,
    sendOrderConfirmation: false,
    customerEmailPrompt: "optional",
  };
}

export function saveEmailSettings(settings: EmailSettings): void {
  localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Persist email settings to the Core database for cross-device sync.
 */
export async function syncEmailSettingsToCore(
  restaurantId: string,
  settings: EmailSettings,
): Promise<boolean> {
  try {
    const { error } = await dockerCoreClient
      .from("gm_restaurants")
      .update({
        email_settings: settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurantId);

    if (error) {
      Logger.warn("[EmailService] Failed to sync settings to Core", {
        error: error.message,
      });
      return false;
    }
    return true;
  } catch (err) {
    Logger.warn("[EmailService] syncEmailSettingsToCore error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Load email settings from Core (with localStorage fallback).
 */
export async function loadEmailSettingsFromCore(
  restaurantId: string,
): Promise<EmailSettings> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_restaurants")
      .select("email_settings")
      .eq("id", restaurantId)
      .maybeSingle();

    if (!error && data) {
      const row = data as Record<string, unknown>;
      const remote = row.email_settings as EmailSettings | null;
      if (remote) {
        // Sync to local
        saveEmailSettings(remote);
        return remote;
      }
    }
  } catch {
    // Fall through to local
  }

  return getEmailSettings();
}

/* ------------------------------------------------------------------ */
/*  Auto-register online listener for queue flush                      */
/* ------------------------------------------------------------------ */

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushEmailQueue().catch(() => {});
  });
}
