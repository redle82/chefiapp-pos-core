# UI/UX Forensic Findings (Static) - Sat Dec 27 04:36:22 CET 2025
## Stripe / secrets
merchant-portal/src/components/payment/StripePaymentModal.tsx:9:const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK || 'pk_test_51QPq6mP0T4s1Xy7z1r8j2k3l4m5n6o7p8q9r0s1t2u3v4w5x');

## Blocking UX
merchant-portal/src/pages/Inventory/ReceivingDashboard.tsx:69:        alert("Realidade Commitada! Estoque Atualizado. Preços Médios Recalculados.");
merchant-portal/src/pages/TPVReadyPage.tsx:193:                <button className="btn primary" onClick={() => alert('Upgrade flow em breve!')}>
merchant-portal/src/public/components/CartDrawer.tsx:66:        alert(`Pedido enviado para o balcão! ID: ${orderId}`);
merchant-portal/src/pages/TPV/TPV.tsx:167:        alert('Pagamento Confirmado! 🛡️');
merchant-portal/src/pages/TPV/TPV.tsx:172:      alert(`Atenção: Pagamento incerto (${reason}). Mesa fechada preventivamente.`);
merchant-portal/src/pages/Settings/StaffPage.tsx:50:            alert('Erro ao criar convite. O sistema nervoso falhou.');

## Fetch/Timeout
merchant-portal/src/analytics/track.ts:59:    const res = await fetch(url, {
merchant-portal/src/pages/TPV/TPV.tsx:212:        const res = await fetch(`${apiBase}/api/payment-intent`, {
merchant-portal/src/pages/Public/PublicPages.tsx:51:        const res = await fetch(`/api/public/${slug}`);
merchant-portal/src/pages/Public/PublicPages.tsx:94:      const res = await fetch(`/api/public/${restaurant.slug}/orders`, {
merchant-portal/src/pages/start/PublishPage.tsx:117:      const res = await fetch(`${apiBase}/api/publish`, {
merchant-portal/src/pages/start/CreatingPage.tsx:58:      const res = await fetch(`${apiBase}/api/onboarding/start`, {
merchant-portal/src/core/health/useCoreHealth.ts:104:      const res = await fetch(url, {
merchant-portal/src/core/payment/usePaymentGuard.ts:28:                const res = await fetch(`${apiBase}/payment/verify`, {
merchant-portal/src/pages/SetupLayout.tsx:86:          const res = await fetch(`${apiBase.replace(/\/$/, '')}/health`, { signal: controller.signal })
merchant-portal/src/core/health.ts:6:    const res = await fetch(url, { method: 'GET' })
merchant-portal/src/core/queue/useOfflineReconciler.ts:54:                            const res = await fetch(`${apiBase}/api/orders`, {
merchant-portal/src/core/queue/useOfflineReconciler.ts:68:                            const res = await fetch(
merchant-portal/src/core/queue/useOfflineReconciler.ts:87:                            const res = await fetch(
merchant-portal/src/api.ts:18:  const res = await fetch(url, init);

## AbortController usage
merchant-portal/src/tests/SofiaSimulation.ts:16:    // Mock signal: None (Inventory is low but it's not Wednesday)
merchant-portal/src/tests/SofiaSimulation.ts:30:    // Mock signal: System generates "Calendar Ritual" signal
merchant-portal/src/pages/SetupLayout.tsx:82:    const controller = new AbortController()
merchant-portal/src/pages/SetupLayout.tsx:86:          const res = await fetch(`${apiBase.replace(/\/$/, '')}/health`, { signal: controller.signal })
merchant-portal/src/pages/TPV/TPV.tsx:208:      const controller = new AbortController();
merchant-portal/src/pages/TPV/TPV.tsx:224:          signal: controller.signal
merchant-portal/src/components/inventory/HungerSignalCard.tsx:8:    signal: InventorySignal;
merchant-portal/src/core/health/useCoreHealth.ts:101:      const controller = new AbortController()
merchant-portal/src/core/health/useCoreHealth.ts:106:        signal: controller.signal,

## AnimatePresence wait
merchant-portal/src/cinematic/CinemaLayout.tsx:19:                <AnimatePresence mode="wait">
merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx:225:                <AnimatePresence mode='wait'>
merchant-portal/src/main.tsx:74:    <AnimatePresence mode="wait">
merchant-portal/src/cinematic/scenes/Scene4Beverages.tsx:178:                                <AnimatePresence mode="wait">
merchant-portal/src/cinematic/scenes/Scene4FirstItem.tsx:31:                <AnimatePresence mode="wait">

## ErrorBoundary
merchant-portal/src/main.tsx:170:          <ErrorBoundary context="TPV">
merchant-portal/src/main.tsx:172:          </ErrorBoundary>
merchant-portal/src/main.tsx:177:          <ErrorBoundary context="KDS">
merchant-portal/src/main.tsx:179:          </ErrorBoundary>
merchant-portal/src/main.tsx:184:          <ErrorBoundary context="Staff Operations">
merchant-portal/src/main.tsx:186:          </ErrorBoundary>
merchant-portal/src/main.tsx:191:          <ErrorBoundary context="Inventory">
merchant-portal/src/main.tsx:193:          </ErrorBoundary>
merchant-portal/src/main.tsx:258:import { ErrorBoundary } from './ui/design-system/ErrorBoundary'
merchant-portal/src/main.tsx:266:      <ErrorBoundary context="App Root">
merchant-portal/src/main.tsx:268:      </ErrorBoundary>
merchant-portal/src/ui/design-system/ErrorBoundary.tsx:16: * ErrorBoundary - The Safety Net (Layer 4)
merchant-portal/src/ui/design-system/ErrorBoundary.tsx:21:export class ErrorBoundary extends Component<Props, State> {
merchant-portal/src/ui/design-system/ErrorBoundary.tsx:27:    public static getDerivedStateFromError(error: Error): State {
merchant-portal/src/ui/design-system/ErrorBoundary.tsx:31:    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
