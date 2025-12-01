"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LucideUsers,
  LucidePlus,
  LucideTrash2,
  LucideRefreshCw,
  LucideCheckCircle,
  LucideXCircle,
  LucideAlertCircle,
  LucideX,
  LucideLoader2
} from "lucide-react";
import { getAccounts, addAccount, deleteAccount, Account } from "@/lib/api";

function AddAccountModal({ 
  isOpen, 
  onClose, 
  onAccountAdded 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAccountAdded: () => void;
}) {
  const [formData, setFormData] = useState({
    username: "",
    appPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await addAccount(formData.username, formData.appPassword);
      setSuccess(true);
      setTimeout(() => {
        onAccountAdded();
        onClose();
        setFormData({ username: "", appPassword: "" });
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to add account");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Add Bluesky Account</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LucideX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bluesky Handle
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="username.bsky.social"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              App Password
            </label>
            <input
              type="password"
              value={formData.appPassword}
              onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Generate an app password in your Bluesky settings
            </p>
          </div>

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/20 rounded-lg">
              <LucideCheckCircle size={16} className="text-green-400" />
              <span className="text-sm text-green-400">Account connected successfully!</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/20 border border-destructive/20 rounded-lg">
              <LucideAlertCircle size={16} className="text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <LucideLoader2 size={16} className="animate-spin" />
                  Connecting...
                </div>
              ) : success ? (
                <div className="flex items-center justify-center gap-2">
                  <LucideCheckCircle size={16} />
                  Connected!
                </div>
              ) : (
                "Add Account"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AccountRow({ 
  account, 
  onDelete, 
  isDeleting 
}: { 
  account: Account; 
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const getStatusIcon = () => {
    if (account.isActive) {
      return <LucideCheckCircle size={16} className="text-green-400" />;
    } else {
      return <LucideXCircle size={16} className="text-red-400" />;
    }
  };

  const getStatusText = () => {
    if (account.isActive) {
      return "Active";
    } else {
      return "Inactive";
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-border hover:bg-muted/20 transition-colors"
    >
      <td className="p-4">
        <div>
          <p className="text-sm font-medium text-foreground">{account.username}</p>
          <p className="text-xs text-muted-foreground">ID: {account.id}</p>
          {account.did && (
            <p className="text-xs text-muted-foreground font-mono">DID: {account.did.slice(0, 12)}...</p>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm text-foreground">{getStatusText()}</span>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm text-muted-foreground">
          {new Date(account.createdAt).toLocaleDateString()}
        </span>
      </td>
      <td className="p-4">
        <span className="text-sm text-muted-foreground">
          {account.lastUsedAt ? new Date(account.lastUsedAt).toLocaleDateString() : "Never"}
        </span>
      </td>
      <td className="p-4">
        <button
          onClick={() => onDelete(account.id)}
          disabled={isDeleting}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          <LucideTrash2 size={16} />
        </button>
      </td>
    </motion.tr>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
      setError("");
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      setError(error.message || "Failed to load accounts");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDeleteAccount = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAccount(id);
      setAccounts(accounts.filter(acc => acc.id !== id));
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      setError(error.message || "Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAccounts();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Manager</h1>
          <p className="text-muted-foreground mt-2">Manage your Bluesky accounts for automation</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-accent transition-colors disabled:opacity-50"
          >
            <LucideRefreshCw size={16} className={`text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm text-foreground">Refresh</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <LucidePlus size={16} />
            <span className="text-sm">Add Account</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/20 border border-destructive/20 rounded-lg">
          <LucideAlertCircle size={20} className="text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto text-destructive hover:text-destructive/80"
          >
            <LucideX size={16} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <LucideUsers size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <LucideCheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Accounts</p>
              <p className="text-2xl font-bold text-foreground">
                {accounts.filter(acc => acc.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <LucideXCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactive Accounts</p>
              <p className="text-2xl font-bold text-foreground">
                {accounts.filter(acc => !acc.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Connected Accounts</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your Bluesky accounts for DM automation
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <LucideLoader2 size={32} className="mx-auto animate-spin text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <LucideUsers size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No accounts connected</h3>
            <p className="text-muted-foreground mb-4">
              Add your first Bluesky account to start automation
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Account
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Account</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Last Used</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    onDelete={handleDeleteAccount}
                    isDeleting={deletingId === account.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccountAdded={fetchAccounts}
      />
    </div>
  );
}
