# Day 3 Frontend Integration Guide

**Status**: Backend 100% complete | Frontend integration = ~2-3 hours remaining work

## Architecture Overview

The onboarding flow now has 3 layers:

```
┌─────────────────────────────────────────────────────┐
│ UI Layer (OnboardingAssistantPage + 9 screens)     │ ← Existing components
│ Shows forms, captures data, displays progress       │
└─────────────────────────────────────────────────────┘
                         ↓ calls
┌─────────────────────────────────────────────────────┐
│ State Management (useOnboarding hook)               │ ← New hook
│ Manages form state, calling RPCs, progress tracking │
└─────────────────────────────────────────────────────┘
                         ↓ calls
┌─────────────────────────────────────────────────────┐
│ Service Layer (OnboardingClient)                    │ ← New service
│ RPC calls to backend (create, update, get state)    │
└─────────────────────────────────────────────────────┘
                         ↓ calls
┌─────────────────────────────────────────────────────┐
│ Backend API (PostgREST + RPC functions)             │ ← Already built
│ Persists state, enforces RLS, manages workflows     │
└─────────────────────────────────────────────────────┘
```

## Step-by-Step Integration

### Step 1: Update WelcomePage.tsx (5 min)

**Current state**: Shows "Começar Configuração Guiada" button
**Needed change**: Initialize backend onboarding context when clicked

```typescript
import { useOnboarding } from "../hooks/useOnboarding";

export function WelcomePage() {
  const navigate = useNavigate();
  const { initializeOnboarding, state } = useOnboarding();

  const handleCreateRestaurant = async () => {
    try {
      // Show input dialog or modal for restaurant name
      const restaurantName = prompt("Nome do restaurante:");
      if (!restaurantName) return;

      // Initialize backend context
      const context = await initializeOnboarding(restaurantName);

      // Navigate to onboarding screens
      navigate("/onboarding");
    } catch (error) {
      console.error("Failed to create restaurant:", error);
      alert("Erro ao criar restaurante");
    }
  };

  return (
    // ... existing code ...
    <button onClick={handleCreateRestaurant}>
      Começar Configuração Guiada
    </button>
  );
}
```

### Step 2: Update OnboardingAssistantPage.tsx (30 min)

**Current state**: Collects 7 form fields, stores in sessionStorage
**Needed change**: Integrate with useOnboarding hook for backend persistence

```typescript
import { useOnboarding } from "../../hooks/useOnboarding";

export function OnboardingAssistantPage() {
  const navigate = useNavigate();
  const { state, completeStep, currentStep } = useOnboarding();

  const [nome, setNome] = useState("");
  const [pais, setPais] = useState("PT");
  // ... other fields ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Save form data to backend (updates current step)
      await completeStep("restaurant_setup", {
        restaurant_name: nome,
        country: pais,
        type: tipo,
        num_tables: numMesas ? parseInt(numMesas) : undefined,
        has_printer: usaImpressora,
        uses_kds: usaKDS,
        estimated_users: numUsuarios ? parseInt(numUsuarios) : undefined,
      });

      // Navigate to next screen
      navigate("/onboarding/legal");
    } catch (error) {
      console.error("Failed to save restaurant setup:", error);
      alert("Erro ao salvar configurações");
    }
  };

  // Show loading state if data not ready
  if (!state) {
    return <div>Carregando...</div>;
  }

  return (
    // ... existing form JSX ...
    <form onSubmit={handleSubmit}>// ... existing fields ...</form>
  );
}
```

### Step 3: Create Screen Components (1 hour)

For each of the 9 screens, follow this pattern:

```typescript
// src/pages/Onboarding/screens/OnboardingStep1Welcome.tsx
import { useOnboarding } from "../../../hooks/useOnboarding";

export function OnboardingStep1Welcome() {
  const { completeStep } = useOnboarding();

  const handleContinue = async () => {
    await completeStep("welcome", {
      timestamp: new Date().toISOString(),
    });
    // Navigate to next screen
  };

  return (
    <div className="onboarding-screen">
      <h1>Bem-vindo</h1>
      <p>Vamos configurar o seu restaurante em 9 passos.</p>
      <button onClick={handleContinue}>Continuar</button>
    </div>
  );
}
```

**Repeat for each of 9 steps**:

1. `OnboardingStep1Welcome.tsx`
2. `OnboardingStep2RestaurantSetup.tsx` (already exists as OnboardingAssistantPage)
3. `OnboardingStep3LegalInfo.tsx` (owner name, tax ID, etc)
4. `OnboardingStep4Menu.tsx` (create first product)
5. `OnboardingStep5Staff.tsx` (add staff members)
6. `OnboardingStep6Payment.tsx` (configure payment method)
7. `OnboardingStep7Devices.tsx` (register devices)
8. `OnboardingStep8Verification.tsx` (run checks)
9. `OnboardingStep9Complete.tsx` (success screen)

