interface WebhookProcessResultRow {
  success?: boolean;
  event_id?: string;
  message?: string;
}

function normalizeMessage(message: unknown): string {
  if (typeof message !== "string") return "";
  return message.trim().toLowerCase();
}

export function isDuplicateWebhookProcessResult(
  row: WebhookProcessResultRow | null | undefined,
): boolean {
  if (!row) return false;
  const message = normalizeMessage(row.message);
  if (!message) return false;

  return (
    message.includes("duplicate") ||
    message.includes("idempotent") ||
    message.includes("already processed")
  );
}

export function getWebhookProcessRow(
  data: unknown,
): WebhookProcessResultRow | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const row = data[0];
  if (typeof row !== "object" || row === null) return null;
  return row as WebhookProcessResultRow;
}
