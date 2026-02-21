/**
 * MetricsStripV2 — "O sistema em números"
 * Copy via useLandingLocale + getMetricsStrip (i18n/landingV2Copy).
 * Animated counters via useCountUp when scrolled into view.
 */
import { getMetricsStrip } from "../i18n/landingV2Copy";
import { useLandingLocale } from "../i18n/LandingLocaleContext";
import { useCountUp } from "../hooks/useFadeIn";

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
  const { locale } = useLandingLocale();
  const { metrics } = getMetricsStrip(locale);

  return (
    <section className="relative py-14 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-amber-500/3 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4">
          {metrics.map((m, i) =>
            m.type === "static" ? (
              <StaticMetric key={i} value={m.value} label={m.label} />
            ) : (
              <AnimatedMetric
                key={i}
                target={m.target}
                suffix={m.suffix}
                prefix={m.prefix}
                label={m.label}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
};
