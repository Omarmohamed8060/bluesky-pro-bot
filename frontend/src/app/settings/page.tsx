"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LucideSettings,
  LucideSave,
  LucideRefreshCw,
  LucideBot,
  LucideGlobe,
  LucideZap,
  LucideShield,
  LucideAlertTriangle,
  LucideCheckCircle,
  LucideX
} from "lucide-react";
import { getSettings, updateSettings } from "@/lib/api";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    botName: "Bluesky Pro Bot",
    language: "en",
    maxDmsPerHour: 50,
    delayBetweenActions: 5,
    appPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        setFormData(settings);
      } catch (err: any) {
        setError('Failed to load settings');
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (success) setSuccess("");
    if (error) setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateSettings(formData);
      setSuccess("Settings saved successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
      // Reset form
      setFormData({
        botName: "Bluesky Pro Bot",
        language: "en",
        maxDmsPerHour: 50,
        delayBetweenActions: 5,
        appPassword: ""
      });
      setError("All data has been reset.");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Configure your bot behavior and preferences</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-500/20 border border-green-500/20 rounded-lg">
          <LucideCheckCircle size={20} className="text-green-400" />
          <span className="text-sm text-green-400">{success}</span>
          <button
            onClick={() => setSuccess("")}
            className="ml-auto text-green-400 hover:text-green-400/80"
          >
            <LucideX size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/20 border border-destructive/20 rounded-lg">
          <LucideAlertTriangle size={20} className="text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto text-destructive hover:text-destructive/80"
          >
            <LucideX size={16} />
          </button>
        </div>
      )}

      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* General Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <LucideSettings size={20} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">General</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bot Name
            </label>
            <div className="relative">
              <LucideBot size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                value={formData.botName}
                onChange={(e) => handleChange("botName", e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="Enter bot name"
              />
            </div>
          </div>
        </div>

        {/* Automation Limits */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <LucideZap size={20} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Automation Limits</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max DMs per Hour
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxDmsPerHour}
                onChange={(e) => handleChange("maxDmsPerHour", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Limit to prevent rate limiting (recommended: 50)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Delay Between Actions (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.delayBetweenActions}
                onChange={(e) => handleChange("delayBetweenActions", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pause between DMs to avoid detection (recommended: 5)
              </p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <LucideShield size={20} className="text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Security</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              App Password
            </label>
            <input
              type="password"
              value={formData.appPassword}
              onChange={(e) => handleChange("appPassword", e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Enter app password (masked)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Generate app passwords in your Bluesky account settings
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <LucideAlertTriangle size={20} className="text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Irreversible actions that affect your data and settings.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
            >
              Reset All Data
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => setFormData({
              botName: "Bluesky Pro Bot",
              language: "en",
              maxDmsPerHour: 50,
              delayBetweenActions: 5,
              appPassword: ""
            })}
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
          >
            <LucideRefreshCw size={16} className="mr-2" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <LucideRefreshCw size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <LucideSave size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
