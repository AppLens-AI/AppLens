import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  X,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Type,
  MessageSquare,
  Megaphone,
  FileText,
  Lightbulb,
  Zap,
  Crown,
  Minimize2,
  Briefcase,
  Smile,
  Gem,
  Code2,
  Coffee,
  Settings,
  ArrowRight,
} from "lucide-react";
import { aiApi } from "@/lib/api";
import type {
  GenerateTextRequest,
  GenerateTextResponse,
  AIConfigResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface AITextModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
  onSelectText: (text: string) => void;
}

const toneOptions: {
  id: GenerateTextRequest["tone"];
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "professional",
    label: "Professional",
    icon: <Briefcase className="h-4 w-4" />,
    description: "Polished & trustworthy",
  },
  {
    id: "playful",
    label: "Playful",
    icon: <Smile className="h-4 w-4" />,
    description: "Fun & energetic",
  },
  {
    id: "minimal",
    label: "Minimal",
    icon: <Minimize2 className="h-4 w-4" />,
    description: "Clean & simple",
  },
  {
    id: "luxury",
    label: "Luxury",
    icon: <Gem className="h-4 w-4" />,
    description: "Elegant & premium",
  },
  {
    id: "technical",
    label: "Technical",
    icon: <Code2 className="h-4 w-4" />,
    description: "Precise & detailed",
  },
  {
    id: "casual",
    label: "Casual",
    icon: <Coffee className="h-4 w-4" />,
    description: "Friendly & relaxed",
  },
];

const textTypeOptions: {
  id: GenerateTextRequest["textType"];
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "tagline",
    label: "Tagline",
    icon: <Zap className="h-4 w-4" />,
    description: "3-8 words, punchy headline",
  },
  {
    id: "subtitle",
    label: "Subtitle",
    icon: <Type className="h-4 w-4" />,
    description: "5-15 words, descriptive",
  },
  {
    id: "description",
    label: "Description",
    icon: <FileText className="h-4 w-4" />,
    description: "10-25 words, detailed",
  },
  {
    id: "cta",
    label: "Call to Action",
    icon: <Megaphone className="h-4 w-4" />,
    description: "2-6 words, action-driven",
  },
  {
    id: "feature_title",
    label: "Feature Title",
    icon: <Crown className="h-4 w-4" />,
    description: "2-5 words, feature name",
  },
  {
    id: "feature_description",
    label: "Feature Desc",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "8-20 words, benefit-focused",
  },
];

const appCategories = [
  "Social Media",
  "Productivity",
  "Health & Fitness",
  "Finance",
  "Education",
  "Entertainment",
  "Travel",
  "Food & Drink",
  "Shopping",
  "Music",
  "Photography",
  "Weather",
  "News",
  "Sports",
  "Games",
  "Utilities",
  "Business",
  "Lifestyle",
  "Medical",
  "Developer Tools",
];

export function AITextModal({
  isOpen,
  onClose,
  currentText,
  onSelectText,
}: AITextModalProps) {
  const navigate = useNavigate();

  // State
  const [tone, setTone] = useState<GenerateTextRequest["tone"]>("professional");
  const [textType, setTextType] =
    useState<GenerateTextRequest["textType"]>("tagline");
  const [appCategory, setAppCategory] = useState("");
  const [context, setContext] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<GenerateTextResponse | null>(
    null
  );

  // Check AI config
  const { data: aiConfig, isLoading: configLoading } = useQuery({
    queryKey: ["ai-config"],
    queryFn: async () => {
      const response = await aiApi.getConfig();
      if (response.data?.success) {
        return response.data.data as AIConfigResponse;
      }
      return null;
    },
    enabled: isOpen,
  });

  // Generate text mutation
  const generateMutation = useMutation({
    mutationFn: async (req: GenerateTextRequest) => {
      const response = await aiApi.generateText(req);
      if (response.data?.success) {
        return response.data.data as GenerateTextResponse;
      }
      throw new Error(response.data?.message || "Generation failed");
    },
    onSuccess: (data) => {
      setSuggestions(data);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      currentText,
      appCategory,
      tone,
      textType,
      context,
      count: 4,
    });
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSelect = (text: string) => {
    onSelectText(text);
    onClose();
  };

  const handleNavigateToSettings = () => {
    onClose();
    navigate("/settings?tab=ai");
  };

  if (!isOpen) return null;

  const isNotConfigured = !configLoading && (!aiConfig || !aiConfig.isConfigured);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                AI Text Generator
              </h2>
              <p className="text-xs text-muted-foreground">
                Generate compelling copy for your screenshots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-70px)] carousel-scroll">
          {isNotConfigured ? (
            /* Not Configured State */
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Settings className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                AI Not Configured
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                To use AI-powered text generation, you need to configure your AI
                provider first. Add your API key in the Settings page to get
                started.
              </p>
              <button
                onClick={handleNavigateToSettings}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-700 hover:to-teal-700"
              >
                <Settings className="h-4 w-4" />
                Go to AI Settings
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Current Text Display */}
              {currentText && (
                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Current Text
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{currentText}</p>
                </div>
              )}

              {/* Text Type */}
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  Text Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {textTypeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTextType(option.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-all",
                        textType === option.id
                          ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20"
                          : "border-border hover:border-emerald-500/30 hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            textType === option.id
                              ? "text-emerald-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {option.icon}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {option.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  Tone / Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {toneOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTone(option.id)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all",
                        tone === option.id
                          ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20"
                          : "border-border hover:border-emerald-500/30 hover:bg-accent/50"
                      )}
                    >
                      <span
                        className={cn(
                          tone === option.id
                            ? "text-emerald-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {option.icon}
                      </span>
                      <div className="text-left">
                        <div className="text-xs font-medium text-foreground">
                          {option.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* App Category & Context */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    App Category
                  </label>
                  <select
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  >
                    <option value="">Any category</option>
                    {appCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Additional Context{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., fitness tracking app"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className={cn(
                  "w-full rounded-xl py-3.5 text-sm font-medium text-white transition-all",
                  "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/25",
                  "hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-700 hover:to-teal-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                  "flex items-center justify-center gap-2"
                )}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating suggestions...
                  </>
                ) : suggestions ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Suggestions
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Suggestions
                  </>
                )}
              </button>

              {/* Error */}
              {generateMutation.isError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive animate-in fade-in duration-200">
                  {generateMutation.error instanceof Error
                    ? generateMutation.error.message
                    : "Failed to generate text. Please try again."}
                </div>
              )}

              {/* Suggestions */}
              {suggestions && suggestions.suggestions.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium text-foreground">
                        Suggestions
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {suggestions.provider} ・ {suggestions.model}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {suggestions.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="group relative rounded-lg border border-border bg-background p-4 transition-all hover:border-emerald-500/30 hover:shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${index * 75}ms` }}
                      >
                        <p className="text-sm text-foreground pr-20 leading-relaxed">
                          {suggestion.text}
                        </p>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              handleCopy(suggestion.text, index)
                            }
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            title="Copy"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleSelect(suggestion.text)}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-emerald-700 shadow-sm"
                          >
                            Use This
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
