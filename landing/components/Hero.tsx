"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/useTranslation";

const APP_AUTH_URL = "https://app.chefiapp.com/auth/phone";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-screen flex flex-col pt-24 pb-16 px-6">
      <motion.div
        className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center"
        initial="initial"
        animate="animate"
        variants={{
          initial: {},
          animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
        }}
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 w-fit"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-amber-500 tracking-wide uppercase">
            {t("hero_badge")}
          </span>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6 max-w-3xl"
        >
          {t("hero_title")}{" "}
          <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
            {t("hero_title_accent")}
          </span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-lg md:text-xl text-neutral-400 leading-relaxed mb-8 max-w-2xl"
        >
          {t("hero_subtitle")}
        </motion.p>
        <motion.p
          variants={fadeUp}
          className="text-sm text-neutral-500 mb-8 max-w-2xl"
        >
          {t("hero_subtitle2")}
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <a
            href={`${APP_AUTH_URL}?mode=signup`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/25"
          >
            {t("cta_primary")}
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all"
          >
            {t("cta_secondary")}
          </a>
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500"
        >
          <span className="flex items-center gap-1.5">
            <CheckIcon />
            {t("hero_trust_14")}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckIcon />
            {t("hero_trust_no_card")}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckIcon />
            {t("hero_trust_cancel")}
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-emerald-500 shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
