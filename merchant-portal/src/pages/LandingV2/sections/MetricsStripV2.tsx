/**
 * MetricsStripV2 — "O sistema em números"
 *
 * Horizontal stats bar with animated counters.
 * Numbers count up when scrolled into view via useCountUp.
 * Ambient glow + gradient divider for premium feel.
 */
import { useCountUp } from "../hooks/useFadeIn";

/** Animated number cell */
const AnimatedMetric = ({
  target,
  suffix,
  prefix,
  label,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
}) => {
  const { ref, value } = useCountUp(target, 1600);
  return (
    <div ref={ref} className="text-center group">
      <div className="text-2xl md:text-4xl font-black text-white mb-1 tabular-nums">
        {prefix}
        {value}
        {suffix}
      </div>
      <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium group-hover:text-amber-500/70 transition-colors duration-300">
        {label}
      </div>
    </div>
  );
};

/** Static text metric (no counter animation) */
const StaticMetric = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center group">
    <div className="text-2xl md:text-4xl font-black text-white mb-1">
      {value}
    </div>
    <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium group-hover:text-amber-500/70 transition-colors duration-300">
      {label}
    </div>
  </div>
);

export const MetricsStripV2 = () => {
  return (
    <section className="relative py-14 bg-[#0a0a0a] overflow-hidden">
      {/* Gradient borders top/bottom */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-amber-500/3 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4">
          <StaticMetric value="< 25 min" label="Setup completo" />
          <AnimatedMetric target={9} label="Componentes integrados" />
          <StaticMetric value="0 €" label="Custo de hardware" />
          <AnimatedMetric target={79} suffix=" €" label="Tudo incluído" />
          <StaticMetric value="24/7" label="Sistema operacional" />
        </div>
      </div>
    </section>
  );
};
