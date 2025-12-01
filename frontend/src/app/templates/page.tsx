"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LucideFileText,
  LucidePlus,
  LucideTrash2,
  LucideEdit,
  LucideEye,
  LucideCopy,
  LucideCheckCircle,
  LucideAlertCircle,
  LucideX,
  LucideLoader2,
  LucideCode,
  LucideMessageSquare
} from "lucide-react";
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, Template } from "@/lib/api";

function CreateTemplateModal({ 
  isOpen, 
  onClose, 
  onTemplateCreated 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onTemplateCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    description: ""
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
      await createTemplate(formData);
      setSuccess(true);
      setTimeout(() => {
        onTemplateCreated();
        onClose();
        setFormData({ name: "", content: "", description: "" });
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create template");
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
        className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Create Template</h2>
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
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Welcome Message"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Template for welcoming new followers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Template Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground font-mono text-sm"
              rows={8}
              placeholder="Hi {{username}}, thanks for following! Welcome to my profile."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {"{{variable}}"} placeholders for dynamic content. Available: {"{{username}}"}, {"{{displayName}}"}, {"{{handle}}"}
            </p>
          </div>

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/20 rounded-lg">
              <LucideCheckCircle size={16} className="text-green-400" />
              <span className="text-sm text-green-400">Template created successfully!</span>
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
                  Creating...
                </div>
              ) : success ? (
                <div className="flex items-center justify-center gap-2">
                  <LucideCheckCircle size={16} />
                  Created!
                </div>
              ) : (
                "Create Template"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function TemplateRow({ 
  template, 
  onDelete, 
  onEdit,
  isDeleting 
}: { 
  template: Template; 
  onDelete: (id: string) => void;
  onEdit: (template: Template) => void;
  isDeleting: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template.content);
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-border hover:bg-muted/20 transition-colors"
    >
      <td className="p-4">
        <div>
          <p className="text-sm font-medium text-foreground">{template.name}</p>
          {template.description && (
            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="max-w-xs">
          <p className="text-sm text-muted-foreground truncate">
            {template.content}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {template.content.length} characters
          </p>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm text-muted-foreground">
          {new Date(template.createdAt).toLocaleDateString()}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Preview"
          >
            <LucideEye size={16} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy content"
          >
            <LucideCopy size={16} />
          </button>
          <button
            onClick={() => onEdit(template)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Edit"
          >
            <LucideEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            disabled={isDeleting}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            title="Delete"
          >
            <LucideTrash2 size={16} />
          </button>
        </div>
      </td>
      {showPreview && (
        <td colSpan={4} className="p-4 bg-muted/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <LucideEye size={16} />
              Preview
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{template.content}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Variables: {"{{username}}"}, {"{{displayName}}"}, {"{{handle}}"}</p>
            </div>
          </div>
        </td>
      )}
    </motion.tr>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
      setError("");
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
      setError(error.message || "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDeleteTemplate = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      setError(error.message || "Failed to delete template");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditTemplate = (template: Template) => {
    // TODO: Implement edit modal
    console.log('Edit template:', template);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-2">Manage message templates for campaigns</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <LucidePlus size={16} />
          <span className="text-sm">Create Template</span>
        </button>
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
              <LucideFileText size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Templates</p>
              <p className="text-2xl font-bold text-foreground">{templates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <LucideMessageSquare size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DM Templates</p>
              <p className="text-2xl font-bold text-foreground">
                {templates.filter(t => t.content.includes('{{')).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <LucideCode size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variables Used</p>
              <p className="text-2xl font-bold text-foreground">
                {templates.filter(t => t.content.includes('{{')).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Message Templates</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage reusable message templates with variables
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <LucideLoader2 size={32} className="mx-auto animate-spin text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <LucideFileText size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No templates created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first message template to use in campaigns
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Content</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <TemplateRow
                    key={template.id}
                    template={template}
                    onDelete={handleDeleteTemplate}
                    onEdit={handleEditTemplate}
                    isDeleting={deletingId === template.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTemplateCreated={fetchTemplates}
      />
    </div>
  );
}