### Step 4: Update Routing (15 min)

Add routes for each screen:

```typescript
// src/routes/index.tsx
import { OnboardingStep1Welcome } from "../pages/Onboarding/screens/OnboardingStep1Welcome";
import { OnboardingStep2RestaurantSetup } from "../pages/Onboarding/screens/OnboardingStep2RestaurantSetup";
// ... import other steps ...

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />

      <Route path="/onboarding" element={<OnboardingLayout />}>
        <Route index element={<OnboardingStep1Welcome />} />
        <Route path="restaurant" element={<OnboardingStep2RestaurantSetup />} />
        <Route path="legal" element={<OnboardingStep3LegalInfo />} />
        <Route path="menu" element={<OnboardingStep4Menu />} />
        <Route path="staff" element={<OnboardingStep5Staff />} />
        <Route path="payment" element={<OnboardingStep6Payment />} />
        <Route path="devices" element={<OnboardingStep7Devices />} />
        <Route path="verify" element={<OnboardingStep8Verification />} />
        <Route path="complete" element={<OnboardingStep9Complete />} />
      </Route>

      {/* ... other routes ... */}
    </Routes>
  );
}
```

### Step 5: Add OnboardingProvider to App Root (10 min)

Wrap entire app with provider for global onboarding state:

```typescript
// src/App.tsx
import { OnboardingProvider } from "./context/OnboardingProvider";

export function App() {
  return (
    <OnboardingProvider autoRouteOnboardingUsers={true}>
      {/* Existing app structure */}
      <AppRoutes />
    </OnboardingProvider>
  );
}
```

This does 2 things:

1. Provides `useOnboardingContext()` to any component
2. Auto-redirects incomplete users to /onboarding (if they try to go to /app/staff)

### Step 6: Add Progress Bar Component (20 min)

Show user their progress through 9 steps:

```typescript
export function OnboardingProgress() {
  const { progressPercent, currentStep } = useOnboarding();

  const steps = [
    "Welcome",
    "Restaurant",
    "Legal",
    "Menu",
    "Staff",
    "Payment",
    "Devices",
    "Verify",
    "Complete",
  ];

  const currentIndex = steps.findIndex(
    (s) => s.toLowerCase() === currentStep?.toLowerCase(),
  );

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="progress-text">
        Passo {currentIndex + 1} de {steps.length}
      </p>
    </div>
  );
}
```

### Step 7: Add Error Handling (20 min)

Show friendly errors if RPC calls fail:

```typescript
// In each screen component
const handleSaveData = async () => {
  try {
    await completeStep("restaurant_setup", formData);
    navigate("/onboarding/legal");
  } catch (error) {
    setError("Falha ao salvar dados. Tente novamente.");
    console.error(error);
  }
};

if (error) {
  return (
    <div className="error-banner">
      <p>{error}</p>
      <button onClick={() => setError(null)}>Descartar</button>
    </div>
  );
}
```

### Step 8: Add Data Persistence (15 min)

Cache form data locally so user doesn't lose progress if page closes:

```typescript
const [restaurantData, setRestaurantData] = useState(() => {
  const saved = localStorage.getItem("onboarding_form_cache");
  return saved ? JSON.parse(saved) : {};
});

useEffect(() => {
  localStorage.setItem("onboarding_form_cache", JSON.stringify(restaurantData));
}, [restaurantData]);

const handleCompleteScreen = async () => {
  try {
    await completeStep("restaurant_setup", restaurantData);
    // Clear cache after successful save
    localStorage.removeItem("onboarding_form_cache");
  } catch (error) {
    // Keep cache if save fails
  }
};
```

### Step 9: Final Screen - Auto Redirect (10 min)

When user completes all 9 screens:

```typescript
export function OnboardingStep9Complete() {
  const navigate = useNavigate();
  const { completeStep, state } = useOnboarding();

  useEffect(() => {
    const finish = async () => {
      try {
        // Mark as complete in backend
        await completeStep("complete", {
          completed_at: new Date().toISOString(),
        });

        // Wait 2 seconds for user to see success message
        setTimeout(() => {
          // Redirect to dashboard
          navigate("/app/staff/home", { replace: true });
        }, 2000);
      } catch (error) {
        console.error("Failed to complete onboarding:", error);
      }
    };

    finish();
  }, []);

  return (
    <div className="completion-screen">
      <h1>🎉 Parabéns!</h1>
      <p>Seu restaurante está configurado e pronto para usar.</p>
      <p>Redirecionando para o painel...</p>
    </div>
  );
}
```

