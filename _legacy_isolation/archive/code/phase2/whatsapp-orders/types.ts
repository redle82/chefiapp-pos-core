/**
 * WHATSAPP ORDERS ADAPTER — Phase 2
 * 
 * Enables restaurants to receive orders via WhatsApp Business API
 * 
 * Flow:
 * 1. Customer sends message to restaurant WhatsApp number
 * 2. ChefIApp receives webhook from Meta/WhatsApp
 * 3. Parse message → Extract items
 * 4. Create order in TPV
 * 5. Send confirmation link via WhatsApp
 * 6. Customer clicks link → Order confirmed
 * 7. Kitchen starts prep
 * 8. Send updates via WhatsApp (order ready, picked up, etc.)
 */

export interface WhatsAppConfig {
  restaurantId: string;
  businessAccountId: string; // Meta Business Account ID
  phoneNumberId: string; // WhatsApp Business phone number ID
  accessToken: string; // Meta access token (encrypted in DB)
  webhookToken: string; // Verify webhook authenticity
  restaurantName: string;
  restaurantPhoneNumber: string; // Full phone number (+351...)
}

export interface WhatsAppIncomingMessage {
  waId: string; // Customer WhatsApp ID (phone number)
  displayName: string; // Customer name (if available)
  profileName?: string;
  messageId: string; // Unique ID from WhatsApp
  timestamp: number; // Unix timestamp
  type: 'text' | 'image' | 'document'; // Message type
  text?: string; // If type = 'text'
  mediaUrl?: string; // If type = 'image' or 'document'
}

export interface WhatsAppOrder {
  id: string; // UUID (our internal ID)
  restaurantId: string;
  customerPhoneNumber: string; // WhatsApp phone number
  customerName: string;
  
  // WhatsApp specifics
  whatsappMessageId: string; // Original message ID from WhatsApp
  whatsappWaId: string; // WhatsApp customer ID
  
  // Order details
  items: {
    name: string;
    quantity: number;
    price?: number; // € (from menu, if recognized)
    specialInstructions?: string;
  }[];
  
  totalEstimate?: number; // € (rough estimate)
  
  // Status
  status: 'pending_parsing' | 'parsed' | 'pending_confirmation' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled';
  
  // Confirmation
  confirmationSentAt?: Date;
  confirmationExpiry?: Date; // 30 min to confirm
  confirmedAt?: Date;
  confirmationUrl?: string; // Link customer clicks to confirm
  
  // Timing
  createdAt: Date;
  orderedAt?: Date; // When customer confirmed
  readyAt?: Date;
  
  // Fallback to regular TPV order?
  linkedOrderId?: string; // If converted to regular order
  
  // AI parsing confidence
  parsingConfidence: number; // 0–1 (how sure are we about the items?)
  parsingFailedReason?: string; // If confidence too low
}

export interface ParseWhatsAppMessageInput {
  messageText: string;
  restaurantId: string;
  customerName?: string;
  knownMenu?: { name: string; price: number }[]; // Menu items for matching
}

export interface ParseWhatsAppMessageOutput {
  success: boolean;
  items?: Array<{
    name: string;
    quantity: number;
    price?: number;
    confidence: number; // 0–1
  }>;
  confidence: number; // Overall confidence
  failureReason?: string; // If success = false
  suggestion?: string; // "Did you mean...?" if confidence is low
}

export interface SendWhatsAppMessageInput {
  restaurantId: string;
  customerPhoneNumber: string; // Must be in format +351...
  message: string; // Plain text for now
}

export interface SendWhatsAppMessageOutput {
  success: boolean;
  messageId?: string; // WhatsApp's message ID
  sentAt: Date;
  errorReason?: string;
}

/**
 * CONTRACT: What Core/TPV needs to do
 */

export interface WhatsAppOrderService {
  /**
   * Receive webhook from WhatsApp/Meta
   */
  handleIncomingWebhook(payload: {
    restaurantId: string;
    message: WhatsAppIncomingMessage;
  }): Promise<void>;

  /**
   * Parse message → Extract items
   */
  parseOrderMessage(
    input: ParseWhatsAppMessageInput
  ): Promise<ParseWhatsAppMessageOutput>;

  /**
   * Send confirmation request to customer
   */
  sendConfirmationRequest(input: {
    restaurantId: string;
    whatsappOrderId: string;
    customerPhone: string;
    orderSummary: string;
  }): Promise<SendWhatsAppMessageOutput>;

  /**
   * Customer confirmed → Create order in TPV
   */
  confirmWhatsAppOrder(input: {
    restaurantId: string;
    whatsappOrderId: string;
  }): Promise<{ tpvOrderId: string }>;

  /**
   * Send status update (e.g., "Order ready!")
   */
  sendOrderStatus(input: {
    restaurantId: string;
    whatsappOrderId: string;
    status: 'confirmed' | 'in_progress' | 'ready' | 'picked_up' | 'cancelled';
    message: string;
  }): Promise<SendWhatsAppMessageOutput>;
}

/**
 * MESSAGE TEMPLATES
 */

export const WHATSAPP_TEMPLATES = {
  confirmationRequest: (
    orderSummary: string,
    restaurantName: string,
    confirmLink: string
  ) => `
🍽️ *${restaurantName}* — Confirm Your Order

${orderSummary}

[Confirm Order](${confirmLink})

You have 30 minutes to confirm. After that, we'll cancel this order.

Thank you!
  `.trim(),

  orderReady: (restaurantName: string) => `
✅ Your order from *${restaurantName}* is ready!

Come pick it up at the counter. 🎉
  `.trim(),

  orderInProgress: (estimatedWaitTime: number) => `
👨‍🍳 Your order is being prepared!

Estimated ready time: ${estimatedWaitTime} minutes

We'll notify you when it's ready. 📦
  `.trim(),

  orderCancelled: (reason: string) => `
❌ Your order has been cancelled.

Reason: ${reason}

Questions? Reply to this chat.
  `.trim(),
};

/**
 * AI MESSAGE PARSER
 * 
 * Example input: "1x burger, 2x coke, 1 salad"
 * Output: [{ name: 'Burger', quantity: 1 }, ...]
 * 
 * Handles variations:
 * - "1x", "1 x", "1"
 * - "burger" vs "hamburguer"
 * - Typos: "burget" → "Burger" (if confidence high enough)
 * - Plurals: "burgers" → "Burger"
 * 
 * Uses fuzzy matching against restaurant's menu
 */

export function parseWhatsAppMessage(
  text: string,
  knownMenu: { name: string; price: number }[] = []
): ParseWhatsAppMessageOutput {
  try {
    // TODO: Implement fuzzy matching
    // For now, return stub

    return {
      success: false,
      failureReason: 'Not yet implemented',
      suggestion: 'Please use the full menu link to order.',
    };
  } catch (error) {
    return {
      success: false,
      failureReason: String(error),
    };
  }
}
