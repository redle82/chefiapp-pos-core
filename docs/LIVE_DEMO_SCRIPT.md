# LIVE DEMO SCRIPT: CHEFIAPP v1.0 “FIRST SALE”

**Goal:** Execute the full "Order Cycle" with a real mobile phone and the TPV.
**Prerequisite:** Network visibility (Tunnel/Wifi IP) + Stripe Keys.

## 1. Preparation (The Stage)
1.  **Desktop:** Open ChefIApp TPV (`/app/tpv`) => **"The Command Center"**.
2.  **Mobile:** Open `http://<YOUR_IP>:5174/public/<SLUG>` => **"The Customer"**.
3.  **Audio:** Turn up computer volume (for the notification bell).

## 2. The Customer (Mobile)
*"I am a hungry customer walking past the restaurant."*
1.  Browse the Menu on the phone.
2.  Add **"Hambúrguer da Casa"** to Cart.
3.  Proceed to Checkout (No login required).
4.  Reference: Table "Balcão" or "Mesa 1".
5.  **Pay**: Enter Card Details (or use Google Pay if active).
    *   *Note: If using Test Mode, use Stripe Test Card (4242 4242...).*

## 3. The Magic Moment (The Transfer)
*As soon as the customer hits "Pay":*
1.  **WATCH THE TPV**:
    *   A Gold Badge should appear/blink.
    *   Sound: "Ding-Dong" or TTS Voice "Novo pedido de Hambúrguer da Casa".
    *   Status: **"PAID"** (Green).

## 4. The Response (The Execution)
*"I am the Manager/Chef."*
1.  Click the Order Card on TPV.
2.  **Action**: "Enviar para Cozinha".
3.  **Result**: Order Card moves to "Preparing" / "Sent".
4.  *Optional*: Print Ticket (if printer connected).

## 5. The Verdict (Truth)
1.  Did the money arrive? (Check Stripe Dashboard).
2.  Did the kitchen know? (Check TPV).
3.  Did the customer wait? (Zero latency confirmed).

---
**Status:** READY TO EXECUTE.
**Next Step:** Configure Keys & IP.
