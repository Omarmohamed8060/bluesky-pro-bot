"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  LucideHome, 
  LucideUsers, 
  LucideMail, 
  LucideTarget, 
  LucideTerminal, 
  LucideSettings,
  LucideGlobe,
  LucideActivity,
  LucideDatabase,
  LucideMessageSquare,
  LucideBarChart3
} from "lucide-react";
import clsx from "clsx";
import { getStats, type Stats } from "@/lib/api";

const nav = [
  { href: "/", label: "Dashboard", icon: LucideHome },
  { href: "/accounts", label: "Account Manager", icon: LucideUsers },
  { href: "/campaigns", label: "Campaign Builder", icon: LucideMessageSquare },
  { href: "/targets", label: "Target Lists", icon: LucideTarget },
  { href: "/logs", label: "System Logs", icon: LucideTerminal },
  { href: "/settings", label: "Settings", icon: LucideSettings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const data = await getStats();
        if (mounted) {
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to load sidebar stats:', error);
        if (mounted) {
          setStats(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatNumber = (value: number) => value.toLocaleString();
  const activeAccounts = stats?.activeAccounts ?? 0;
  const activeCampaigns = stats?.activeCampaigns ?? 0;

  return (
    <aside className="w-full h-full p-6 bg-card border-r border-border">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.6em] text-muted-foreground">Bluesky</p>
        <h1 className="mt-2 text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Pro Bot</h1>
      </div>

      <nav className="space-y-2">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link href={href as any} key={href}>
            <motion.div
              whileHover={{ x: 6 }}
              className={clsx(
                "group flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium",
                "bg-card transition-all duration-200 hover:bg-accent hover:border-primary"
              )}
            >
              <Icon 
                size={18} 
                className="text-muted-foreground group-hover:text-primary transition-colors duration-200" 
              />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">{label}</span>
            </motion.div>
          </Link>
        ))}
      </nav>

      <div className="mt-8 pt-8 border-t border-border">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">API Status</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-green-400">Online</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active Accounts</span>
            <span className="text-primary font-mono">
              {isLoading ? '—' : formatNumber(activeAccounts)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active Campaigns</span>
            <span className="text-primary font-mono">
              {isLoading ? '—' : formatNumber(activeCampaigns)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-card border border-primary/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <LucideActivity size={16} className="text-primary" />
          <span className="text-xs font-medium text-primary">Live Activity</span>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-green-400 font-mono">+127 DMs sent</div>
          <div className="text-xs text-muted-foreground">Last 5 min</div>
        </div>
      </div>
    </aside>
  );
}
