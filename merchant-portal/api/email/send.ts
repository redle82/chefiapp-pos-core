/**
 * POST /api/email/send
 *
 * Sends transactional email via configurable provider (Resend, SendGrid, Mailgun).
 * Requires authenticated request (JWT). Rate limited per restaurant.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, AuthError } from "../_lib/auth";
import { checkRateLimit } from "../_lib/rateLimit";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

const MAX_EMAILS_PER_HOUR = 100;

function validateEmailPayload(body: unknown): EmailRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body is required");
  }

  const { to, subject, html, replyTo } = body as Record<string, unknown>;

  if (typeof to !== "string" || !to.includes("@")) {
    throw new Error("Valid 'to' email is required");
  }
  if (typeof subject !== "string" || subject.length === 0) {
    throw new Error("'subject' is required");
  }
  if (typeof html !== "string" || html.length === 0) {
    throw new Error("'html' body is required");
  }
  if (replyTo !== undefined && (typeof replyTo !== "string" || !replyTo.includes("@"))) {
    throw new Error("'replyTo' must be a valid email");
  }

  return { to, subject, html, replyTo: replyTo as string | undefined };
}

async function sendViaResend(
  payload: EmailRequest,
  fromAddress: string,
): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Resend API error ${resp.status}: ${text}`);
  }

  return resp.json() as Promise<{ id: string }>;
}

async function sendViaSendGrid(
  payload: EmailRequest,
  fromAddress: string,
): Promise<{ id: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY not configured");

  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: fromAddress },
      subject: payload.subject,
      content: [{ type: "text/html", value: payload.html }],
      reply_to: payload.replyTo ? { email: payload.replyTo } : undefined,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SendGrid API error ${resp.status}: ${text}`);
  }

  const messageId = resp.headers.get("x-message-id") ?? "unknown";
  return { id: messageId };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Authenticate
  let auth;
  try {
    auth = await verifyAuth(req);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Authentication failed" });
    return;
  }

  // Rate limit per restaurant
  const limit = checkRateLimit(
    `email:${auth.restaurantId}`,
    MAX_EMAILS_PER_HOUR,
    3600,
  );

  if (!limit.allowed) {
    res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000),
    });
    return;
  }

  // Validate payload
  let payload: EmailRequest;
  try {
    payload = validateEmailPayload(req.body);
  } catch (err) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Invalid request" });
    return;
  }

  // Send via configured provider
  const provider = process.env.EMAIL_PROVIDER ?? "resend";
  const fromAddress =
    process.env.EMAIL_FROM ?? "noreply@chefiapp.com";

  try {
    let result: { id: string };

    switch (provider) {
      case "sendgrid":
        result = await sendViaSendGrid(payload, fromAddress);
        break;
      case "resend":
      default:
        result = await sendViaResend(payload, fromAddress);
        break;
    }

    res.status(200).json({
      success: true,
      messageId: result.id,
      remaining: limit.remaining,
    });
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(502).json({
      error: "Failed to send email",
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
