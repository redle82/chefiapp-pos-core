# Scanner Mode — Camera Implementation

**Status**: ✅ **IMPLEMENTED** with iOS Debugging Enhancements (2025-01-XX)

> **Update**: Debug version with enhanced error messages and console logging deployed. If camera not working on iPhone, see [SCANNER_IMPROVED_DEBUGGING.md](../SCANNER_IMPROVED_DEBUGGING.md) for troubleshooting steps and console log analysis.

## Overview

The Scanner Mode in AppStaff now uses **camera-based barcode scanning** via native Web APIs instead of USB HID scanner input. This is the correct approach for a **mobile-first PWA** running on phones/tablets.

---

## Problem: USB Input on Mobile PWA

**Initial Implementation Error**: The first version used `<input type="text">` expecting a USB HID scanner (NETUM C750), which is fundamentally incompatible with mobile devices that have **no USB ports**.

**User Feedback**: _"Como é que isso esse módulo no App staff vai se comportar como um leitor de código de barras se aciona a câmera nem nada... não tem sentido você colocou um leitor externo dentro do aplicativo"_

Translation: _"How is this module in the Staff App going to behave as a barcode reader if it doesn't activate the camera or anything... it doesn't make sense to put an external reader inside the app"_

**Correct Solution**: Use the **phone's camera** to scan barcodes via native `BarcodeDetector` Web API.

---

## Technical Architecture

### Native Web APIs Used

1. **`navigator.mediaDevices.getUserMedia()`**

   - Accesses device camera
   - `facingMode: "environment"` → Uses rear camera
   - Browser permission required (HTTPS only in production)

2. **`BarcodeDetector` API**

   - Detects barcodes from camera feed
   - Formats: EAN-13, EAN-8, Code 128, QR Code, UPC-A, UPC-E
   - Supported: Chrome, Edge, Safari on mobile

3. **Canvas 2D API**
   - Captures video frames for barcode detection
   - Does not interfere with video playback

### Scanning Flow

```
1. User opens Scanner mode → Navigates to /app/staff/mode/scanner
2. Component mounts → startCamera() called (if scanMode === "camera")
3. getUserMedia() → Camera permission prompt
4. Video stream rendered in <video> element
5. startScanning() → setInterval every 500ms:
   - Draw current video frame to hidden canvas
   - BarcodeDetector.detect(canvas) → Extract barcode
   - If barcode detected → setBarcode() + handleLookup()
6. Lookup ingredient by barcode → Display result
7. User confirms quantity + location → Quick IN movement
```

---

## File Modified

**File**: `merchant-portal/src/pages/AppStaff/pages/ScannerModePage.tsx` (859 lines)

### Key Changes

#### 1. **State Management** (New Camera State)

```tsx
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);
const streamRef = useRef<MediaStream | null>(null);
const scanIntervalRef = useRef<number | null>(null);

const [cameraActive, setCameraActive] = useState(false);
const [cameraError, setCameraError] = useState("");
const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");
```

#### 2. **Camera Control Functions**

```tsx
const startCamera = useCallback(async () => {
  if (!("BarcodeDetector" in window)) {
    setCameraError("BarcodeDetector não suportado neste browser...");
    setScanMode("manual");
    return;
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
  });
  // ... setup video stream + start scanning
}, [startScanning]);

const stopCamera = useCallback(() => {
  // Stop all tracks, clear interval, reset state
}, []);
```

#### 3. **Continuous Scanning Loop**

```tsx
const startScanning = useCallback(() => {
  const detector = new BarcodeDetector({
    formats: ["ean_13", "ean_8", "code_128", "qr_code", "upc_a", "upc_e"],
  });

  scanIntervalRef.current = window.setInterval(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Draw video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Detect barcodes
    const barcodes = await detector.detect(canvas);
    if (barcodes.length > 0) {
      const code = barcodes[0].rawValue;
      setBarcode(code);
      handleLookup(code); // Auto-lookup on detection
    }
  }, 500); // Scan every 500ms
}, [processing, barcode, handleLookup]);
```

#### 4. **UI Toggle: Camera vs Manual**