## Testing Checklist

After integration, verify:

- [ ] **New User Signup**

  - [ ] User signs up / logs in
  - [ ] Redirected to /welcome
  - [ ] Clicks "Começar Configuração Guiada"

- [ ] **Onboarding Start**

  - [ ] initializeOnboarding() called successfully
  - [ ] Redirects to /onboarding
  - [ ] First screen displays (Step 1: Welcome)

- [ ] **Screen Progression**

  - [ ] Each screen saves data and moves to next
  - [ ] completeStep() updates backend state
  - [ ] currentStep in hook updates correctly
  - [ ] Progress bar shows correct percent

- [ ] **Data Persistence**

  - [ ] If user closes browser, data is saved
  - [ ] User can return and continue from last step
  - [ ] Database shows steps_completed JSONB updated

- [ ] **Completion**

  - [ ] Final screen (Step 9) marks as complete
  - [ ] Trigger fires: restaurant.onboarding_completed_at set
  - [ ] Trigger fires: restaurant.status = 'active'
  - [ ] Redirects to /app/staff/home

- [ ] **Security**
  - [ ] User A cannot see User B's onboarding
  - [ ] RLS policies block cross-tenant access
  - [ ] API returns 401 if not authenticated

## Database Inspection Commands

Monitor backend state as you test:

```bash
# Check current onboarding state for user
PGPASSWORD=postgres psql -h localhost -p 54320 -U postgres -d chefiapp_core -c "
  SELECT user_id, current_step, progress_percent, is_complete
  FROM get_onboarding_state();
"

# See steps completed by user
PGPASSWORD=postgres psql -h localhost -p 54320 -U postgres -d chefiapp_core -c "
  SELECT user_id, current_step, steps_completed, completed_at
  FROM gm_onboarding_state
  ORDER BY started_at DESC LIMIT 5;
"

# Check if restaurant was marked as active
PGPASSWORD=postgres psql -h localhost -p 54320 -U postgres -d chefiapp_core -c "
  SELECT id, name, status, onboarding_completed_at
  FROM gm_restaurants
  ORDER BY created_at DESC LIMIT 5;
"
```

## Common Issues & Fixes

**Issue 1**: `useOnboarding()` returns `state === null`

- **Cause**: User doesn't have active onboarding
- **Fix**: Call `initializeOnboarding()` first
- **Check**: `getOnboardingState()` RPC fails silently if no data

**Issue 2**: `completeStep()` throws error

- **Cause**: Invalid step name (must match enum in database)
- **Fix**: Use exact step names: 'welcome', 'restaurant_setup', etc.
- **Check**: Database migration enum definition

**Issue 3**: Progress bar stuck at 0%

- **Cause**: `steps_completed` JSONB not being populated
- **Fix**: Verify `updateOnboardingStep()` is being called
- **Check**: Call `refreshState()` after `completeStep()`

**Issue 4**: Redirected to /onboarding even after completion

- **Cause**: OnboardingProvider caching stale state
- **Fix**: Call `refreshState()` after completing final step
- **Check**: `is_complete` flag in state object

## Performance Notes

- Each screen load: ~50-100ms (RPC call to database, indexed lookups)
- Form submission: ~100-200ms (write to JSONB, trigger execution)
- Final redirect: ~2s (intentional delay to show success message)

No N+1 queries. Single RPC call per action.

## Migration from Old System

If there's existing onboarding data:

1. Migrate to `gm_onboarding_state` table
2. Map old screen names to new enum values
3. Backfill `steps_completed` JSONB
4. Set `completed_at` for finished users

**Script TBD** if needed.

## Estimated Timeline

| Task                                            | Time        | Owner    |
| ----------------------------------------------- | ----------- | -------- |
| Step 1-2: Update existing pages                 | 30 min      | Frontend |
| Step 3: Create 7 new screen components          | 60 min      | Frontend |
| Step 4: Update routing                          | 15 min      | Frontend |
| Step 5: Add provider to root                    | 10 min      | Frontend |
| Step 6-9: Progress, error handling, persistence | 65 min      | Frontend |
| Testing & bug fixes                             | 30 min      | QA       |
| **Total**                                       | **3 hours** | -        |

## Success Criteria

✅ New user completes all 9 screens without errors
✅ Data persisted to backend (visible in database)
✅ Restaurant auto-marked as active on completion
✅ User auto-redirected to /app/staff/home
✅ Returning user is NOT shown onboarding again
✅ RLS policies prevent data leakage between users

---

**Status**: Ready for frontend development
**Backend**: 100% complete and tested
**Next Action**: Implement screens 1-9 as described above
