import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { projectsApi } from "@/lib/api";
import { useEditorStore } from "@/stores/editorStore";
import { normalizeLayers, normalizeLayerProperties } from "@/lib/layerUtils";
import { preloadFonts } from "@/lib/fonts";
import type {
  Project,
  ExportSize,
  DeviceConfigMap,
  SlideData,
  TextProperties,
} from "@/types";
import TemplateSlide from "@/components/editor/TemplateSlide";
import ConfigPanel from "@/components/editor/ConfigPanel";
import ElementsPanel from "@/components/editor/ElementsPanel";
import DeviceSettingsModal from "@/components/editor/DeviceSettingsModal";
import {
  Loader2,
  Save,
  Download,
  ArrowLeft,
  RotateCcw,
  Smartphone,
  Tablet,
  ChevronDown,
  Check,
  Plus,
  Copy,
  Trash2,
  Settings,
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
  size: ExportSize | null;
  className?: string;
}) => {
  if (!size) return <Smartphone className={className} />;
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
    canvas,
    layers,
    setSelectedLayerId,
    undo,
    historyIndex,
    isDirty,
    setIsDirty,
    initialize,
    exportSizes,
    selectedDeviceKey,
    setSelectedDeviceKey,
    deviceConfigs,
    saveCurrentSlideState,
    currentSlideId,
    setCurrentSlideId,
    getCurrentDeviceSlides,
    addSlide,
    duplicateSlide,
    deleteSlide,
  } = useEditorStore();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [isDeviceSettingsOpen, setIsDeviceSettingsOpen] = useState(false);

  const slides = useMemo(
    () => getCurrentDeviceSlides(),
    [getCurrentDeviceSlides, deviceConfigs, selectedDeviceKey],
  );

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

        let normalizedDeviceConfigs: DeviceConfigMap | undefined = undefined;
        const sourceDeviceConfigs =
          data.projectConfig.deviceConfigs ||
          data.template?.jsonConfig.deviceConfigs;

        if (sourceDeviceConfigs) {
          normalizedDeviceConfigs = {};
          for (const [key, config] of Object.entries(sourceDeviceConfigs)) {
            if (config.slides && config.slides.length > 0) {
              normalizedDeviceConfigs[key] = {
                exportSize: config.exportSize,
                slides: config.slides.map((slide: SlideData) => ({
                  id: slide.id,
                  canvas: { ...slide.canvas },
                  layers: normalizeLayers(slide.layers),
                })),
                isModified: config.isModified,
              };
            } else {
              const oldCanvas = (config as any).canvas || {
                width: config.exportSize.width,
                height: config.exportSize.height,
                backgroundColor: "#FFFFFF",
              };
              const oldLayers = (config as any).layers || [];
              normalizedDeviceConfigs[key] = {
                exportSize: config.exportSize,
                slides: [
                  {
                    id: `slide-${key.replace(/[^a-z0-9]/gi, "-")}-0`,
                    canvas: { ...oldCanvas },
                    layers: normalizeLayers(oldLayers),
                  },
                ],
                isModified: config.isModified,
              };
            }
          }
        }

        initialize(
          data.projectConfig.canvas,
          normalizeLayers(data.projectConfig.layers),
          data.projectConfig.images || [],
          exports,
          normalizedDeviceConfigs,
        );

        const fontsToLoad = new Set<string>();

        if (normalizedDeviceConfigs) {
          Object.values(normalizedDeviceConfigs).forEach((config) => {
            config.slides.forEach((slide) => {
              slide.layers
                .filter((l) => l.type === "text")
                .forEach((l) => {
                  const props = normalizeLayerProperties<TextProperties>(
                    l.properties,
                  );
                  if (props.fontFamily) {
                    fontsToLoad.add(props.fontFamily);
                  }
                });
            });
          });
        }

        normalizeLayers(data.projectConfig.layers)
          .filter((l) => l.type === "text")
          .forEach((l) => {
            const props = normalizeLayerProperties<TextProperties>(
              l.properties,
            );
            if (props.fontFamily) {
              fontsToLoad.add(props.fontFamily);
            }
          });

        if (fontsToLoad.size > 0) {
          preloadFonts(Array.from(fontsToLoad)).catch((err) => {
            console.warn("Failed to preload some fonts:", err);
          });
        }
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
      } else if (e.key === "Escape") {
        setSelectedLayerId(null);
        setIsDeviceDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, setSelectedLayerId]);

  const handleSave = useCallback(async () => {
    if (!project || isSaving) return;

    setIsSaving(true);
    try {
      saveCurrentSlideState();

      const state = useEditorStore.getState();
      const {
        canvas: currentCanvas,
        layers: currentLayers,
        images,
        deviceConfigs: configs,
        exportSizes: currentExportSizes,
      } = state;

      const updatedDeviceConfigs: DeviceConfigMap = {};
      for (const [key, config] of Object.entries(configs)) {
        updatedDeviceConfigs[key] = {
          exportSize: { ...config.exportSize },
          slides: config.slides.map((slide) => ({
            id: slide.id,
            canvas: { ...slide.canvas },
            layers: slide.layers.map((l) => ({
              ...l,
              properties: { ...l.properties },
            })),
          })),
          isModified: config.isModified,
        };
      }

      const iphoneKey = Object.keys(updatedDeviceConfigs).find(
        (k) =>
          k.toLowerCase().includes("iphone") ||
          (k.toLowerCase().includes("ios") &&
            !k.toLowerCase().includes("ipad")),
      );
      const baseConfig =
        iphoneKey && updatedDeviceConfigs[iphoneKey].slides[0]
          ? updatedDeviceConfigs[iphoneKey].slides[0]
          : { canvas: currentCanvas, layers: currentLayers };

      await projectsApi.update(project.id, {
        projectConfig: {
          canvas: baseConfig.canvas,
          layers: baseConfig.layers,
          images,
          exports: currentExportSizes,
          deviceConfigs: updatedDeviceConfigs,
        },
      });
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setIsSaving(false);
    }
  }, [project, isSaving, setIsDirty, saveCurrentSlideState]);

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

        {/* <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded text-text-secondary hover:bg-background disabled:opacity-30 transition-colors"
            title="Undo (⌘Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div> */}

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDeviceSettingsOpen(true)}
            className="p-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Device Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

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
                className={`w-4 h-4 transition-transform ${
                  isDeviceDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDeviceDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-gradient-to-b from-slate-800 to-slate-800/95 border border-slate-700/40 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden backdrop-blur-xl">
                {/* Compact Header */}
                <div className="relative px-4 py-2.5 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/50 to-slate-700/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
                  <p className="relative text-xs font-bold text-slate-200 tracking-wide uppercase">
                    Select Device
                  </p>
                </div>

                {/* Compact Scrollable List - Hidden Scrollbar */}
                <div className="max-h-[280px] overflow-y-auto p-2.5 space-y-1.5 scrollbar-hide">
                  <style>{`
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>

                  {exportSizes.map((size) => {
                    const key = getDeviceKey(size);
                    const isSelected = selectedDeviceKey === key;
                    const config = deviceConfigs[key];
                    const isModified = config?.isModified;

                    return (
                      <button
                        key={key}
                        onClick={() => handleDeviceSelect(key)}
                        className={`
            group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left 
            transition-all duration-300 ease-out relative overflow-hidden
            transform hover:scale-[1.02] active:scale-[0.98]
            ${
              isSelected
                ? "bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-400 shadow-lg shadow-emerald-500/20 border border-emerald-500/30"
                : "hover:bg-gradient-to-r hover:from-slate-700/70 hover:via-slate-700/40 hover:to-transparent text-slate-200 border border-transparent hover:border-slate-600/30"
            }
          `}
                      >
                        {/* Animated Background Glow */}
                        <div
                          className={`
            absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
            ${
              isSelected
                ? "bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.1),transparent_70%)]"
                : "bg-[radial-gradient(circle_at_0%_50%,_rgba(148,163,184,0.08),transparent_50%)]"
            }
          `}
                        />

                        {/* Shine Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                        {/* Compact Icon Container */}
                        <div
                          className={`
              relative p-2 rounded-lg transition-all duration-300 flex-shrink-0
              ${
                isSelected
                  ? "bg-emerald-500/25 shadow-md shadow-emerald-500/30 ring-1 ring-emerald-500/20"
                  : "bg-slate-700/90 group-hover:bg-slate-600/90"
              }
            `}
                        >
                          <DeviceIcon
                            size={size}
                            className={`w-4 h-4 transition-all duration-300 ${
                              isSelected
                                ? "scale-110 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                                : "group-hover:scale-110 group-hover:rotate-3"
                            }`}
                          />
                        </div>

                        {/* Compact Content */}
                        <div className="flex-1 min-w-0 relative z-10">
                          <div className="flex items-center gap-2">
                            <span
                              className={`
                text-sm font-bold truncate transition-all duration-300
                ${
                  isSelected
                    ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    : "text-white group-hover:text-slate-50"
                }
              `}
                            >
                              {size.name}
                            </span>
                            {isModified && (
                              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500 shadow-sm shadow-amber-500/50"></span>
                              </span>
                            )}
                          </div>
                          <span
                            className={`
              text-[11px] font-semibold transition-all duration-300
              ${
                isSelected
                  ? "text-emerald-400/70"
                  : "text-slate-400 group-hover:text-slate-300"
              }
            `}
                          >
                            {size.width} × {size.height}
                          </span>
                        </div>

                        {/* Compact Check Icon */}
                        {isSelected && (
                          <div className="relative z-10 flex-shrink-0">
                            <div className="p-1 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 shadow-md shadow-emerald-500/30 ring-1 ring-emerald-500/30">
                              <Check
                                className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.6)]"
                                strokeWidth={3}
                              />
                            </div>
                          </div>
                        )}

                        {/* Hover Indicator */}
                        <div
                          className={`
            absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-2/3 rounded-r-full transition-all duration-300
            ${isSelected ? "bg-emerald-500" : "bg-slate-500"}
          `}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Subtle Bottom Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-800 to-transparent pointer-events-none" />
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
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="h-full flex items-center gap-3 px-8 py-3 min-w-max">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`relative flex-shrink-0 h-full transition-all ${
                    currentSlideId === slide.id &&
                    "ring-2 ring-emerald-500 ring-offset-4 ring-offset-slate-200 rounded-lg"
                  }`}
                  onClick={() => setCurrentSlideId(slide.id)}
                >
                  <TemplateSlide
                    canvas={currentSlideId === slide.id ? canvas : slide.canvas}
                    layers={currentSlideId === slide.id ? layers : slide.layers}
                    isActive={currentSlideId === slide.id}
                    onClick={() => {
                      setCurrentSlideId(slide.id);
                      setSelectedLayerId(null);
                    }}
                  />

                  {currentSlideId !== slide.id && (
                    <div className="absolute inset-0 z-50 bg-black/0 hover:bg-black/40 transition-all rounded-lg flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSlide(slide.id);
                        }}
                        className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white shadow-lg"
                        title="Duplicate"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      {slides.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSlide(slide.id);
                          }}
                          className="p-3 bg-red-500 hover:bg-red-600 rounded-xl text-white shadow-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div
                onClick={addSlide}
                className="flex-shrink-0 h-[calc(100%-10px)] aspect-[9/19.5] rounded-xl border-4 border-dashed border-slate-400 hover:border-emerald-500 bg-white/50 hover:bg-emerald-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-slate-200 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Plus className="w-8 h-8 text-slate-500" />
                </div>
                <span className="text-sm font-semibold text-slate-500">
                  Add Slide
                </span>
              </div>
            </div>
          </div>
        </div>
        <ConfigPanel />
      </div>

      <DeviceSettingsModal
        isOpen={isDeviceSettingsOpen}
        onClose={() => setIsDeviceSettingsOpen(false)}
      />
    </div>
  );
}
