# DEVICE ROLES & ACCESS MATRIX

This document defines the physical boundaries of the ChefIApp system.
"We do not restrict; we specialize."

## 1. THE LAWS
1.  **Onboarding (Foundation)**: Universal. Any device can start the process.
2.  **Operation (Command)**: Restricted. Only devices capable of professional throughput (Desktop/Tablet) can operate.
3.  **Mobile**: Companion. It monitors, alerts, and displays. It does not operate transactions.

## 2. DEVICE ROLES

### 📱 MOBILE: The Companion
*   **Role**: Monitoring, Alerts, Quick Status.
*   **Context**: "In the pocket", "On the move".
*   **Limits**: 
    *   Cannot open/close cash register.
    *   Cannot process POS orders.
    *   Cannot edit menu structure.
*   **UX Mode**: "Modo Companion Ativado".
*   **Primary Action**: Copy Link to Operation.

### 📟 TABLET: The Field Unit
*   **Role**: POS (Point of Sale), KDS (Kitchen Display), Waiter Pad.
*   **Context**: "In hand", "On counter", "Mounted on wall".
*   **Limits**: None technically, but UX warns about layout optimization for heavy admin tasks.
*   **UX Mode**: "Tablet Detectado".
*   **Primary Action**: Enter Operational Dashboard.

### 💻 DESKTOP: The Command Center (HQ)
*   **Role**: Full Operation, Financials, Staff Management, Heavy Editing.
*   **Context**: "In the office", "At the counter".
*   **Limits**: None. The sovereign view.
*   **UX Mode**: "Centro de Comando Operacional".
*   **Primary Action**: Enter Operational Dashboard.

## 3. TECHNICAL IMPLEMENTATION
*   **Detection**: `window.innerWidth` thresholds (<768, <1024, >1024).
*   **Persistence**: `localStorage.setItem('chefiapp_device_role', 'mobile' | 'tablet' | 'desktop')`.
*   **Enforcement**: `ScreenFoundation` acts as the primary gatekeeper post-onboarding.
