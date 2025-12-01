"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  LucideTerminal,
  LucideTrash2,
  LucideDownload,
  LucideRefreshCw,
  LucideActivity,
  LucideAlertTriangle,
  LucideCheckCircle,
  LucideXCircle,
  LucideInfo,
  LucideLoader2
} from "lucide-react";
import { getLogs } from "@/lib/api";

interface LogEntry {
  id: string;
  createdAt: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  metadata?: Record<string, unknown> | null;
  campaignId?: string;
  accountId?: string;
  targetId?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await getLogs();
      const entries = Array.isArray(data) ? data : [];
      setLogs(entries as LogEntry[]);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setIsConnected(false);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return <LucideCheckCircle size={14} className="text-green-400" />;
      case 'ERROR':
        return <LucideXCircle size={14} className="text-red-400" />;
      case 'WARN':
        return <LucideAlertTriangle size={14} className="text-yellow-400" />;
      case 'INFO':
      default:
        return <LucideInfo size={14} className="text-blue-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return "text-green-400";
      case 'ERROR':
        return "text-red-400";
      case 'WARN':
        return "text-yellow-400";
      case 'INFO':
      default:
        return "text-blue-400";
    }
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleClearLogs = () => {
    if (confirm("Are you sure you want to clear all logs?")) {
      // Note: This would need a DELETE endpoint on the backend
      setLogs([]);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Timestamp', 'Level', 'Context', 'Message', 'Metadata'],
      ...logs.map(log => [
        log.createdAt,
        log.level,
        log.campaignId || log.accountId || log.targetId || 'system',
        log.message,
        log.metadata ? JSON.stringify(log.metadata) : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: logs.length,
    info: logs.filter(l => (l.level || 'INFO') === 'INFO').length,
    success: logs.filter(l => (l.level || '').toUpperCase() === 'SUCCESS').length,
    warn: logs.filter(l => (l.level || '').toUpperCase() === 'WARN').length,
    error: logs.filter(l => (l.level || '').toUpperCase() === 'ERROR').length
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Logs</h1>
          <p className="text-muted-foreground mt-2">Real-time system monitoring and debugging</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              autoScroll 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-card border-border hover:bg-accent text-foreground'
            }`}
          >
            <LucideActivity size={16} />
            <span className="text-sm">Auto Scroll</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-accent transition-colors disabled:opacity-50"
          >
            <LucideRefreshCw size={16} className={`text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm text-foreground">{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-accent transition-colors disabled:opacity-50"
          >
            <LucideDownload size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">Export CSV</span>
          </button>
          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-accent transition-colors disabled:opacity-50"
          >
            <LucideTrash2 size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <LucideInfo size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Info</p>
              <p className="text-2xl font-bold text-foreground">{stats.info}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <LucideCheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success</p>
              <p className="text-2xl font-bold text-foreground">{stats.success}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <LucideAlertTriangle size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-2xl font-bold text-foreground">{stats.warn}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <LucideXCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold text-foreground">{stats.error}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <LucideTerminal size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black border border-green-500/30 rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 bg-black/80 border-b border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2">
              <LucideTerminal size={16} className="text-green-400" />
              <span className="text-green-400 font-mono text-sm">bluesky-pro-bot:~$</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-xs ${
              isConnected ? 'text-green-400' : 'text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${isLoading ? 'animate-pulse' : ''}`}></div>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
            <span className="text-green-400 font-mono text-xs">
              {logs.length} entries
            </span>
          </div>
        </div>

        <div 
          ref={terminalRef}
          className="h-96 overflow-y-auto p-4 font-mono text-sm bg-black/90"
          style={{ scrollBehavior: 'smooth' }}
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-green-400/50">
              <div className="text-center">
                <LucideTerminal size={48} className="mx-auto mb-4" />
                <p>No log entries available</p>
                <p className="text-xs mt-2">Waiting for system events...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-green-400">
                  <span className="text-green-400/50 text-xs">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="flex items-center gap-1 min-w-[60px]">
                    {getLevelIcon(log.level || 'INFO')}
                    <span className={`text-xs font-medium ${getLevelColor(log.level || 'INFO')}`}>
                      [{(log.level || 'INFO')}]
                    </span>
                  </span>
                  <span className="text-green-400/70 text-xs min-w-[100px]">
                    {(log.campaignId || log.accountId || 'system')}:
                  </span>
                  <span className="text-green-400 flex-1">
                    {log.message}
                  </span>
                  {log.metadata && (
                    <span className="text-green-400/50 text-xs ml-2">
                      | {JSON.stringify(log.metadata)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="p-3 bg-black/80 border-t border-green-500/30">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-mono text-sm">$</span>
            <span className="text-green-400/50 font-mono text-sm">
              {isLoading ? 'Loading logs...' : isConnected ? 'Monitoring system events...' : 'Connection lost'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
