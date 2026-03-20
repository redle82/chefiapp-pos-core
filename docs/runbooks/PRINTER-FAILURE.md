# Runbook: Printer Failure

**Alert Rule**: `printer_consecutive_failures`
**Severity**: WARNING
**Threshold**: More than 3 consecutive print failures (failures > 3 AND failures > successes)
**Cooldown**: 30 minutes

---

## Symptoms

- Alert "Printer Consecutive Failures" triggered on the Monitoring dashboard
- Receipts/tickets are not printing
- `printer.failed` counter is higher than `printer.success` in Metrics section
- Staff reports the printer is not responding
- Print queue is backing up (check "Printer" in System Health widget)

## Impact

- **Customer receipts**: customers cannot receive printed receipts
- **Kitchen tickets**: if using printed kitchen tickets instead of KDS, kitchen is stalled
- **Fiscal compliance**: some jurisdictions require printed receipts for every transaction

## Investigation Steps

### 1. Check physical printer (1 min)

- Is the printer powered on? Check the power LED
- Is there paper in the roll? An empty roll will cause failures
- Is the paper jammed? Open the cover and check
- Is the USB/network cable connected?

### 2. Check USB connection (1 min)

For USB-connected thermal printers:
- Unplug and replug the USB cable
- Try a different USB port
- Check if the OS recognizes the device (system settings > printers)

### 3. Check printer status in the POS (1 min)

- In System Health widget, check "Printer" status
- Expand details to see:
  - `pendingJobs`: number of jobs waiting to print
  - If "Print queue not available", the print module is not loaded

### 4. Check browser permissions (1 min)

ESC/POS printing via WebUSB requires browser permissions:
- Open browser DevTools > Console
- Look for `[PrintQueue]` or `[ESC/POS]` error messages
- Common errors:
  - `SecurityError`: WebUSB not allowed (needs HTTPS or localhost)
  - `NotFoundError`: printer not found on USB bus
  - `NetworkError`: USB device disconnected during transfer

### 5. Check print queue for stuck jobs (1 min)

- If `pendingJobs` is high (> 10), the queue is backed up
- A single malformed print job can block the entire queue
- Check console logs for the specific error on the stuck job

## Resolution

### If printer is out of paper

1. Open the printer cover
2. Insert a new thermal paper roll (ensure print side faces out)
3. Close the cover
4. The print queue should resume automatically

### If USB connection lost

1. Unplug the USB cable from the POS device
2. Wait 5 seconds
3. Replug the USB cable
4. Refresh the browser page to re-initialize the WebUSB connection
5. The print queue should resume

### If printer is unresponsive (hardware issue)

1. Power cycle the printer:
   - Turn off the printer
   - Wait 10 seconds
   - Turn on the printer
2. Reconnect the USB cable
3. Refresh the browser page
4. Test with a single print job

### If browser lost WebUSB permission

1. Click the lock icon in the browser address bar
2. Check if USB device permissions are granted
3. If not, re-grant permission:
   - Navigate to the print settings in the POS
   - Click "Connect Printer"
   - Select the printer from the WebUSB device picker
4. Test with a single print job

### If print queue is stuck

1. If a specific job is blocking the queue, it may need to be cleared
2. Refresh the browser page to reset the in-memory print queue
3. Note: pending print jobs will be lost on refresh
4. Re-print any critical receipts manually after reconnection

### Fallback: Digital receipt

If the printer cannot be restored during service:
1. Switch to digital receipt mode:
   - Show the receipt on-screen for the customer
   - Offer to send via email/WhatsApp if configured
2. Continue operations without printing
3. Fix the printer after service hours

## Escalation

| Condition | Action |
|---|---|
| 3+ failures, printer unresponsive | Notify restaurant manager |
| Cannot restore after 10 min | Switch to digital receipt fallback |
| Hardware failure confirmed | Order replacement printer |
| Fiscal compliance risk | Document affected transactions for manual receipt generation later |

## Common Printer Models and Quirks

| Model | Connection | Common Issue |
|---|---|---|
| Epson TM-T20III | USB | Needs specific baud rate; check ESC/POS driver config |
| Star TSP143 | USB/LAN | Auto-cutter jam; open cover, clear paper, close |
| Generic 80mm | USB | May need CH341 driver on some OS versions |

## Post-Incident

- [ ] Verify all transactions during the outage have receipts (digital or printed)
- [ ] Clear any remaining stuck jobs from the print queue
- [ ] Check if the printer needs maintenance (cutter, roller, thermal head)
- [ ] Consider a backup printer for critical operations
