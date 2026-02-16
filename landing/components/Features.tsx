"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/useTranslation";

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.1 },
  }),
};

export function Features() {
  const { t } = useTranslation();
  const items = [
    { titleKey: "feature_1_title", descKey: "feature_1_desc" },
    { titleKey: "feature_2_title", descKey: "feature_2_desc" },
    { titleKey: "feature_3_title", descKey: "feature_3_desc" },
  ];
  return (
    <section
      id="features"
      className="py-20 md:py-24 px-6 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="text-2xl md:text-4xl font-bold tracking-tight mb-4 text-center"
        >
          {t("features_title")}{" "}
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            {t("features_title_accent")}
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-neutral-400 text-center max-w-2xl mx-auto mb-12"
        >
          {t("features_subtitle")}
        </motion.p>
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={item.titleKey}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
              variants={cardVariants}
              className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 shadow-lg hover:border-amber-500/20 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {t(item.titleKey)}
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                {t(item.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
