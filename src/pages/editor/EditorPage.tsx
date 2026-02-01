import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { projectsApi } from "@/lib/api";
import { useEditorStore } from "@/stores/editorStore";
import type { Project, ExportSize } from "@/types";
import TemplateSlide from "@/components/editor/TemplateSlide";
import ConfigPanel from "@/components/editor/ConfigPanel";
import ElementsPanel from "@/components/editor/ElementsPanel";
import {
  Loader2,
  Save,
  Download,
  ArrowLeft,
  RotateCcw,
  Copy,
  Trash2,
  Plus,
  Smartphone,
  Tablet,
  ChevronDown,
  Check,
} from "lucide-react";

const getDeviceKey = (size: ExportSize) =>
  `${size.name}-${size.width}x${size.height}`;

const isTabletDevice = (size: ExportSize) => {
  const nameLower = size.name.toLowerCase();
  const minDim = Math.min(size.width, size.height);
  const aspectRatio = Math.max(size.width, size.height) / Math.max(minDim, 1);
  return (
    nameLower.includes("ipad") ||
    nameLower.includes("tablet") ||
    (minDim >= 1200 && aspectRatio <= 1.9)
  );
};

const DeviceIcon = ({
  size,
  className = "w-4 h-4",
}: {
  size: ExportSize;
  className?: string;
}) => {
  return isTabletDevice(size) ? (
    <Tablet className={className} />
  ) : (
    <Smartphone className={className} />
  );
};

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const deviceDropdownRef = useRef<HTMLDivElement>(null);

  const {
    slides,
    currentSlideId,
    setCurrentSlideId,
    setSelectedLayerId,
    undo,
    historyIndex,
    isDirty,
    setIsDirty,
    initialize,
    duplicateSlide,
    deleteSlide,
    addSlide,
    exportSizes,
    selectedDeviceKey,
    setSelectedDeviceKey,
    deviceConfigs,
  } = useEditorStore();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);

  const currentDevice = useMemo(() => {
    if (!selectedDeviceKey) return null;
    return (
      exportSizes.find((s) => getDeviceKey(s) === selectedDeviceKey) || null
    );
  }, [selectedDeviceKey, exportSizes]);

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const response = await projectsApi.getById(projectId);
        const data = response.data.data as Project;

        setProject(data);

        const exports = data.projectConfig.exports?.length
          ? data.projectConfig.exports
          : data.template?.jsonConfig.exports || [];
        const projectSlides = data.projectConfig.slides?.length
          ? data.projectConfig.slides
          : data.template?.jsonConfig.slides || [];

        initialize(
          data.projectConfig.canvas,
          data.projectConfig.layers,
          data.projectConfig.images || [],
          exports,
          projectSlides,
          data.projectConfig.deviceConfigs,
        );
      } catch (error) {
        console.error("Failed to fetch project:", error);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate, initialize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        deviceDropdownRef.current &&
        !deviceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDeviceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (isMod && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (isMod && e.key === "d") {
        e.preventDefault();
        if (currentSlideId) duplicateSlide(currentSlideId);
      } else if (e.key === "Escape") {
        setSelectedLayerId(null);
        setIsDeviceDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, currentSlideId, duplicateSlide, setSelectedLayerId]);

  const handleSave = useCallback(async () => {
    if (!project || isSaving) return;

    setIsSaving(true);
    try {
      const state = useEditorStore.getState();
      const {
        slides: currentSlides,
        images,
        deviceConfigs: configs,
        selectedDeviceKey: deviceKey,
      } = state;

      const updatedDeviceConfigs = { ...configs };
      if (deviceKey && updatedDeviceConfigs[deviceKey]) {
        updatedDeviceConfigs[deviceKey] = {
          ...updatedDeviceConfigs[deviceKey],
          slides: currentSlides.map((slide) => ({
            id: slide.id,
            canvas: { ...slide.canvas },
            layers: slide.layers.map((l) => ({
              ...l,
              properties: { ...l.properties },
            })),
          })),
          isModified: true,
        };
      }

      const slidesData = currentSlides.map((slide) => ({
        id: slide.id,
        canvas: slide.canvas,
        layers: slide.layers,
      }));

      await projectsApi.update(project.id, {
        projectConfig: {
          canvas: currentSlides[0]?.canvas || {
            width: 1242,
            height: 2688,
            backgroundColor: "#D8E5D8",
          },
          layers: currentSlides[0]?.layers || [],
          images,
          slides: slidesData,
          deviceConfigs: updatedDeviceConfigs,
        },
      });
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setIsSaving(false);
    }
  }, [project, isSaving, setIsDirty]);

  const handleDeviceSelect = useCallback(
    (deviceKey: string) => {
      setSelectedDeviceKey(deviceKey);
      setIsDeviceDropdownOpen(false);
    },
    [setSelectedDeviceKey],
  );

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                {project?.name}
                {isDirty && (
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded text-text-secondary hover:bg-background disabled:opacity-30 transition-colors"
            title="Undo (⌘Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => currentSlideId && duplicateSlide(currentSlideId)}
            className="p-2 rounded text-text-secondary hover:bg-background transition-colors"
            title="Duplicate (⌘D)"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              currentSlideId && slides.length > 1 && deleteSlide(currentSlideId)
            }
            disabled={slides.length <= 1}
            className="p-2 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={deviceDropdownRef}>
            <button
              onClick={() => setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm font-medium text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <DeviceIcon size={currentDevice} className="w-4 h-4" />
              <span className="max-w-[120px] truncate">
                {currentDevice?.name || "Select Device"}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isDeviceDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDeviceDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-600">
                  <p className="text-xs font-medium text-slate-400 px-2 py-1">
                    Preview Device
                  </p>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {exportSizes.map((size) => {
                    const key = getDeviceKey(size);
                    const isSelected = selectedDeviceKey === key;
                    const config = deviceConfigs[key];
                    const isModified = config?.isModified;

                    return (
                      <button
                        key={key}
                        onClick={() => handleDeviceSelect(key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "hover:bg-slate-700 text-white"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg ${isSelected ? "bg-emerald-500/20" : "bg-slate-700"}`}
                        >
                          <DeviceIcon size={size} className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {size.name}
                            </span>
                            {isModified && (
                              <span
                                className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"
                                title="Modified"
                              />
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {size.width} × {size.height}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-border disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>

          <Link
            to={`/export/${projectId}`}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ElementsPanel />

        <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden relative flex flex-col">
          {currentDevice && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm flex items-center gap-2">
              <DeviceIcon
                size={currentDevice}
                className="w-4 h-4 text-slate-600"
              />
              <span className="text-xs font-medium text-slate-700">
                {currentDevice.name}
              </span>
              <span className="text-xs text-slate-500">
                ({currentDevice.width} × {currentDevice.height})
              </span>
            </div>
          )}

          <div className="flex-1 flex items-center gap-2 px-8 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="snap-center flex-shrink-0 h-[calc(100%-30px)]"
                style={{ minWidth: "fit-content" }}
              >
                <TemplateSlide
                  slide={slide}
                  isActive={slide.id === currentSlideId}
                  index={index}
                  onClick={() => setCurrentSlideId(slide.id)}
                />
              </div>
            ))}

            <div className="snap-center flex-shrink-0 h-[calc(100%-30px)] flex items-center">
              <button
                onClick={addSlide}
                className="h-full aspect-[9/19.5] rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-3 bg-slate-100 group-hover:bg-emerald-500/10 rounded-full transition-colors">
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-500 transition-colors">
                  Add Slide
                </span>
              </button>
            </div>
          </div>
        </div>

        <ConfigPanel />
      </div>
    </div>
  );
}
