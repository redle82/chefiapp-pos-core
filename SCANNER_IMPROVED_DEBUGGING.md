# Scanner Mode — Improved iOS Debugging Guide

## What Changed

Your camera implementation has been **enhanced with better error diagnostics** and more robust iOS handling:

### 1. **Better Error Logging**

- Every step of camera initialization now logs to the console (Open DevTools with F12)
- Logs show: `[Scanner]` prefix for easy filtering
- All camera states tracked: permission request → stream received → playback started → scanning active

### 2. **Simplified iOS Camera Constraints**

- **Previous**: Used height/width ideals (may fail on some iPhones)
- **Current**: Minimal constraints (just `facingMode: "environment"`) for better compatibility
- Falls back gracefully if any constraint fails

### 3. **Debug Information Panel** (In App)

- When camera fails, you now see a debug panel showing:
  - ✅ Browser available
  - ✅ getUserMedia supported
  - ✅ BarcodeDetector available
  - ✅ HTTPS status
- Helps identify **which** capability is missing

### 4. **Retry Button**

- If camera fails, click "🔄 Tentar novamente" to retry without reloading
- Useful if permission popup was dismissed

---

## Testing Steps (iPhone + Safari)

### **Step 1: Open DevTools in Safari**

1. On Desktop Mac: Open Safari → Develop → [Your iPhone Name] → [Your Page]
2. This shows console logs of what's happening
3. Or use `remote inspection` via USB cable

### **Step 2: Clear Permissions & Start Fresh**

1. On iPhone: Settings → Safari → Clear History and Website Data
2. Open `/app/staff/home` in Safari again
3. When prompted: "Allow camera access?" → **Tap Allow**
4. DevTools console should show:
   ```
   [Scanner] Starting camera...
   [Scanner] Requesting camera with constraints...
   [Scanner] Camera stream obtained...
   [Scanner] Setting up video playback...
   [Scanner] Video playing successfully
   [Scanner] BarcodeDetector available, starting scan
   [Scanner] Scanning started
   ```

### **Step 3: If Camera Opens**

- You should see live video from iPhone camera
- Tap "📷 Câmera" tab if it's not already selected
- Point at a barcode (EAN-13, QR code, etc.) and hold for 2 seconds
- Console should show:
  ```
  [Scanner] Barcode detected: 5901234123457
  ```
- App should auto-lookup the ingredient

### **Step 4: If Camera Fails** (Currently Blocked)

- You'll see error message + debug panel
- **Check the debug panel**, what does it show?
  - If `getUserMedia: Não` → Browser doesn't support camera access
  - If `BarcodeDetector: Não` → Browser can't detect barcodes (need manual mode)
  - If `HTTPS: Não` → Only works in HTTPS in production (localhost is OK)

### **Step 5: Check Console Logs** (Most Important)

1. Right-click on error message
2. Select "Inspect Element" or open Web Inspector
3. Go to "Console" tab
4. Look for logs starting with `[Scanner]:`
   - `[Scanner] Camera error: { message: "...", name: "..." }`
   - **Send me the exact error message/name** from console

---

## Common Issues & Solutions

| Issue                                | Likely Cause                | Solution                                    |
| ------------------------------------ | --------------------------- | ------------------------------------------- |
| Permission popup never appears       | Permissions already blocked | Settings → Safari → Reset Camera Permission |
| Camera black screen after permission | iOS video playback issue    | Try clicking video area, or refresh page    |
| `getUserMedia` error                 | Browser doesn't support     | Only Chrome/Edge/Safari 14.5+ support this  |
| `BarcodeDetector` unavailable        | Older Safari                | Use manual mode for now (temporary)         |
| "Permissão negada" message           | Permission blocked          | Settings → Safari → Allow Camera            |

---

## Debug Information Panel Explained

When camera fails, you see this:

```
📱 Browser: Disponível
📷 getUserMedia: Sim/Não
🔍 BarcodeDetector: Sim/Não
🔐 HTTPS: Sim/Não (localhost OK)
```

What each means:

- **Browser: Disponível** → Safari is loaded
- **getUserMedia: Sim** → Can access camera API
- **BarcodeDetector: Sim** → Can detect barcodes
- **HTTPS** → In production, must run over HTTPS

If any of these are **Não**, that's your blocker.

---

## Console Logging Reference

Open DevTools Console and watch these logs during camera startup:

```javascript
// Log 1: Starting
[Scanner] Starting camera...

// Log 2: Requesting access
[Scanner] Requesting camera with constraints: { video: { facingMode: "environment" }, audio: false }

// Log 3: Stream received
[Scanner] Camera stream obtained: MediaStream {...}

// Log 4: Video setup
[Scanner] Setting up video playback...

// Log 5a: Success
[Scanner] Video playing successfully
[Scanner] Camera active, stream ready

// Log 5b: Error (catch one of these)
[Scanner] Play error (may be normal on iOS): NotAllowedError
[Scanner] Camera error: { message: "Permission denied", name: "NotAllowedError" }

// Log 6: Start scanning
[Scanner] BarcodeDetector available, starting scan
[Scanner] Checking for BarcodeDetector...
[Scanner] Creating BarcodeDetector instance...
[Scanner] BarcodeDetector created successfully
[Scanner] Scanning started

// Log 7: Barcode found
[Scanner] Barcode detected: 5901234123457
```

---

## What to Send Me

**When camera doesn't work, send:**

1. **Screenshot of debug panel** (what's Sim vs Não?)
2. **Console log output** (Lines showing `[Scanner]` errors)
3. **Device info:**
   - iPhone model (e.g., iPhone 13)
   - iOS version (Settings → General → About)
   - Safari version (Safari → Settings/Preferences)
4. **Permission status:**
   - Did permission popup appear? (Yes/No)
   - Did you see "Allow" or "Don't Allow"? (Which did you tap?)

---

## Testing Checklist

- [ ] iPhone + Safari opened
- [ ] Navigated to `/app/staff/home`
- [ ] DevTools console visible (F12)
- [ ] Clicked "📷 Câmera" tab in scanner
- [ ] Saw permission prompt
- [ ] Logs show `[Scanner]` messages
- [ ] Camera either opened OR error displayed
- [ ] Debug panel visible with browser capabilities
- [ ] Able to identify which API is failing

---

## Next Steps (After Testing)

Once you complete testing and send me the console logs + debug info, I'll:

1. **Diagnose the specific iOS issue** (permission, playback, or BarcodeDetector)
2. **Implement targeted fix** (iOS-specific workaround)
3. **Test again** on your iPhone to verify fix works
4. **Add fallback modes** if certain APIs unavailable

---

**Remember**: Open DevTools console (F12) before testing. The logs will tell us exactly where it's failing! 🔍
