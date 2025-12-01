"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  LucideTrendingUp, 
  LucideUsers, 
  LucideMail, 
  LucidePercent,
  LucideRefreshCw
} from "lucide-react";
import { getStats, healthCheck, getLogs } from "@/lib/api";
import type { Stats } from "@/lib/api";

interface LogEntry {
  id: string;
  level: string;
  message: string;
  campaignName: string;
  accountUsername: string;
  createdAt: string;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  isLoading 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  gradient: string; 
  isLoading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`}></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
            <div className="mt-2 text-3xl font-bold text-foreground">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
              ) : (
                value
              )}
            </div>
          </div>
          <div className={`ml-4 p-3 rounded-lg bg-gradient-to-br ${gradient} text-white`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SystemStatus() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthCheck();
        setStatus('online');
      } catch {
        setStatus('offline');
      }
    };

    const fetchLogs = async () => {
      try {
        const logsData = await getLogs();
        setLogs(logsData);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        setLogs([]);
      }
    };

    checkHealth();
    fetchLogs();

    const interval = setInterval(() => {
      checkHealth();
      fetchLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card text-card-foreground shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">System Status</h3>
        <div className={`w-3 h-3 rounded-full ${
          status === 'online' ? 'bg-green-500' : 
          status === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
        }`}></div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">API Status</span>
          <span className={status === 'online' ? 'text-green-600' : 'text-red-600'}>
            {status === 'loading' ? 'Checking...' : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Recent Logs</span>
          <span>{logs.length}</span>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Latest Activity</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="text-xs text-muted-foreground">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    log.level === 'ERROR'
                      ? 'bg-red-500'
                      : log.level === 'WARN'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                ></span>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats({
        totalAccounts: data.totalAccounts ?? 0,
        activeAccounts: data.activeAccounts ?? 0,
        activeCampaigns: data.activeCampaigns ?? 0,
        totalSent: data.totalSent ?? 0,
        failedCount: data.failedCount ?? 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const hasStats = !!stats;
  const totalAccounts = stats?.totalAccounts ?? 0;
  const activeAccounts = stats?.activeAccounts ?? 0;
  const activeCampaigns = stats?.activeCampaigns ?? 0;
  const totalSent = stats?.totalSent ?? 0;
  const failedCount = stats?.failedCount ?? 0;
  const successRate = totalSent > 0 ? ((totalSent - failedCount) / totalSent) * 100 : 0;
  const formatNumber = (value: number) => value.toLocaleString();
  const numberOrPlaceholder = (value: number) => (hasStats ? formatNumber(value) : '—');
  const successRateDisplay = hasStats ? `${successRate.toFixed(1)}%` : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your Bluesky automation performance</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <LucideRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Accounts"
          value={numberOrPlaceholder(totalAccounts)}
          icon={LucideUsers}
          gradient="from-blue-500 to-purple-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Accounts"
          value={numberOrPlaceholder(activeAccounts)}
          icon={LucideTrendingUp}
          gradient="from-green-500 to-emerald-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Campaigns"
          value={numberOrPlaceholder(activeCampaigns)}
          icon={LucideTrendingUp}
          gradient="from-teal-500 to-cyan-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Messages Sent"
          value={numberOrPlaceholder(totalSent)}
          icon={LucideMail}
          gradient="from-orange-500 to-red-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Success Rate"
          value={successRateDisplay}
          icon={LucidePercent}
          gradient="from-purple-500 to-pink-600"
          isLoading={isLoading}
        />
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemStatus />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card text-card-foreground shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Accounts', value: numberOrPlaceholder(totalAccounts) },
              { label: 'Active Accounts', value: numberOrPlaceholder(activeAccounts) },
              { label: 'Active Campaigns', value: numberOrPlaceholder(activeCampaigns) },
              { label: 'Messages Sent', value: numberOrPlaceholder(totalSent) },
              { label: 'Failed Deliveries', value: numberOrPlaceholder(failedCount) },
              { label: 'Success Rate', value: successRateDisplay },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
