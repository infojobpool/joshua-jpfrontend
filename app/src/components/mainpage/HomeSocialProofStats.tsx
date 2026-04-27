"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Stat = {
  value: string;
  label: string;
  valueClass: string;
  cardClass: string;
  suffix?: ReactNode;
};

const STATS: Stat[] = [
  { value: "5k+", label: "Users", valueClass: "text-blue-600", cardClass: "from-blue-50/90 to-white" },
  {
    value: "4.9",
    label: "Rating",
    valueClass: "text-emerald-600 inline-flex items-center gap-0.5",
    suffix: <Star className="h-3 w-3 fill-emerald-500 text-emerald-500 sm:h-3.5 sm:w-3.5" aria-hidden />,
    cardClass: "from-emerald-50/80 to-white",
  },
  { value: "₹500k+", label: "Earned", valueClass: "text-violet-600", cardClass: "from-violet-50/80 to-white" },
];

type Props = {
  className?: string;
  /** When false, render a plain wrapper (e.g. inside an already-animated parent). */
  animated?: boolean;
};

export function HomeSocialProofStats({ className, animated = true }: Props) {
  const inner = (
    <div className="mx-auto flex max-w-md flex-wrap justify-center gap-2.5 sm:max-w-xl sm:gap-3">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "min-w-[5.5rem] flex-1 rounded-xl border border-slate-200/70 bg-gradient-to-b px-3 py-2.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:min-w-[6.5rem] sm:px-4 sm:py-3",
            stat.cardClass,
          )}
        >
          <div className={cn("text-base font-bold tabular-nums tracking-tight sm:text-lg", stat.valueClass)}>
            {stat.value}
            {stat.suffix ?? null}
          </div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );

  if (!animated) {
    return <div className={cn(className)}>{inner}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, margin: "-40px" }}
    >
      {inner}
    </motion.div>
  );
}
