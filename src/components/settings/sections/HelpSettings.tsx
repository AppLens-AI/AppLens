import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsHeader } from "../SettingsHeader";
import { SettingsSection } from "../SettingsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Bug,
  ExternalLink,
  FileText,
  Keyboard,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle,
  Loader2,
  X,
  Image,
  Clock,
  AlertCircle,
} from "lucide-react";
import { appApi, feedbackApi } from "@/lib/api";
import { toast } from "sonner";
import { AppInfo, Feedback, FeedbackType } from "@/types";

const shortcuts = [
  { keys: ["⌘/Ctrl", "Z"], action: "Undo" },
  { keys: ["⌘/Ctrl", "⇧", "Z"], action: "Redo" },
  { keys: ["Delete/Backspace"], action: "Delete selected layer" },
  { keys: ["Esc"], action: "Deselect / Close panel" },
];

export function HelpSettings() {
  const queryClient = useQueryClient();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const allShortcuts = [
    {
      category: "General",
      shortcuts: [
        { keys: ["⌘/Ctrl", "Z"], action: "Undo" },
        { keys: ["⌘/Ctrl", "⇧", "Z"], action: "Redo" },
      ],
    },
    {
      category: "Layers",
      shortcuts: [
        { keys: ["Delete"], action: "Delete selected layer" },
        { keys: ["Backspace"], action: "Delete selected layer" },
      ],
    },
    {
      category: "Navigation",
      shortcuts: [{ keys: ["Esc"], action: "Deselect / Close panel" }],
    },
  ];

  const { data: appInfo, isLoading: appInfoLoading } = useQuery({
    queryKey: ["app-info"],
    queryFn: async () => {
      const response = await appApi.getInfo();
      if (response.data?.success) {
        return response.data.data as AppInfo;
      }
      return null;
    },
  });

  const { data: myFeedback = [] } = useQuery({
    queryKey: ["my-feedback"],
    queryFn: async () => {
      const response = await feedbackApi.getMyFeedback();
      if (response.data?.success) {
        return response.data.data || [];
      }
      return [];
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: {
      type: FeedbackType;
      title: string;
      description: string;
    }) => feedbackApi.create(data),
    onSuccess: (response) => {
      if (response.data?.success) {
        toast.success(
          feedbackType === "bug_report"
            ? "Bug report submitted! We'll look into it."
            : feedbackType === "feature_request"
              ? "Feature request submitted! Thanks for the suggestion."
              : "Feedback submitted! Thank you.",
        );
        setShowFeedbackModal(false);
        setFeedbackTitle("");
        setFeedbackDescription("");
        setFeedbackType("general");
        queryClient.invalidateQueries({ queryKey: ["my-feedback"] });
      } else {
        toast.error(response.data?.message || "Failed to submit feedback");
      }
    },
    onError: () => {
      toast.error("Failed to submit feedback");
    },
  });

  const handleSubmitFeedback = () => {
    if (!feedbackTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!feedbackDescription.trim()) {
      toast.error("Please describe your feedback");
      return;
    }

    submitFeedbackMutation.mutate({
      type: feedbackType,
      title: feedbackTitle,
      description: feedbackDescription,
    });
  };

  const openFeedbackModal = (type: FeedbackType) => {
    setFeedbackType(type);
    setShowFeedbackModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500",
      in_progress: "bg-blue-500/10 text-blue-500",
      resolved: "bg-green-500/10 text-green-500",
      closed: "bg-gray-500/10 text-gray-500",
    };
    const labels: Record<string, string> = {
      pending: "Pending",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    };
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full ${styles[status] || styles.pending}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug_report":
        return <Bug className="h-4 w-4 text-red-500" />;
      case "feature_request":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Help & About"
        description="Resources, shortcuts, and information about AppLens"
      />

      <SettingsSection
        title="Keyboard Shortcuts"
        description="Master AppLens with these shortcuts"
      >
        <div className="grid gap-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.action}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="flex h-6 min-w-[24px] items-center justify-center rounded bg-card px-2 text-xs font-medium text-foreground border border-border"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full gap-2"
          onClick={() => setShowShortcutsModal(true)}
        >
          <Keyboard className="h-4 w-4" />
          View All Shortcuts
        </Button>
      </SettingsSection>

      <SettingsSection title="Resources">
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="/docs/getting-started"
            target="_blank"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Getting Started</p>
              <p className="text-xs text-muted-foreground">Learn the basics</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="/docs/screenshot-requirements"
            target="_blank"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Image className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Screenshot Guide</p>
              <p className="text-xs text-muted-foreground">Size requirements</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="/docs"
            target="_blank"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Documentation</p>
              <p className="text-xs text-muted-foreground">Full reference</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="/templates"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Sparkles className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Templates</p>
              <p className="text-xs text-muted-foreground">Browse gallery</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </SettingsSection>

      <SettingsSection title="Feedback" description="Help us improve AppLens">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => openFeedbackModal("bug_report")}
          >
            <Bug className="h-4 w-4" />
            Report Bug
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => openFeedbackModal("feature_request")}
          >
            <Lightbulb className="h-4 w-4" />
            Feature Request
          </Button>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-2 gap-2"
          onClick={() => openFeedbackModal("general")}
        >
          <MessageSquare className="h-4 w-4" />
          General Feedback
        </Button>

        {/* User's recent feedback */}
        {myFeedback.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Your Recent Feedback
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myFeedback.slice(0, 5).map((fb) => (
                <div
                  key={fb.id}
                  className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3"
                >
                  {getTypeIcon(fb.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fb.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {getStatusBadge(fb.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="About AppLens">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium text-foreground">
              {appInfoLoading ? "..." : appInfo?.version || "1.0.0"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Build Date</span>
            <span className="text-sm font-mono text-muted-foreground">
              {appInfoLoading
                ? "..."
                : appInfo?.buildDate || new Date().toISOString().split("T")[0]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Environment</span>
            <span
              className={`text-sm font-medium px-2 py-0.5 rounded ${
                appInfo?.environment === "production"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
              }`}
            >
              {appInfoLoading ? "..." : appInfo?.environment || "development"}
            </span>
          </div>
          <a
            href="https://github.com/AppLens-AI/AppLens"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              View Changelog
            </Button>
          </a>
        </div>
      </SettingsSection>

      <div className="text-center text-sm text-muted-foreground">
        <p>Made with ❤️ for app developers</p>
        <p className="mt-1">
          © {new Date().getFullYear()} AppLens. All rights reserved.
        </p>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {feedbackType === "bug_report" && (
                  <Bug className="h-5 w-5 text-red-500" />
                )}
                {feedbackType === "feature_request" && (
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                )}
                {feedbackType === "general" && (
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                )}
                {feedbackType === "bug_report"
                  ? "Report a Bug"
                  : feedbackType === "feature_request"
                    ? "Request a Feature"
                    : "General Feedback"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedbackModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  placeholder={
                    feedbackType === "bug_report"
                      ? "Brief description of the bug..."
                      : feedbackType === "feature_request"
                        ? "What feature would you like?"
                        : "What's on your mind?"
                  }
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Description
                </label>
                <textarea
                  className="w-full h-32 px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={
                    feedbackType === "bug_report"
                      ? "Please describe the bug in detail. Include steps to reproduce if possible..."
                      : feedbackType === "feature_request"
                        ? "Describe the feature and how it would help you..."
                        : "Share your thoughts, suggestions, or comments..."
                  }
                  value={feedbackDescription}
                  onChange={(e) => setFeedbackDescription(e.target.value)}
                />
              </div>

              {feedbackType === "bug_report" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs">
                    Include browser info, device type, and any error messages
                    you see for faster resolution.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowFeedbackModal(false)}
                  disabled={submitFeedbackMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleSubmitFeedback}
                  disabled={submitFeedbackMutation.isPending}
                >
                  {submitFeedbackMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl p-6 w-full max-w-2xl mx-4 border border-border max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcutsModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-6 pr-2">
              {allShortcuts.map((category) => (
                <div key={category.category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    {category.category}
                  </h4>
                  <div className="space-y-1">
                    {category.shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"
                      >
                        <span className="text-sm">{shortcut.action}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <kbd
                              key={i}
                              className="flex h-6 min-w-[24px] items-center justify-center rounded bg-card px-2 text-xs font-medium border border-border"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowShortcutsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
