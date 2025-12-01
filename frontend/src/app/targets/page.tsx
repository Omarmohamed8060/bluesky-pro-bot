"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LucideUsers,
  LucideUpload,
  LucideDownload,
  LucideTrash2,
  LucideCheckCircle,
  LucideXCircle,
  LucideClock,
  LucideLoader2,
  LucideTarget,
  LucideList,
  LucideUserPlus
} from "lucide-react";
import { getTargetLists, createTargetList, addTargets, deleteTargetList, deleteTarget, getTargets, TargetList, Target, apiUrl } from "@/lib/api";

const normalizeTargetInput = (raw: string): string | null => {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("did:")) {
    return trimmed;
  }

  let handle = trimmed.toLowerCase();
  if (handle.startsWith("@")) {
    handle = handle.slice(1);
  }

  if (!handle.includes(".")) {
    handle = `${handle}.bsky.social`;
  }

  return handle;
};

export default function TargetsPage() {
  const [targetLists, setTargetLists] = useState<TargetList[]>([]);
  const [selectedList, setSelectedList] = useState<TargetList | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [bulkImportText, setBulkImportText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingList, setIsSubmittingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processed: 0,
    failed: 0
  });

  // New state for followers functionality
  const [followHandle, setFollowHandle] = useState("");
  const [followers, setFollowers] = useState<Array<{ handle: string; did: string; displayName?: string }>>([]);
  const [selectedFollowers, setSelectedFollowers] = useState<Set<string>>(new Set());
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);

  const preparedTargets = bulkImportText
    .split('\n')
    .map(normalizeTargetInput)
    .filter((value): value is string => Boolean(value));

  const fetchTargetLists = async () => {
    try {
      const lists = await getTargetLists();
      setTargetLists(lists);
      if (lists.length === 0) {
        setSelectedList(null);
        setTargets([]);
        updateStats([]);
        return;
      }

      if (!selectedList || !lists.some((list) => list.id === selectedList.id)) {
        setSelectedList(lists[0]);
      }
    } catch (error) {
      console.error('Failed to fetch target lists:', error);
    }
  };

  const fetchTargets = async (listId: string) => {
    setIsLoading(true);
    try {
      const targetsData = await getTargets(listId);
      setTargets(targetsData);
      updateStats(targetsData);
    } catch (error) {
      console.error('Failed to fetch targets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTargetLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedList) {
      fetchTargets(selectedList.id);
    } else {
      setTargets([]);
      updateStats([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedList?.id]);

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    setIsSubmittingList(true);

    try {
      const newList = await createTargetList({
        name: newListName.trim(),
        description: newListDescription.trim() || undefined
      });

      setTargetLists((prev) => [newList, ...prev]);
      setSelectedList(newList);
      setTargets([]);
      setNewListName("");
      setNewListDescription("");
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error('[Frontend] Failed to create target list:', error);
      const errorMessage = error?.response?.data?.details
        || error?.message
        || error?.data?.message
        || 'Failed to create target list. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmittingList(false);
    }
  };

  const updateStats = (targetList: Target[]) => {
    setStats({
      total: targetList.length,
      pending: 0, // Simplified for now
      processed: targetList.length, // All targets are considered processed
      failed: 0
    });
  };

  const handleBulkImport = async () => {
    if (!selectedList) {
      alert('Select a target list before importing.');
      return;
    }

    if (preparedTargets.length === 0) {
      alert('Please enter at least one valid handle or DID.');
      return;
    }

    setIsImporting(true);
    
    try {
      const result = await addTargets(selectedList.id, preparedTargets);

      // Refresh targets after import
      await fetchTargets(selectedList.id);
      setBulkImportText("");
      alert(`Imported ${result.added} targets. ${result.duplicates} duplicates skipped. ${result.invalid} invalid entries.`);
    } catch (error: any) {
      console.error('Import failed:', error);
      const message = error?.response?.data?.details || error?.message || 'Import failed. Please check your targets.';
      alert(message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteTarget = async (id: string) => {
    if (!selectedList) return;

    try {
      await deleteTarget(id);
      await fetchTargets(selectedList.id);
    } catch (error) {
      console.error('Failed to delete target:', error);
      alert('Failed to delete target. Please try again.');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this target list?")) return;

    try {
      await deleteTargetList(listId);
      await fetchTargetLists();
      if (selectedList?.id === listId) {
        setSelectedList(null);
        setTargets([]);
        updateStats([]);
      }
    } catch (error: any) {
      console.error('Failed to delete target list:', error);
      const message = error?.response?.data?.details || error?.message || 'Failed to delete target list.';
      alert(message);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Handle', 'DID', 'Display Name', 'Created At'],
      ...targets.map(t => [
        t.handle || '',
        t.did || '',
        t.displayName || '',
        t.createdAt
      ])
    ];
    
    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `targets-${selectedList?.name || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGetFollowers = async () => {
    if (!followHandle.trim()) {
      alert('Please enter a Bluesky handle');
      return;
    }

    setIsLoadingFollowers(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/follow/followers/${encodeURIComponent(followHandle.trim())}`));
      const data = await response.json();

      if (data.success) {
        setFollowers(data.followers);
        setSelectedFollowers(new Set());
      } else {
        alert(`Failed to get followers: ${data.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error getting followers:', error);
      alert('Failed to get followers. Please try again.');
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const handleFollowUser = async () => {
    if (!followHandle.trim()) {
      alert('Please enter a Bluesky handle');
      return;
    }

    setIsFollowingUser(true);
    try {
      const response = await fetch(apiUrl('/api/v1/follow/follow'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: followHandle.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully followed ${data.handle}`);
      } else {
        alert(`Failed to follow user: ${data.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error following user:', error);
      alert('Failed to follow user. Please try again.');
    } finally {
      setIsFollowingUser(false);
    }
  };

  const handleAddFollowersToList = async () => {
    if (!selectedList) {
      alert('Please select a target list first');
      return;
    }

    if (selectedFollowers.size === 0) {
      alert('Please select at least one follower');
      return;
    }

    const selectedFollowersData = followers.filter(f => selectedFollowers.has(f.did));

    try {
      const response = await fetch(`/api/v1/targets/lists/${selectedList.id}/add-followers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followers: selectedFollowersData }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Added ${selectedFollowersData.length} followers to target list`);
        setSelectedFollowers(new Set());
        await fetchTargets(selectedList.id);
      } else {
        alert(`Failed to add followers: ${data.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding followers to list:', error);
      alert('Failed to add followers to target list. Please try again.');
    }
  };

  const toggleFollowerSelection = (did: string) => {
    setSelectedFollowers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(did)) {
        newSet.delete(did);
      } else {
        newSet.add(did);
      }
      return newSet;
    });
  };

  const toggleAllFollowers = () => {
    if (selectedFollowers.size === followers.length) {
      setSelectedFollowers(new Set());
    } else {
      setSelectedFollowers(new Set(followers.map(f => f.did)));
    }
  };

  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Target Lists</h1>
          <p className="text-muted-foreground mt-2">Manage your target users for DM campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={targets.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-accent transition-colors disabled:opacity-50"
          >
            <LucideDownload size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Target Lists */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Target Lists</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <LucideUserPlus size={16} />
            <span className="text-sm">Create List</span>
          </button>
        </div>

        {targetLists.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <LucideList size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No target lists</h3>
            <p className="text-muted-foreground mb-4">
              Create your first target list to start importing users
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Target List
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {targetLists.map((list) => (
              <div
                key={list.id}
                className={`bg-card border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedList?.id === list.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => setSelectedList(list)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{list.name}</h3>
                    {list.description && (
                      <p className="text-sm text-muted-foreground mt-1">{list.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {list._count.targets} targets • Created {new Date(list.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedList?.id === list.id && (
                      <LucideCheckCircle size={16} className="text-primary" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <LucideTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Create Target List</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="My Target List"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description (optional)</label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  rows={3}
                  placeholder="Describe your target list..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewListName("");
                    setNewListDescription("");
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateList}
                  disabled={isSubmittingList || !newListName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmittingList ? "Creating..." : "Create List"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <LucideUsers size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Targets</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <LucideClock size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <LucideCheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processed</p>
              <p className="text-2xl font-bold text-foreground">{stats.processed}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <LucideXCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-foreground">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Followers Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <LucideUserPlus size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Followers Management</h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={followHandle}
              onChange={(e) => setFollowHandle(e.target.value)}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Enter Bluesky handle (e.g., username.bsky.social)"
            />
            <button
              onClick={handleGetFollowers}
              disabled={isLoadingFollowers || !followHandle.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoadingFollowers ? (
                <>
                  <LucideLoader2 size={16} className="animate-spin mr-2" />
                  Getting...
                </>
              ) : (
                "Get Followers"
              )}
            </button>
            <button
              onClick={handleFollowUser}
              disabled={isFollowingUser || !followHandle.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isFollowingUser ? (
                <>
                  <LucideLoader2 size={16} className="animate-spin mr-2" />
                  Following...
                </>
              ) : (
                "Follow Direct"
              )}
            </button>
          </div>

          {followers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">
                  Followers ({followers.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={toggleAllFollowers}
                    className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    {selectedFollowers.size === followers.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={handleAddFollowersToList}
                    disabled={selectedFollowers.size === 0 || !selectedList}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Add to List ({selectedFollowers.size})
                  </button>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-accent sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-foreground">
                          <input
                            type="checkbox"
                            checked={selectedFollowers.size === followers.length && followers.length > 0}
                            onChange={toggleAllFollowers}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-foreground">Handle</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-foreground">Display Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {followers.map((follower) => (
                        <tr key={follower.did} className="border-t border-border hover:bg-accent/50">
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedFollowers.has(follower.did)}
                              onChange={() => toggleFollowerSelection(follower.did)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm text-foreground font-mono">
                            {follower.handle}
                          </td>
                          <td className="px-4 py-2 text-sm text-foreground">
                            {follower.displayName || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Bulk Import Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-lg">
            <LucideUpload size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Bulk Import Targets</h2>
            <p className="text-sm text-muted-foreground">Import handles or DIDs in bulk</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Handles / DIDs (one per line)
            </label>
            <textarea
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none font-mono text-sm"
              rows={8}
              placeholder="user1.bsky.social&#10;user2.bsky.social&#10;did:plc:abc123def456&#10;user3.bsky.social"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                Supports: @username.bsky.social
              </span>
              <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                Supports: did:plc:abc123
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border">
            <LucideTarget size={20} className="text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {preparedTargets.length} targets ready for import
              </p>
              <p className="text-xs text-muted-foreground">
                Targets will be validated and processed automatically
              </p>
            </div>
          </div>

          <button
            onClick={handleBulkImport}
            disabled={isImporting || preparedTargets.length === 0}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <LucideLoader2 size={20} className="animate-spin" />
                Processing Targets...
              </>
            ) : (
              <>
                <LucideUpload size={20} />
                Import Targets
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Imported Targets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Imported Targets</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor your target list
          </p>
        </div>

        {targets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <LucideUsers size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No targets imported</h3>
            <p className="text-muted-foreground mb-4">
              Start by importing handles or DIDs using the bulk import feature above
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Target</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">DID</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target) => (
                  <tr key={target.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <LucideUserPlus size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{target.handle}</p>
                          <p className="text-xs text-muted-foreground">ID: {target.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-mono text-muted-foreground">
                        {target.did || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium px-2 py-1 rounded text-green-400 bg-green-500/20">
                        Active
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(target.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteTarget(target.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <LucideTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
