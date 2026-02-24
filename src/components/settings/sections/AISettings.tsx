import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsHeader } from "../SettingsHeader";
import { SettingsSection } from "../SettingsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Key,
  Loader2,
  Check,
  X,
  ExternalLink,
  Trash2,
  ChevronDown,
  Cpu,
  Eye,
  EyeOff,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { aiApi } from "@/lib/api";
import type {
  AIProvider,
  AIModel,
  AIConfigResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const providerLogos: Record<string, string> = {
  openai: "🤖",
  claude: "🧠",
  groq: "⚡",
  gemini: "✨",
  deepseek: "🔍",
  mistral: "🌊",
  perplexity: "🔮",
};

export function AISettings() {
  const queryClient = useQueryClient();

  // State
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [showProviderSelect, setShowProviderSelect] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch supported providers
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: async () => {
      const response = await aiApi.getProviders();
      if (response.data?.success) {
        return response.data.data as AIProvider[];
      }
      return [];
    },
  });

  // Fetch current config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["ai-config"],
    queryFn: async () => {
      const response = await aiApi.getConfig();
      if (response.data?.success) {
        return response.data.data as AIConfigResponse;
      }
      return null;
    },
  });

  // Fetch saved models when config exists
  const { data: savedModels = [] } = useQuery({
    queryKey: ["ai-models"],
    queryFn: async () => {
      const response = await aiApi.fetchModels();
      if (response.data?.success) {
        return response.data.data as AIModel[];
      }
      return [];
    },
    enabled: !!config?.isConfigured,
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProvider) throw new Error("No provider selected");
      return aiApi.saveConfig({
        provider: selectedProvider.id,
        apiKey,
        selectedModel,
      });
    },
    onSuccess: (response) => {
      if (response.data?.success) {
        toast.success("AI configuration saved successfully!");
        queryClient.invalidateQueries({ queryKey: ["ai-config"] });
        queryClient.invalidateQueries({ queryKey: ["ai-models"] });
        setApiKey("");
        setShowApiKey(false);
      }
    },
    onError: () => {
      toast.error("Failed to save AI configuration");
    },
  });

  // Update model mutation
  const updateModelMutation = useMutation({
    mutationFn: (model: string) => aiApi.updateModel(model),
    onSuccess: (response) => {
      if (response.data?.success) {
        toast.success("Model updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["ai-config"] });
      }
    },
    onError: () => {
      toast.error("Failed to update model");
    },
  });

  // Delete config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: () => aiApi.deleteConfig(),
    onSuccess: (response) => {
      if (response.data?.success) {
        toast.success("AI configuration removed");
        queryClient.invalidateQueries({ queryKey: ["ai-config"] });
        queryClient.invalidateQueries({ queryKey: ["ai-models"] });
        setSelectedProvider(null);
        setApiKey("");
        setSelectedModel("");
        setAvailableModels([]);
        setValidationSuccess(false);
        setShowDeleteConfirm(false);
      }
    },
    onError: () => {
      toast.error("Failed to remove AI configuration");
    },
  });

  // When config loads, set the appropriate provider
  useEffect(() => {
    if (config?.isConfigured && providers.length > 0) {
      const p = providers.find((pr) => pr.id === config.provider);
      if (p) setSelectedProvider(p);
      setSelectedModel(config.selectedModel || "");
    }
  }, [config, providers]);

  // Validate API key and fetch models
  const handleValidateKey = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      toast.error("Please select a provider and enter an API key");
      return;
    }

    setIsValidating(true);
    setValidationSuccess(false);

    try {
      const response = await aiApi.fetchModelsWithKey(
        selectedProvider.id,
        apiKey.trim()
      );
      if (response.data?.success) {
        const models = response.data.data as AIModel[];
        setAvailableModels(models);
        setValidationSuccess(true);
        if (models.length > 0 && !selectedModel) {
          setSelectedModel(models[0].id);
        }
        toast.success(`API key validated! Found ${models.length} available models.`);
      }
    } catch {
      toast.error("Invalid API key or unable to connect to provider");
      setAvailableModels([]);
    } finally {
      setIsValidating(false);
    }
  };

  const isConfigured = config?.isConfigured;

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="AI Configuration"
        description="Connect your AI provider to unlock intelligent text generation in the editor."
      />

      {/* Status Card */}
      {!configLoading && (
        <div
          className={cn(
            "rounded-xl border p-5 transition-all duration-300",
            isConfigured
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-amber-500/30 bg-amber-500/5"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isConfigured ? "bg-emerald-500/15" : "bg-amber-500/15"
              )}
            >
              {isConfigured ? (
                <Check className="h-5 w-5 text-emerald-500" />
              ) : (
                <Sparkles className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={cn(
                  "font-semibold",
                  isConfigured ? "text-emerald-400" : "text-amber-400"
                )}
              >
                {isConfigured ? "AI is Active" : "AI Not Configured"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isConfigured
                  ? `Using ${config?.provider} ・ Model: ${config?.selectedModel || "Not selected"} ・ Key: ${config?.maskedKey}`
                  : "Add your API key below to enable AI-powered text suggestions in the editor."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <SettingsSection
        title="AI Provider"
        description="Select your preferred AI platform and add your API key."
      >
        <div className="space-y-5 pt-2">
          {/* Provider Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Provider
            </label>
            <div className="relative">
              <button
                onClick={() => setShowProviderSelect(!showProviderSelect)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {selectedProvider ? (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {providerLogos[selectedProvider.icon] || "🤖"}
                    </span>
                    <div className="text-left">
                      <div className="font-medium text-foreground">
                        {selectedProvider.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedProvider.description}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    Select an AI provider...
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    showProviderSelect && "rotate-180"
                  )}
                />
              </button>

              {showProviderSelect && (
                <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
                    <div className="max-h-[320px] overflow-y-auto carousel-scroll p-2">
                    {providersLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      providers.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => {
                            setSelectedProvider(provider);
                            setShowProviderSelect(false);
                            setApiKey("");
                            setAvailableModels([]);
                            setValidationSuccess(false);
                            setSelectedModel("");
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-all hover:bg-accent",
                            selectedProvider?.id === provider.id &&
                              "bg-primary/10 ring-1 ring-primary/20"
                          )}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">
                            {providerLogos[provider.icon] || "🤖"}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-foreground">
                              {provider.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {provider.description}
                            </div>
                          </div>
                          {selectedProvider?.id === provider.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* API Key Input */}
          {selectedProvider && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  API Key
                </label>
                <a
                  href={selectedProvider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Get API Key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setValidationSuccess(false);
                      setAvailableModels([]);
                    }}
                    placeholder={
                      isConfigured
                        ? `Current: ${config?.maskedKey} (enter new key to update)`
                        : `Enter your ${selectedProvider.name} API key`
                    }
                    className="pl-10 pr-10 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  onClick={handleValidateKey}
                  disabled={!apiKey.trim() || isValidating}
                  variant={validationSuccess ? "default" : "outline"}
                  className={cn(
                    "min-w-[120px] transition-all",
                    validationSuccess &&
                      "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating
                    </>
                  ) : validationSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      Valid
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Validate
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>
                  Your API key is encrypted and stored securely. It never leaves
                  your server.
                </span>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Model Selection */}
      {(validationSuccess && availableModels.length > 0) ||
      (isConfigured && savedModels.length > 0) ? (
        <SettingsSection
          title="Model Selection"
          description="Choose the AI model to use for text generation across your projects."
        >
          <div className="space-y-4 pt-2">
            <div className="grid gap-2 max-h-[280px] overflow-y-auto carousel-scroll pr-1">
              {(validationSuccess ? availableModels : savedModels).map(
                (model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      if (isConfigured && !validationSuccess) {
                        updateModelMutation.mutate(model.id);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                      selectedModel === model.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-accent/50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        selectedModel === model.id
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {model.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {model.id}
                      </div>
                    </div>
                    {selectedModel === model.id && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        </SettingsSection>
      ) : null}

      {/* Save Button */}
      {validationSuccess && selectedModel && (
        <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Button
            onClick={() => saveConfigMutation.mutate()}
            disabled={saveConfigMutation.isPending}
            className="min-w-[180px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
            size="lg"
          >
            {saveConfigMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Save Configuration
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Danger Zone */}
      {isConfigured && (
        <SettingsSection title="Manage Configuration">
          <div className="pt-2">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 animate-in fade-in duration-200">
                <p className="flex-1 text-sm text-destructive">
                  Are you sure? This will remove your AI configuration and
                  disable AI features.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteConfigMutation.mutate()}
                  disabled={deleteConfigMutation.isPending}
                >
                  {deleteConfigMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Remove AI Configuration
              </Button>
            )}
          </div>
        </SettingsSection>
      )}
    </div>
  );
}
