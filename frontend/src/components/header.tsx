"use client";

import { motion } from "framer-motion";
import { LucideBell, LucideSearch } from "lucide-react";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl shadow-glass"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Overview</p>
        <h2 className="mt-2 text-2xl font-semibold">Automation Control Center</h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-2xl bg-white/10 p-2 text-slate-200 transition hover:bg-white/20">
          <LucideSearch size={18} />
        </button>
        <button className="relative rounded-2xl bg-white/10 p-2 text-slate-200 transition hover:bg-white/20">
          <LucideBell size={18} />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400"></span>
        </button>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-50">
          Operator
        </div>
      </div>
    </motion.header>
  );
}