```tsx
<button onClick={() => setScanMode("camera")}>📷 Câmera</button>
<button onClick={() => setScanMode("manual")}>⌨️ Manual</button>

{scanMode === "camera" && (
  <video ref={videoRef} style={{ width: "100%", borderRadius: 8 }} playsInline muted />
  <canvas ref={canvasRef} style={{ display: "none" }} />
)}

{scanMode === "manual" && (
  <input
    type="text"
    value={barcode}
    onChange={(e) => setBarcode(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
  />
)}
```

---

## Browser Compatibility

### BarcodeDetector Support

| Browser | Mobile | Desktop    | Status             |
| ------- | ------ | ---------- | ------------------ |
| Chrome  | ✅ Yes | ✅ Yes     | Full support       |
| Edge    | ✅ Yes | ✅ Yes     | Full support       |
| Safari  | ✅ Yes | ⚠️ Partial | iOS 17+, macOS 14+ |
| Firefox | ❌ No  | ❌ No      | Not supported      |

**Fallback**: If `BarcodeDetector` is not available, the component automatically switches to "manual" mode and shows a message:

> "BarcodeDetector não suportado neste browser. Use Chrome/Edge ou modo manual."

### Camera Permission (HTTPS Required)

- **Development** (localhost): Works without HTTPS
- **Production**: Requires HTTPS to access camera (PWA requirement)

---

## Testing Instructions

### 1. **Open AppStaff Scanner Mode**

```bash
# Ensure merchant portal dev server is running
pnpm --filter merchant-portal run dev

# Open in browser (mobile/desktop)
http://localhost:5175/app/staff/home

# Navigate: Tap "⋯ Mais" → Select "📷 Scanner"
# Or direct URL: http://localhost:5175/app/staff/mode/scanner
```

### 2. **Test Camera Scanning (Mobile)**

1. Allow camera permission when prompted
2. Point camera at a barcode (EAN-13, UPC, QR, etc.)
3. Wait for auto-detection (~0.5s)
4. Verify barcode appears at bottom of video
5. Check lookup result:
   - ✅ Found → Quick IN movement UI appears
   - ❌ Not found → Associate barcode UI appears

### 3. **Test Manual Mode**

1. Tap "⌨️ Manual" button to switch
2. Type barcode manually
3. Press Enter or tap 🔍 button
4. Verify lookup works identically

### 4. **Test Quick IN Movement**

1. Scan/enter a known barcode (ingredient must exist)
2. Select location from dropdown
3. Enter quantity (default: 1)
4. Tap "📥 Entrada" button
5. Verify:
   - Success message: `✅ +1 kg de Farinha registado (1 movimentos)`
   - Counter increments
   - History entry added
   - Barcode clears → Ready for next scan

### 5. **Test Associate Workflow**

1. Scan/enter an unknown barcode
2. Message: `❓ Barcode "..." não associado`
3. Select ingredient from dropdown
4. Tap "🔖 Associar barcode"
5. Verify:
   - Success message: `✅ Barcode "..." associado a "..."`
   - Barcode now works in future scans

---

## No NPM Dependencies Added

This implementation uses **native Web APIs only**:

- ✅ No `html5-qrcode` library (installation failed due to terminal issues)
- ✅ No `quagga2` or other barcode scanning libraries
- ✅ Zero bundle size increase
- ✅ Faster (native browser implementation)

---

## Navigation & Visibility

### Route

```tsx
// merchant-portal/src/routes/OperationalRoutes.tsx
<Route
  path="mode/scanner"
  element={
    <StaffAppGate>
      <StaffRoleGuard modeId="scanner">
        <StaffAppShellLayout>
          <ScannerModePage />
        </StaffAppShellLayout>
      </StaffRoleGuard>
    </StaffAppGate>
  }
/>
```

### Visibility (Role-Based)

```tsx
// merchant-portal/src/pages/AppStaff/visibility/appStaffVisibility.ts
scanner: {
  owner: true,
  manager: true,
  waiter: false,
  kitchen: false,
  cleaning: false,
  worker: false,
}
```

### Mode Config

```tsx
// merchant-portal/src/pages/AppStaff/routing/staffModeConfig.ts
{
  id: "scanner",
  path: "/app/staff/mode/scanner",
  label: "Scanner",
  icon: "📷",
  fullScreen: true,
}
```

---

## Known Issues & Limitations

### 1. **BarcodeDetector Not Available**

- **Issue**: Not supported in Firefox, older browsers
- **Solution**: Auto-fallback to manual mode with clear message

