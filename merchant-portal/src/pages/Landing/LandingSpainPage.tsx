/**
 * LandingSpainPage — Localized landing for seasonal/tourist restaurants in Spain.
 *
 * Target: Ibiza, Mallorca, Barcelona, Valencia, Marbella.
 * Language: Spanish only. 8 sections, conversion-focused.
 * Route: /es (or /spain)
 *
 * Design tokens: bg-[#0b0b0f], glassmorphism, amber-500, Tailwind only, lucide-react icons.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock,
  Globe,
  Monitor,
  ChefHat,
  Users,
  CalendarDays,
  Smartphone,
  Shield,
  Zap,
  ChevronDown,
  MapPin,
  LayoutDashboard,
  UtensilsCrossed,
  BookOpen,
  Mail,
} from "lucide-react";
import {
  PRICE_ESSENCIAL,
  PRICE_PROFISSIONAL,
} from "../../core/pricing/canonicalPrice";

/* ────────────────────────────────────────────────────────────────────────────
 * DATA
 * ──────────────────────────────────────────────────────────────────────── */

const PAIN_CARDS = [
  {
    icon: Users,
    title: "Personal rotativo cada temporada",
    desc: "Nuevos camareros cada mayo. Necesitas un sistema que cualquiera entienda en minutos, no en semanas.",
  },
  {
    icon: Monitor,
    title: "Sistemas antiguos que no hablan entre sí",
    desc: "TPV por un lado, reservas por otro, cocina en papel. Tres proveedores, cero visibilidad.",
  },
  {
    icon: Zap,
    title: "Pérdida de ingresos invisible",
    desc: "Pedidos que se pierden, tiempos muertos en cocina, cierres de caja que no cuadran.",
  },
  {
    icon: Clock,
    title: "Setup que tarda semanas",
    desc: "La temporada empieza en 10 días y tu sistema aún no está listo. No puedes permitírtelo.",
  },
];

const MODULES = [
  {
    icon: Monitor,
    name: "TPV",
    desc: "Mesa, barra, takeaway. Pedidos rápidos con interfaz táctil optimizada.",
  },
  {
    icon: ChefHat,
    name: "KDS",
    desc: "Pantalla de cocina en tiempo real. Sin papeles, sin gritos, sin errores.",
  },
  {
    icon: CalendarDays,
    name: "Reservas",
    desc: "Sistema integrado, sin intermediarios. Gestión de capacidad automática.",
  },
  {
    icon: Smartphone,
    name: "AppStaff",
    desc: "App del equipo con clock-in por QR. Horarios, turnos y comunicación.",
  },
  {
    icon: UtensilsCrossed,
    name: "Menú digital",
    desc: "Configura tu carta en minutos. Multi-idioma para turistas internacionales.",
  },
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    desc: "Métricas del día en tiempo real. Facturación, pedidos, mesas activas.",
  },
];

const ONBOARDING_STEPS = [
  { step: 1, title: "Crea tu cuenta", time: "5 min", desc: "Email y datos básicos del restaurante." },
  { step: 2, title: "Configura tu restaurante", time: "30 min", desc: "Mesas, zonas, métodos de pago, impuestos." },
  { step: 3, title: "Sube tu carta", time: "15 min", desc: "Platos, categorías, precios, alérgenos." },
  { step: 4, title: "Activa el TPV", time: "10 min", desc: "Primer pedido real. Listo para operar." },
];

const FAQ_ITEMS = [
  {
    q: "¿Puedo activarlo antes de la temporada y tenerlo listo para el día 1?",
    a: "Sí. Puedes configurar todo con antelación: carta, mesas, equipo, pagos. El día que abres, solo enciendes el sistema. Muchos restaurantes configuran ChefiApp semanas antes de la apertura.",
  },
  {
    q: "¿Funciona con personal nuevo cada año?",
    a: "ChefiApp está diseñado para equipos rotativos. La interfaz es intuitiva y no requiere formación. Un camarero nuevo puede tomar pedidos en 10 minutos. Además, AppStaff permite gestionar altas y bajas del equipo al instante.",
  },
  {
    q: "¿Qué pasa si no tengo internet estable?",
    a: "ChefiApp funciona como PWA con modo offline. Los pedidos se registran localmente y se sincronizan cuando vuelve la conexión. Nunca pierdes un pedido.",
  },
  {
    q: "¿Puedo cancelar después de la temporada?",
    a: "Sin compromiso de permanencia. Puedes pausar o cancelar tu suscripción en cualquier momento. Tus datos se mantienen para la siguiente temporada.",
  },
  {
    q: "¿Necesito hardware especial?",
    a: "No. ChefiApp funciona en cualquier tablet, portátil o móvil con navegador. iPad, Android, Chromebook — todo vale. Si quieres una pantalla de cocina dedicada, cualquier televisor con navegador sirve.",
  },
];

