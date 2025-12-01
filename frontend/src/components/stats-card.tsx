"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

type StatsCardProps = {
  title: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  accent?: string;
};

export function StatsCard({
  title,
  value,
  delta,
  trend = "up",
  accent = "from-indigo-500 to-purple-500",
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={clsx(
        "relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm"
      )}
    >
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 opacity-20 blur-3xl bg-gradient-to-br",
          accent
        )}
        aria-hidden
      />
      <div className="relative">
        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{title}</div>
        <div className="mt-3 text-3xl font-semibold text-foreground">{value}</div>
        {delta && (
          <div
            className={clsx(
              "mt-2 text-sm font-medium",
              trend === "up" ? "text-green-400" : "text-red-400"
            )}
          >
            {trend === "up" ? "▲" : "▼"} {delta}
          </div>
        )}
      </div>
    </motion.div>
  );
}
