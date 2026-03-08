/**
 * Local print queue (IndexedDB) for offline spooler.
 * When offline, UI enqueues jobs here; when online, PrintQueueProcessor sends them to Core.
 */

import type { PrintQueueJob, PrintJobStatus } from "./PrintQueueTypes";

const DB_NAME = "chefiapp_print_queue";
const STORE_NAME = "jobs";
const DB_VERSION = 1;

export const PrintQueue = {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("orderId", "orderId", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  },

  async put(job: PrintQueueJob): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(job);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(): Promise<PrintQueueJob[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = (request.result as PrintQueueJob[]).sort(
          (a, b) => a.createdAt - b.createdAt
        );
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getPending(): Promise<PrintQueueJob[]> {
    const all = await this.getAll();
    return all.filter((i) => i.status === "pending");
  },

  async getByOrderId(orderId: string): Promise<PrintQueueJob[]> {
    const all = await this.getAll();
    return all.filter((i) => i.orderId === orderId);
  },

  async updateStatus(
    id: string,
    status: PrintJobStatus,
    lastError?: string
  ): Promise<void> {
    const db = await this.open();
    const all = await this.getAll();
    const job = all.find((j) => j.id === id);
    if (!job) return;
    const updated: PrintQueueJob = {
      ...job,
      status,
      ...(lastError !== undefined && { lastError }),
      ...(status === "failed" && { attempts: job.attempts + 1 }),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
