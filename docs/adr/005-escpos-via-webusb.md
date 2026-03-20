# ADR-005: ESC/POS via WebUSB

## Status

Accepted

## Context

Restaurants need to print thermal receipts, kitchen tickets, and labels from
the POS terminal. Traditional approaches require a print server or native
application to communicate with thermal printers. Since ChefIApp runs as a
web application in the browser, we needed a way to drive ESC/POS thermal
printers without any server-side infrastructure.

## Decision

We use the **WebUSB API** to communicate directly with ESC/POS thermal
printers from the browser.

Key components:
- `core/printing/WebUSBTransport.ts` -- low-level USB communication layer
- `core/printing/EscPosDriver.ts` -- ESC/POS binary command builder (text
  formatting, barcodes, QR codes, cut commands)
- `core/printing/PrintService.ts` -- high-level service that combines
  templates with the driver
- `core/printing/templates/` -- receipt and ticket templates
- `core/printing/CashDrawerDriver.ts` -- ESC/POS cash drawer kick command
- `core/print/PrintQueue.ts` -- queued print job management
- `core/print/PrintQueueProcessor.ts` -- processes queued jobs sequentially
- `core/print/DesktopPrintAgentApi.ts` -- fallback for native print agent
- `core/print/LabelEngineApi.ts` -- label-specific printing

The printer connection requires a one-time USB permission gesture from the
user (browser security requirement).

## Consequences

**Positive:**
- No print server required -- direct browser-to-printer communication
- Works offline (printing does not need internet)
- Full control over ESC/POS binary output (formatting, logos, QR codes)
- Cash drawer integration through the same USB connection
- Print queue ensures jobs are processed reliably

**Negative:**
- WebUSB requires HTTPS and a user gesture for initial device pairing
- Not supported in all browsers (works in Chrome/Edge, not Firefox/Safari)
- USB permission must be re-granted after clearing browser data
- ESC/POS command set varies between printer manufacturers
- Desktop Print Agent needed as fallback for browsers without WebUSB support
- Debugging binary printer output is difficult