### 2. **Camera Permission Denied**

- **Issue**: User denies camera permission
- **Solution**: Error message → Auto-switch to manual mode

### 3. **Low Light Detection**

- **Issue**: Barcodes may not scan in poor lighting
- **Solution**: User can switch to manual mode anytime (toggle buttons)

### 4. **Camera Focus Issues**

- **Issue**: Some mobile cameras struggle with autofocus on barcodes
- **Solution**: Hold phone steady, ensure barcode is well-lit and in focus

### 5. **HTTPS Requirement in Production**

- **Issue**: `getUserMedia()` requires HTTPS (except localhost)
- **Solution**: Ensure AppStaff is served via HTTPS in production (Vercel handles this automatically)

---

## Future Enhancements

### 1. **Torch/Flashlight Toggle** (Low Priority)

```tsx
// Enable flashlight for low-light scanning
<button onClick={toggleTorch}>🔦 Lanterna</button>;

const toggleTorch = async () => {
  const track = streamRef.current?.getVideoTracks()[0];
  if (track && "torch" in track.getCapabilities()) {
    await track.applyConstraints({ advanced: [{ torch: true }] });
  }
};
```

### 2. **Barcode Highlight Overlay** (Low Priority)

- Draw bounding box around detected barcode on video feed
- Visual feedback that barcode is recognized

### 3. **Multi-Barcode Scanning** (Future)

- Scan multiple products in one session
- Batch IN movements

### 4. **USB HID Scanner Support (Desktop Only)** (Low Priority)

- For desktop users with NETUM C750 or similar USB scanners
- Keep manual input field active → Detect Enter key patterns
- Auto-switch based on device type (mobile/desktop)

---

## Related Files

### Modified

- ✅ `merchant-portal/src/pages/AppStaff/pages/ScannerModePage.tsx` (859 lines)
- ✅ `merchant-portal/src/pages/AppStaff/routing/staffModeConfig.ts` (Added scanner mode)
- ✅ `merchant-portal/src/pages/AppStaff/visibility/appStaffVisibility.ts` (Added scanner visibility)
- ✅ `merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx` (Added scanner to \_allModeIds)
- ✅ `merchant-portal/src/routes/OperationalRoutes.tsx` (Added scanner route)

### Unchanged (Business Logic Reused)

- `merchant-portal/src/infra/readers/InventoryStockReader.ts` (lookupIngredientByBarcode, associateBarcode, readIngredients)
- `merchant-portal/src/infra/docker-core/connection.ts` (dockerCoreClient)
- Database RPCs: `lookup_ingredient_by_barcode`, `associate_barcode`, `apply_stock_movement`

---

## Checklist: Definition of Done

- ✅ Camera-based scanning implemented with native BarcodeDetector API
- ✅ Manual mode fallback for unsupported browsers
- ✅ Toggle between camera/manual modes
- ✅ Auto-lookup on barcode detection
- ✅ Quick IN movement workflow (location + qty)
- ✅ Associate unknown barcode workflow
- ✅ Session history tracking
- ✅ Movement counter badge in header
- ✅ Error handling (camera permission denied, BarcodeDetector unavailable)
- ✅ TypeScript compile errors: 0
- ✅ Lint warnings: Only inline styles (pre-existing pattern across AppStaff)
- ✅ No npm dependencies added
- ✅ Mobile-first design (rear camera, responsive UI)
- ✅ HTTPS-compatible (getUserMedia requirement)

---

## Deployment Notes

### Pre-Deployment Checklist

1. ✅ Merchant portal dev server compiles without errors
2. ⚠️ Test on mobile device (iOS Safari, Android Chrome)
3. ⚠️ Verify camera permission flow on HTTPS staging environment
4. ⚠️ Test with real barcodes (EAN-13, QR codes)
5. ⚠️ Verify quick IN movement creates correct stock records in Supabase

### Production Readiness

- **Status**: ⚠️ **READY FOR TESTING** (camera implementation complete)
- **Next Step**: Mobile device testing with real barcodes
- **Deploy When**: Camera scanning tested successfully on iOS/Android

---

**Last Updated**: 2025-01-XX
**Author**: GitHub Copilot (Claude Sonnet 4.5)
**Review Status**: ⚠️ Awaiting user testing on mobile device
