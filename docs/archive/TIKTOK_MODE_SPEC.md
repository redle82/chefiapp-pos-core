# 🎬 TIKTOK MODE: Cinematic Onboarding Spec

## 🎯 Vision
**"Onboarding is not a wizard. It's a narrative."**
Shift from rational form-filling to emotional storytelling. Mobile-first, swipe-driven, instant gratification.

## 📱 The "Cinema" Container
- **Layout:** Full screen, no header/footer navigation chrome.
- **Vibe:** Dark mode default, vibrant accents (Gold/Yellow), immersive.
- **Navigation:** Swipe gestures (where possible) or large, thumb-friendly "Next" buttons at the bottom.
- **Feedback:** Every tap triggers a visual/haptic response.

## 🎞️ The 5-Scene Screenplay

### Scene 1: "The Hook" (Imagina isto)
- **Visual:** A looping 5-7s video/animation background showing a busy, successful kitchen/order flow.
- **Audio:** Subtle ambient kitchen sounds (optional/muted by default) or a crisp "ping" of a new order.
- **Copy:** 
  - Headline: "Isto podia estar a acontecer no teu restaurante agora."
  - Sub: "Sem configurações complexas. Sem cartões de crédito."
- **Action:** 
  - Button: "Começar 👉" (Pulsing interaction)

### Scene 2: "The Identity" (Quem és tu?)
- **Input:** Single, massive input field. Center stage.
- **Prompt:** "Como se chama este sítio?"
- **Interaction:**
  - Typing "S" -> Preview updates instantly.
  - Typing "So" -> Logo placeholder generates initials.
  - Typing "Sofia's" -> "Sofia's" glows on the preview card.
- **Transition:** Button "Continuar" appears *only* after valid input.

### Scene 3: "The First Plate" (Primeira Vitória)
- **Concept:** Gamified item creation. Not a "form".
- **Inputs:**
  - Name: "O teu prato estrela ⭐" (ex: Hambúrguer da Casa)
  - Price: "Quanto vale?" (ex: 12.50)
- **Reward:**
  - Upon completion: "✨ Prato Adicionado!" (Confetti/Sparkles).
  - The Menu Preview slides in, showing the item.

### Scene 4: "The Vibe" (Escolhe o Estilo)
- **UI:** Horizontal Swipe Cards (Tinder/Instagram style) or big tap targets.
- **Options:**
  - **Minimal:** Clean, white/black, sharp type.
  - **Dark:** Premium, moody, gold accents.
  - **Light:** Fresh, airy, playful.
- **Interaction:** Tapping an option instantly flips the Preview to that theme.
- **Copy:** "Qual é a tua vibe?"

### Scene 5: "The Reveal" (Publicar)
- **State:** *Before* Payment.
- **Copy:** "O teu menu já pode ser visto."
- **Visual:** The "Public Link" card is generated. A QR Code appears.
- **Action:**
  - Button: "Publicar Agora 🚀"
- **Twist:** 
  - Tapping "Publicar" acts as the commit.
  - *Then* (and only then) do we nudge: "Psst, para receberes pagamentos reais, liga o Stripe. Mas podes vender *já* com dinheiro/MBway físico."

## 🛠️ Technical Implementation
- **Route:** `/start/cinematic` (or replace `/start/*`)
- **State:** `useOnboardingState` (existing) but persisted locally until "Publish".
- **Components:**
  - `CinemaLayout`: Wrapper with AnimatePresence.
  - `InputGiant`: Customized input with massive font.
  - `PreviewGlass`: A glassmorphism card floating over the background, reflecting changes real-time.

## 🚀 Success Metric
User thinks: *"Wow, I just built an app in 45 seconds."*
(Reality: They configured a SQL database, DNS slug, and product catalog).