const ESSENTIAL_FEATURES = [
  "TPV completo (mesa + barra + takeaway)",
  "1 pantalla KDS",
  "Dashboard del propietario",
  "Gestión de carta y categorías",
  "Cierre de caja auditable",
  "Multi-método de pago",
  "Funciona offline (PWA)",
  "1 idioma",
];

const PRO_FEATURES = [
  "Todo del Esencial +",
  "KDS ilimitados (cocina, bar, expo)",
  "AppStaff completo (6 dashboards)",
  "Reservas integradas",
  "Pedidos online y QR",
  "Inventario avanzado",
  "Alertas operacionales",
  "Multi-idioma (ES/EN/PT/FR)",
  "Compliance fiscal ES",
  "Gamificación equipo (XP, badges)",
  "Loyalty / fidelización",
  "Hasta 2 localizaciones",
];

/* ────────────────────────────────────────────────────────────────────────────
 * FAQ ACCORDION ITEM
 * ──────────────────────────────────────────────────────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-base font-medium text-white pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-neutral-500 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-neutral-400 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * PAGE COMPONENT
 * ──────────────────────────────────────────────────────────────────────── */

export function LandingSpainPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title =
      "ChefiApp — El sistema operativo para restaurantes que abren rápido";

    // SEO meta tags
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta(
      "description",
      "ChefiApp: TPV, cocina, reservas y equipo en un solo sistema. Configura tu restaurante en menos de 1 hora. Ideal para temporada en Ibiza, Mallorca, Barcelona, Valencia y Marbella."
    );
    setMeta(
      "keywords",
      "TPV restaurante España, sistema restaurante Ibiza, POS Mallorca, software hostelería, gestión restaurante temporada"
    );

    // Set lang
    document.documentElement.lang = "es";

    return () => {
      document.documentElement.lang = "pt";
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white antialiased">
      {/* ================================================================
       * 0. STICKY NAVBAR
       * ============================================================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 group"
          >
            <img
              src="/logo-chefiapp-clean.png"
              alt="ChefiApp"
              className="w-8 h-8 rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.25)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-shadow duration-300"
            />
            <span className="text-sm font-bold text-white">
              ChefiApp
              <span className="font-normal text-neutral-500 ml-0.5">
                &trade; OS
              </span>
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Funcionalidades", href: "#funcionalidades" },
              { label: "Precios", href: "#precios" },
              { label: "FAQ", href: "#faq" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-400 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-px after:bg-amber-500 hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + mobile hamburger */}
          <div className="flex items-center gap-3">
            <Link
              to="/auth/email"
              className="hidden sm:inline-flex px-5 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
            >
              Probar gratis
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0b0b0f]/95 backdrop-blur-xl">
            <div className="px-5 py-4 space-y-1">
              {[
                { label: "Funcionalidades", href: "#funcionalidades" },
                { label: "Precios", href: "#precios" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-sm text-neutral-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/auth/email"
                onClick={() => setMobileMenuOpen(false)}
                className="block mt-2 py-3 text-center text-sm font-semibold rounded-lg bg-amber-500 text-black"
              >
                Probar gratis
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ================================================================
       * 1. HERO
       * ============================================================= */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px]" />
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 py-20 md:py-32 w-full">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-amber-500 tracking-wide uppercase">
                En produccion &middot; Ibiza
              </span>
            </div>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6">
              El sistema operativo para restaurantes que abren rapido{" "}
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                y operan sin caos.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-neutral-400 leading-relaxed mb-8 max-w-2xl mx-auto">
              Configura tu restaurante en dias, no en semanas. TPV, cocina,
              reservas, equipo &mdash; todo en un sistema.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/auth/email"
                className="group inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
              >
                Empieza tu configuracion
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#funcionalidades"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all"
              >
                Ver funcionalidades
              </a>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                Usado en Sofia Gastrobar, Ibiza
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                Sin tarjeta de credito
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                14 dias gratis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
       * 2. PROBLEM — El caos de la temporada
       * ============================================================= */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-3">
              El problema
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              El caos de la temporada
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Cada temporada, los mismos problemas. Diferentes herramientas que
              no se integran, equipo nuevo que no sabe usar el sistema, y
              semanas perdidas en configuracion.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PAIN_CARDS.map((card) => (
              <div
                key={card.title}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 hover:border-amber-500/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <card.icon className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
       * 3. SOLUTION — Un sistema que centraliza todo
       * ============================================================= */}
      <section id="funcionalidades" className="relative py-20 md:py-28">
        {/* Subtle divider glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-3">
              La solucion
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Un sistema que centraliza todo
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              ChefiApp conecta cada superficie de tu restaurante: punto de
              venta, cocina, reservas, equipo y metricas. Un solo sistema, cero
              fricciones.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((mod) => (
              <div
                key={mod.name}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 hover:border-amber-500/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 transition-colors">
                  <mod.icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">
                  {mod.name}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
       * 4. ONBOARDING — Configura tu restaurante en dias
       * ============================================================= */}
      <section className="relative py-20 md:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-3">
              Configuracion
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Operativo en menos de 1 hora
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              No necesitas un tecnico. No necesitas una semana. Configura tu
              restaurante paso a paso y empieza a operar el mismo dia.
            </p>
          </div>

          {/* Timeline */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-3 bottom-3 w-px bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent" />

              <div className="space-y-8">
                {ONBOARDING_STEPS.map((s, i) => (
                  <div key={s.step} className="relative flex gap-5">
                    {/* Step circle */}
                    <div className="relative z-10 w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-amber-500">
                        {s.step}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="pt-2 pb-2">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-white">
                          {s.title}
                        </h3>
                        <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          {s.time}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total time */}
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-400">
                  Tiempo total: ~60 minutos
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
       * 5. SOCIAL PROOF — Ya funciona en Ibiza
       * ============================================================= */}
      <section className="relative py-20 md:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-3">
              En produccion
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ya funciona en Ibiza
            </h2>
          </div>

          {/* Quote card */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 md:p-10">
              {/* Quote mark */}
              <div className="absolute -top-4 left-8 text-6xl font-serif text-amber-500/20 leading-none select-none">
                &ldquo;
              </div>
              <blockquote className="text-lg text-neutral-300 leading-relaxed mb-6 italic">
                ChefiApp nos permitio abrir la temporada sin el caos habitual.
                El personal nuevo entiende el sistema en minutos. Todo
                centralizado, todo visible.
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Sofia Gastrobar
                  </p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Ibiza, Espana
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-5 max-w-xl mx-auto">
            {[
              { value: "1", label: "restaurante en produccion" },
              { value: "5+", label: "superficies operativas" },
              { value: "3", label: "idiomas soportados" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-500 mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
       * 6. PRICING — Simple y transparente
       * ============================================================= */}
      <section id="precios" className="relative py-20 md:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-3">
              Precios
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Simple y transparente
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Sin comisiones por transaccion. Sin sorpresas. 14 dias gratis en
              todos los planes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Esencial */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-7">
              <h3 className="text-lg font-bold text-white mb-1">Esencial</h3>
              <p className="text-sm text-neutral-500 mb-5">
                Para restaurantes que empiezan
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">
                  {PRICE_ESSENCIAL}&euro;
                </span>
                <span className="text-sm text-neutral-500">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {ESSENTIAL_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-neutral-300"
                  >
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth/email"
                className="block w-full py-3 text-center text-sm font-semibold rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all"
              >
                Empezar gratis
              </Link>
            </div>

            {/* Profesional */}
            <div className="relative rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] backdrop-blur-sm p-7">
              {/* Popular badge */}
              <div className="absolute -top-3 right-6">
                <span className="text-xs font-semibold uppercase tracking-wide bg-amber-500 text-black px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Profesional
              </h3>
              <p className="text-sm text-neutral-500 mb-5">
                Control total del restaurante
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">
                  {PRICE_PROFISSIONAL}&euro;
                </span>
                <span className="text-sm text-neutral-500">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-neutral-300"
                  >
                    <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth/email"
                className="block w-full py-3 text-center text-sm font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
              >
                Empezar gratis
              </Link>
            </div>
          </div>

          {/* No commission note */}
          <p className="text-center text-sm text-neutral-500 mt-8">
            <Shield className="w-4 h-4 inline-block mr-1.5 text-emerald-500 align-text-bottom" />
            Sin comisiones por transaccion &middot; Cancela cuando quieras
            &middot; Datos exportables
          </p>
        </div>
      </section>

      {/* ================================================================
       * 7. FAQ
       * ============================================================= */}
      <section id="faq" className="relative py-20 md:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Preguntas frecuentes
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
       * 8. FINAL CTA
       * ============================================================= */}
      <section className="relative py-20 md:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
            La temporada no espera.{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Tu restaurante tampoco.
            </span>
          </h2>
          <p className="text-lg text-neutral-400 mb-8 max-w-xl mx-auto">
            Configura ChefiApp hoy y empieza la temporada con todo bajo
            control. Sin compromiso, sin tarjeta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/auth/email"
              className="group inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
            >
              Empieza ahora
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <a
            href="mailto:contacto@chefiapp.com"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-amber-500 transition-colors"
          >
            <Mail className="w-4 h-4" />
            contacto@chefiapp.com
          </a>
        </div>
      </section>

      {/* ================================================================
       * FOOTER
       * ============================================================= */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo-chefiapp-clean.png"
              alt="ChefiApp"
              className="w-6 h-6 rounded-md"
            />
            <span className="text-xs text-neutral-500">
              ChefiApp&trade; OS &middot; Sistema Operativo del Restaurante
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Ibiza &middot; Mallorca &middot; Barcelona &middot; Valencia
              &middot; Marbella
            </span>
          </div>
          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} ChefiApp. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
