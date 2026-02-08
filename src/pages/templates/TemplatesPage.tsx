import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { templatesApi, projectsApi } from "@/lib/api";
import type { Template } from "@/types";
import {
  Loader2,
  Apple,
  Smartphone,
  Layers,
  ArrowRight,
  LayoutTemplate,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type PlatformFilter = "all" | "ios" | "android";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PlatformFilter>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [projectName, setProjectName] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates", filter],
    queryFn: async () => {
      const response = await templatesApi.getAll(
        filter === "all" ? undefined : filter,
      );
      return response.data.data || [];
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: { templateId: string; name: string }) =>
      projectsApi.create(data),
    onSuccess: (response) => {
      navigate(`/editor/${response.data.data.id}`);
    },
    onError: (error) => {
      console.error("Failed to create project:", error);
    },
  });

  const handleCreateProject = () => {
    if (!selectedTemplate || !projectName.trim()) return;
    createProjectMutation.mutate({
      templateId: selectedTemplate.id,
      name: projectName.trim(),
    });
  };

  const platformFilters: {
    value: PlatformFilter;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      value: "all",
      label: "All Templates",
      icon: <Layers className="w-4 h-4" />,
      color: "slate",
    },
    {
      value: "ios",
      label: "iOS",
      icon: <Apple className="w-4 h-4" />,
      color: "blue",
    },
    {
      value: "android",
      label: "Android",
      icon: <Smartphone className="w-4 h-4" />,
      color: "emerald",
    },
  ];

  const scrollContainer = (id: string, direction: "left" | "right") => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero glow effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(160 84% 39% / 0.15), transparent)",
        }}
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Choose Your Template
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Professional templates designed for App Store and Play Store
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {platformFilters.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
                ${
                  filter === value
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-card text-muted-foreground border border-border hover:border-primary/50 hover:text-foreground"
                }
              `}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <LayoutTemplate className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No templates found
            </h3>
            <p className="text-muted-foreground">
              Try changing the filter to see more templates
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setProjectName(`${template.name} Project`);
                }}
                className={`
                  group relative bg-card border rounded-2xl overflow-hidden cursor-pointer 
                  transition-all duration-200
                  hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50
                  ${
                    selectedTemplate?.id === template.id
                      ? "border-primary ring-2 ring-primary/50 shadow-lg shadow-primary/20"
                      : "border-border"
                  }
                `}
              >
                {selectedTemplate?.id === template.id && (
                  <div className="absolute top-4 right-4 z-20 p-1.5 bg-primary rounded-full shadow-lg shadow-primary/30">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="p-5">
                  {template.thumbnails && template.thumbnails.length > 0 ? (
                    <div className="relative group/scroll -mx-5 px-5">
                      {template.thumbnails.length > 3 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollContainer(`scroll-${template.id}`, "left");
                            }}
                            className="absolute left-7 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full shadow-lg opacity-0 group-hover/scroll:opacity-100 hover:bg-card transition-all"
                          >
                            <ChevronLeft className="w-4 h-4 text-foreground" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollContainer(`scroll-${template.id}`, "right");
                            }}
                            className="absolute right-7 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full shadow-lg opacity-0 group-hover/scroll:opacity-100 hover:bg-card transition-all"
                          >
                            <ChevronRight className="w-4 h-4 text-foreground" />
                          </button>
                        </>
                      )}

                      <div
                        id={`scroll-${template.id}`}
                        className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          WebkitOverflowScrolling: "touch",
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {template.thumbnails.map((thumb, idx) => (
                          <div
                            key={idx}
                            className="relative flex-shrink-0 w-72 aspect-[9/20] rounded-xl overflow-hidden bg-gradient-to-br from-secondary to-muted border border-border shadow-lg hover:shadow-xl transition-shadow"
                          >
                            <img
                              src={thumb}
                              alt={`${template.name} preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2">
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {template.name}
                        </h3>
                        {Array.isArray(template?.jsonConfig?.exports) &&
                          template?.jsonConfig?.exports.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {template.jsonConfig.exports.map(
                                (device: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-secondary text-foreground border border-border"
                                  >
                                    {device.name}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="relative aspect-[16/9] rounded-xl overflow-hidden border border-border shadow-lg"
                      style={{
                        backgroundColor:
                          template.jsonConfig.canvas.backgroundColor,
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                        <div className="text-center">
                          <LayoutTemplate className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No Preview
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTemplate(null)}
              className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Create New Project
              </h2>
              <p className="text-muted-foreground mb-6">
                Using template: {selectedTemplate.name}
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="projectName"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="My Awesome App"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-border">
                  <span
                    className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                    ${
                      selectedTemplate.platform === "ios"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedTemplate.platform === "android"
                          ? "bg-primary/20 text-primary"
                          : "bg-purple-500/20 text-purple-400"
                    }
                  `}
                  >
                    {selectedTemplate.platform === "ios" ? (
                      <Apple className="w-3 h-3" />
                    ) : (
                      <Smartphone className="w-3 h-3" />
                    )}
                    {selectedTemplate.platform === "both"
                      ? "iOS & Android"
                      : selectedTemplate.platform.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 bg-secondary/50 border-t border-border">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 px-4 py-2.5 text-foreground font-medium bg-card border border-border rounded-xl hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={
                  createProjectMutation.isPending || !projectName.trim()
                }
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-primary-foreground font-medium bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25"
              >
                {createProjectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Project
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
