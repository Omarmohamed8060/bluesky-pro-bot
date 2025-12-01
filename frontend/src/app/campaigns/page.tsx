"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LucideMail,
  LucideRocket,
  LucideRefreshCw,
  LucideTarget,
  LucideMessageSquare,
  LucideCheckCircle,
  LucideXCircle,
  LucideClock,
  LucideLoader2,
  LucideEdit,
  LucideUsers,
  LucideSend,
  LucideList,
  LucideAlertCircle,
  LucideFileText,
  LucideX
} from "lucide-react";
import { getCampaigns, createCampaign, startCampaign, pauseCampaign, deleteCampaign, getAccounts, addAccount, Account, Campaign } from "@/lib/api";

export default function CampaignsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "dm" as 'dm' | 'post',
    accountId: "",
    message: "",
    targetAudience: ""
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsData, campaignsData] = await Promise.all([
          getAccounts(),
          getCampaigns()
        ]);
        setAccounts(accountsData);
        setRecentCampaigns(campaignsData.slice(0, 5));
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        setError(error.message || "Failed to load data");
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validate form
    if (!formData.accountId) {
      setError("Please select an account");
      setIsLoading(false);
      return;
    }

    const targets = formData.targetAudience
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (targets.length === 0) {
      setError("Please add at least one target");
      setIsLoading(false);
      return;
    }

    try {
      const campaignData = {
        name: formData.name || `Campaign-${Date.now()}`,
        type: formData.type,
        message: formData.message,
        targets,
        accountId: formData.accountId
      };

      console.log('FRONTEND - Starting campaign with data:', campaignData);
      
      await startCampaign(campaignData);

      setSuccess("Campaign launched successfully! Check the logs for progress.");
      
      // Reset form
      setFormData({
        name: "",
        type: "dm",
        accountId: "",
        message: "",
        targetAudience: ""
      });

      // Refresh campaigns
      const updatedCampaigns = await getCampaigns();
      setRecentCampaigns(updatedCampaigns.slice(0, 5));

    } catch (error: any) {
      console.error('FRONTEND - Campaign launch error:', error);
      
      // Handle different error types
      let errorMessage = "Failed to launch campaign";
      
      if (error?.data?.details) {
        errorMessage = error.data.details;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaign Builder</h1>
          <p className="text-muted-foreground mt-2">Launch powerful DM campaigns to your target audience</p>
        </div>
      </div>

      {/* Error/Success Display */}
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

      {/* Campaign Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-lg">
            <LucideRocket size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Launch New Campaign</h2>
            <p className="text-sm text-muted-foreground">Configure your DM automation campaign</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Type Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Campaign Type
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "dm" })}
                className={`p-4 border rounded-lg transition-colors ${
                  formData.type === "dm"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:bg-accent text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LucideMail size={20} />
                  <div className="text-left">
                    <p className="font-medium">Direct Message (DM)</p>
                    <p className="text-xs text-muted-foreground">Send private messages to targets</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "post" })}
                className={`p-4 border rounded-lg transition-colors ${
                  formData.type === "post"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:bg-accent text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LucideFileText size={20} />
                  <div className="text-left">
                    <p className="font-medium">Public Post / Mention</p>
                    <p className="text-xs text-muted-foreground">Create public posts with mentions</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="Summer Blast Campaign 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Account
              </label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                required
              >
                <option value="">Choose an account...</option>
                {accounts.filter(acc => acc.isActive).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username} (Active)
                  </option>
                ))}
              </select>
              {accounts.filter(acc => acc.isActive).length === 0 && (
                <p className="text-xs text-destructive mt-1">
                  No active accounts available. Please add and activate an account first.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {formData.type === "dm" ? "Message Template" : "Post Content"}
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
              rows={4}
              placeholder={
                formData.type === "dm" 
                  ? "Hey {{username}}! Check out our amazing new features..."
                  : "Check out this amazing update! {{username}} you'll love this..."
              }
              required
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                {"{{username}}"} - Target's username
              </span>
              <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                {"{{name}}"} - Target's display name
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Target Audience
            </label>
            <textarea
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none font-mono text-sm"
              rows={6}
              placeholder="user1.bsky.social&#10;user2.bsky.social&#10;user3.bsky.social&#10;did:plc:abc123..."
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter usernames or DIDs, one per line. Supports both formats.
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border">
            <LucideTarget size={20} className="text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {formData.targetAudience.split('\n').filter(t => t.trim()).length} targets identified
              </p>
              <p className="text-xs text-muted-foreground">
                Campaign will send {formData.type === "dm" ? "direct messages" : "public posts with mentions"} to each target
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || accounts.filter(acc => acc.isActive).length === 0}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-lg font-semibold"
          >
            {isLoading ? (
              <>
                <LucideLoader2 size={20} className="animate-spin" />
                Launching Campaign...
              </>
            ) : (
              <>
                <LucideRocket size={20} />
                🚀 Launch Campaign
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Recent Campaigns */}
      {recentCampaigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Campaigns</h3>
          <div className="space-y-3">
            {recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    campaign.status === 'running' ? 'bg-green-500/20' :
                    campaign.status === 'completed' ? 'bg-blue-500/20' :
                    campaign.status === 'failed' ? 'bg-red-500/20' :
                    'bg-gray-500/20'
                  }`}>
                    {campaign.status === 'running' ? <LucideSend size={16} className="text-green-400" /> :
                     campaign.status === 'completed' ? <LucideCheckCircle size={16} className="text-blue-400" /> :
                     campaign.status === 'failed' ? <LucideXCircle size={16} className="text-red-400" /> :
                     <LucideClock size={16} className="text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.sentCount} / {campaign.totalTargets} sent
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground capitalize">{campaign.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.successRate.toFixed(1)}% success rate
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
