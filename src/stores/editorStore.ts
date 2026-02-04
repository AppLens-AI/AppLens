import { create } from "zustand";
import type {
  LayerConfig,
  CanvasConfig,
  ImageAsset,
  ExportSize,
  DeviceConfig,
  DeviceConfigMap,
  SlideData,
} from "@/types";
import { normalizeLayers } from "@/lib/layerUtils";

interface EditorState {
  // Project info
  projectName: string;
  setProjectName: (name: string) => void;

  // Current slide's canvas and layers (derived from device + slide)
  canvas: CanvasConfig;
  layers: LayerConfig[];
  setCanvas: (canvas: CanvasConfig) => void;
  setLayers: (layers: LayerConfig[]) => void;

  // Layer operations
  updateLayer: (
    layerId: string,
    updates: Partial<LayerConfig>,
    options?: { pushToHistory?: boolean }
  ) => void;
  deleteLayer: (layerId: string) => void;
  addLayer: (layer: LayerConfig) => void;

  // Selection
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  getSelectedLayer: () => LayerConfig | undefined;

  // Images
  images: ImageAsset[];
  addImage: (image: ImageAsset) => void;

  // Export sizes
  exportSizes: ExportSize[];
  setExportSizes: (sizes: ExportSize[]) => void;

  // Device management
  selectedDeviceKey: string | null;
  setSelectedDeviceKey: (key: string | null) => void;
  deviceConfigs: DeviceConfigMap;
  setDeviceConfigs: (configs: DeviceConfigMap) => void;
  getCurrentDeviceConfig: () => DeviceConfig | null;
  saveCurrentSlideState: () => void;

  // Slide management (per device)
  currentSlideId: string | null;
  setCurrentSlideId: (slideId: string | null) => void;
  getCurrentSlideIndex: () => number;
  getCurrentDeviceSlides: () => SlideData[];
  addSlide: () => void;
  duplicateSlide: (slideId: string) => void;
  deleteSlide: (slideId: string) => void;

  // History
  history: { canvas: CanvasConfig; layers: LayerConfig[] }[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Dirty state
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;

  // Device frame settings
  deviceFrame: {
    type: "none" | "iphone" | "android" | "dynamic";
    orientation: "portrait" | "landscape";
    showFrame: boolean;
  };
  setDeviceFrame: (frame: Partial<EditorState["deviceFrame"]>) => void;

  reset: () => void;
  initialize: (
    canvas: CanvasConfig,
    layers: LayerConfig[],
    images: ImageAsset[],
    exportSizes: ExportSize[],
    savedDeviceConfigs?: DeviceConfigMap
  ) => void;
}

const DEFAULT_CANVAS: CanvasConfig = {
  width: 1242,
  height: 2688,
  backgroundColor: "#D8E5D8",
};

const initialState = {
  projectName: "",
  canvas: { ...DEFAULT_CANVAS },
  layers: [] as LayerConfig[],
  selectedLayerId: null,
  images: [] as ImageAsset[],
  exportSizes: [] as ExportSize[],
  selectedDeviceKey: null,
  deviceConfigs: {} as DeviceConfigMap,
  currentSlideId: null,
  history: [] as { canvas: CanvasConfig; layers: LayerConfig[] }[],
  historyIndex: -1,
  isDirty: false,
  deviceFrame: {
    type: "dynamic" as const,
    orientation: "portrait" as const,
    showFrame: true,
  },
};

// Helper to deep clone layers
const cloneLayers = (layers: LayerConfig[]): LayerConfig[] =>
  layers.map((l) => ({
    ...l,
    properties: { ...l.properties },
  }));

// Generate unique slide ID
const generateSlideId = (deviceKey: string, index: number): string => {
  const sanitizedKey = deviceKey.replace(/[^a-z0-9]/gi, "-");
  return `slide-${sanitizedKey}-${Date.now()}-${index}`;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  setProjectName: (projectName) => set({ projectName }),

  setCanvas: (canvas) => set({ canvas, isDirty: true }),

  setLayers: (layers) => {
    const { selectedDeviceKey, deviceConfigs, currentSlideId, canvas } = get();

    // Update current slide in device config
    let updatedDeviceConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedDeviceConfigs[selectedDeviceKey] && currentSlideId) {
      const config = updatedDeviceConfigs[selectedDeviceKey];
      const updatedSlides = config.slides.map((slide) =>
        slide.id === currentSlideId
          ? { ...slide, canvas: { ...canvas }, layers: cloneLayers(layers) }
          : slide
      );
      updatedDeviceConfigs[selectedDeviceKey] = {
        ...config,
        slides: updatedSlides,
        isModified: true,
      };
    }

    set({ layers, deviceConfigs: updatedDeviceConfigs, isDirty: true });
  },

  updateLayer: (layerId, updates, options) => {
    const { layers, pushHistory, selectedDeviceKey, deviceConfigs, currentSlideId, canvas } = get();
    const shouldPushHistory = options?.pushToHistory !== false;

    if (shouldPushHistory) {
      pushHistory();
    }

    const updatedLayers = layers.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );

    // Update current slide in device config
    let updatedDeviceConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedDeviceConfigs[selectedDeviceKey] && currentSlideId) {
      const config = updatedDeviceConfigs[selectedDeviceKey];
      const updatedSlides = config.slides.map((slide) =>
        slide.id === currentSlideId
          ? { ...slide, canvas: { ...canvas }, layers: cloneLayers(updatedLayers) }
          : slide
      );
      updatedDeviceConfigs[selectedDeviceKey] = {
        ...config,
        slides: updatedSlides,
        isModified: true,
      };
    }

    set({
      layers: updatedLayers,
      deviceConfigs: updatedDeviceConfigs,
      isDirty: true,
    });
  },

  deleteLayer: (layerId) => {
    const { layers, selectedLayerId, pushHistory, selectedDeviceKey, deviceConfigs, currentSlideId, canvas } = get();
    pushHistory();

    const updatedLayers = layers.filter((layer) => layer.id !== layerId);

    // Update current slide in device config
    let updatedDeviceConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedDeviceConfigs[selectedDeviceKey] && currentSlideId) {
      const config = updatedDeviceConfigs[selectedDeviceKey];
      const updatedSlides = config.slides.map((slide) =>
        slide.id === currentSlideId
          ? { ...slide, canvas: { ...canvas }, layers: cloneLayers(updatedLayers) }
          : slide
      );
      updatedDeviceConfigs[selectedDeviceKey] = {
        ...config,
        slides: updatedSlides,
        isModified: true,
      };
    }

    set({
      layers: updatedLayers,
      deviceConfigs: updatedDeviceConfigs,
      selectedLayerId: selectedLayerId === layerId ? null : selectedLayerId,
      isDirty: true,
    });
  },

  addLayer: (layer) => {
    const { layers, pushHistory, selectedDeviceKey, deviceConfigs, currentSlideId, canvas } = get();
    pushHistory();

    const updatedLayers = [...layers, layer];

    // Update current slide in device config
    let updatedDeviceConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedDeviceConfigs[selectedDeviceKey] && currentSlideId) {
      const config = updatedDeviceConfigs[selectedDeviceKey];
      const updatedSlides = config.slides.map((slide) =>
        slide.id === currentSlideId
          ? { ...slide, canvas: { ...canvas }, layers: cloneLayers(updatedLayers) }
          : slide
      );
      updatedDeviceConfigs[selectedDeviceKey] = {
        ...config,
        slides: updatedSlides,
        isModified: true,
      };
    }

    set({
      layers: updatedLayers,
      deviceConfigs: updatedDeviceConfigs,
      isDirty: true,
    });
  },

  setSelectedLayerId: (id) => set({ selectedLayerId: id }),

  getSelectedLayer: () => {
    const { layers, selectedLayerId } = get();
    return layers.find((l) => l.id === selectedLayerId);
  },

  addImage: (image) => {
    const { images } = get();
    set({ images: [...images, image], isDirty: true });
  },

  setExportSizes: (exportSizes) => set({ exportSizes }),

  // Slide management methods
  getCurrentSlideIndex: () => {
    const { selectedDeviceKey, deviceConfigs, currentSlideId } = get();
    if (!selectedDeviceKey || !deviceConfigs[selectedDeviceKey] || !currentSlideId) return 0;
    const slides = deviceConfigs[selectedDeviceKey].slides;
    const index = slides.findIndex((s) => s.id === currentSlideId);
    return index >= 0 ? index : 0;
  },

  getCurrentDeviceSlides: () => {
    const { selectedDeviceKey, deviceConfigs } = get();
    if (!selectedDeviceKey || !deviceConfigs[selectedDeviceKey]) return [];
    return deviceConfigs[selectedDeviceKey].slides;
  },

  setCurrentSlideId: (slideId) => {
    const { selectedDeviceKey, deviceConfigs, canvas, layers, currentSlideId } = get();

    if (slideId === currentSlideId) return;

    // Save current slide state before switching
    let updatedConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedConfigs[selectedDeviceKey] && currentSlideId) {
      const config = updatedConfigs[selectedDeviceKey];
      const updatedSlides = config.slides.map((slide) =>
        slide.id === currentSlideId
          ? { ...slide, canvas: { ...canvas }, layers: cloneLayers(layers) }
          : slide
      );
      updatedConfigs[selectedDeviceKey] = {
        ...config,
        slides: updatedSlides,
        isModified: true,
      };
    }

    // Load new slide state
    if (slideId && selectedDeviceKey && updatedConfigs[selectedDeviceKey]) {
      const newSlide = updatedConfigs[selectedDeviceKey].slides.find((s) => s.id === slideId);
      if (newSlide) {
        set({
          currentSlideId: slideId,
          deviceConfigs: updatedConfigs,
          canvas: { ...newSlide.canvas },
          layers: cloneLayers(newSlide.layers),
          selectedLayerId: null,
          isDirty: true,
        });
        return;
      }
    }

    set({
      currentSlideId: slideId,
      deviceConfigs: updatedConfigs,
      isDirty: true,
    });
  },

  addSlide: () => {
    const { selectedDeviceKey, deviceConfigs, canvas, layers, currentSlideId, pushHistory } = get();
    if (!selectedDeviceKey || !deviceConfigs[selectedDeviceKey]) return;

    pushHistory();

    const config = deviceConfigs[selectedDeviceKey];
    const newSlideId = generateSlideId(selectedDeviceKey, config.slides.length);

    // Create new slide with empty layers but same canvas settings
    const newSlide: SlideData = {
      id: newSlideId,
      canvas: { ...config.exportSize, backgroundColor: canvas.backgroundColor } as CanvasConfig,
      layers: [],
    };

    // Save current slide and add new one
    const updatedSlides = config.slides.map((slide) =>
      slide.id === currentSlideId
        ? { ...slide, canvas: { ...canvas }, layers: cloneLayers(layers) }
        : slide
    );
    updatedSlides.push(newSlide);

    const updatedConfigs = {
      ...deviceConfigs,
      [selectedDeviceKey]: {
        ...config,
        slides: updatedSlides,
        isModified: true,
      },
    };

    // Switch to new slide
    set({
      deviceConfigs: updatedConfigs,
      currentSlideId: newSlideId,
      canvas: { ...newSlide.canvas },
      layers: [],
      selectedLayerId: null,
      isDirty: true,
    });
  },

  duplicateSlide: (slideId) => {
    const { selectedDeviceKey, deviceConfigs, canvas, layers, currentSlideId, pushHistory } = get();
    if (!selectedDeviceKey || !deviceConfigs[selectedDeviceKey]) return;

    pushHistory();

    const config = deviceConfigs[selectedDeviceKey];
    const sourceSlide = config.slides.find((s) => s.id === slideId);
    if (!sourceSlide) return;

    const newSlideId = generateSlideId(selectedDeviceKey, config.slides.length);

    // Create duplicate with new layer IDs
    const duplicatedSlide: SlideData = {
      id: newSlideId,
      canvas: { ...sourceSlide.canvas },
      layers: sourceSlide.layers.map((layer) => ({
        ...layer,
        id: `${layer.id}-dup-${Date.now()}`,
        properties: { ...layer.properties },
      })),
    };

    // Save current slide and add duplicate
    const slideIndex = config.slides.findIndex((s) => s.id === slideId);
    const updatedSlides = config.slides.map((slide) =>
      slide.id === currentSlideId
        ? { ...slide, canvas: { ...canvas }, layers: cloneLayers(layers) }
        : slide
    );
    // Insert after the source slide
    updatedSlides.splice(slideIndex + 1, 0, duplicatedSlide);

    const updatedConfigs = {
      ...deviceConfigs,
      [selectedDeviceKey]: {
        ...config,
        slides: updatedSlides,
        isModified: true,
      },
    };

    // Switch to duplicated slide
    set({
      deviceConfigs: updatedConfigs,
      currentSlideId: newSlideId,
      canvas: { ...duplicatedSlide.canvas },
      layers: cloneLayers(duplicatedSlide.layers),
      selectedLayerId: null,
      isDirty: true,
    });
  },

  deleteSlide: (slideId) => {
    const { selectedDeviceKey, deviceConfigs, currentSlideId, pushHistory } = get();
    if (!selectedDeviceKey || !deviceConfigs[selectedDeviceKey]) return;

    const config = deviceConfigs[selectedDeviceKey];
    if (config.slides.length <= 1) return; // Don't delete last slide

    pushHistory();

    const slideIndex = config.slides.findIndex((s) => s.id === slideId);
    const updatedSlides = config.slides.filter((s) => s.id !== slideId);

    const updatedConfigs = {
      ...deviceConfigs,
      [selectedDeviceKey]: {
        ...config,
        slides: updatedSlides,
        isModified: true,
      },
    };

    // If deleting current slide, switch to adjacent slide
    let newCurrentSlideId = currentSlideId;
    let newCanvas = get().canvas;
    let newLayers = get().layers;

    if (slideId === currentSlideId) {
      // Select previous slide, or next if first was deleted
      const newIndex = Math.max(0, slideIndex - 1);
      const newSlide = updatedSlides[newIndex];
      newCurrentSlideId = newSlide.id;
      newCanvas = { ...newSlide.canvas };
      newLayers = cloneLayers(newSlide.layers);
    }

    set({
      deviceConfigs: updatedConfigs,
      currentSlideId: newCurrentSlideId,
      canvas: newCanvas,
      layers: newLayers,
      selectedLayerId: null,
      isDirty: true,
    });
  },

  saveCurrentSlideState: () => {
    const { selectedDeviceKey, deviceConfigs, canvas, layers, currentSlideId } = get();
    if (!selectedDeviceKey || !deviceConfigs[selectedDeviceKey] || !currentSlideId) return;

    const config = deviceConfigs[selectedDeviceKey];
    const updatedSlides = config.slides.map((slide) =>
      slide.id === currentSlideId
        ? { ...slide, canvas: { ...canvas }, layers: cloneLayers(layers) }
        : slide
    );

    const updatedDeviceConfigs = {
      ...deviceConfigs,
      [selectedDeviceKey]: {
        ...config,
        slides: updatedSlides,
        isModified: true,
      },
    };

    set({ deviceConfigs: updatedDeviceConfigs });
  },

  setSelectedDeviceKey: (key) => {
    const { selectedDeviceKey, canvas, layers, deviceConfigs, currentSlideId } = get();

    if (key === selectedDeviceKey) return;

    // Save current slide to current device config before switching
    let updatedConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedConfigs[selectedDeviceKey] && currentSlideId) {
      const config = updatedConfigs[selectedDeviceKey];
      const updatedSlides = config.slides.map((slide) =>
        slide.id === currentSlideId
          ? { ...slide, canvas: { ...canvas }, layers: cloneLayers(layers) }
          : slide
      );
      updatedConfigs[selectedDeviceKey] = {
        ...config,
        slides: updatedSlides,
        isModified: true,
      };
    }

    // Load the new device's first slide
    if (key && updatedConfigs[key]) {
      const newConfig = updatedConfigs[key];
      const firstSlide = newConfig.slides[0];
      if (firstSlide) {
        set({
          selectedDeviceKey: key,
          deviceConfigs: updatedConfigs,
          currentSlideId: firstSlide.id,
          canvas: { ...firstSlide.canvas },
          layers: cloneLayers(firstSlide.layers),
          selectedLayerId: null,
          isDirty: true,
        });
        return;
      }
    }

    set({
      selectedDeviceKey: key,
      deviceConfigs: updatedConfigs,
      currentSlideId: null,
      isDirty: true,
    });
  },

  setDeviceConfigs: (deviceConfigs) => set({ deviceConfigs }),

  getCurrentDeviceConfig: () => {
    const { selectedDeviceKey, deviceConfigs } = get();
    if (selectedDeviceKey && deviceConfigs[selectedDeviceKey]) {
      return deviceConfigs[selectedDeviceKey];
    }
    return null;
  },

  setDeviceFrame: (frame) => {
    const { deviceFrame } = get();
    set({ deviceFrame: { ...deviceFrame, ...frame }, isDirty: true });
  },

  pushHistory: () => {
    const { canvas, layers, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      canvas: { ...canvas },
      layers: cloneLayers(layers),
    });
    set({
      history: newHistory.slice(-50),
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex, selectedDeviceKey, deviceConfigs, currentSlideId } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];

      // Update current slide in device config
      let updatedDeviceConfigs = { ...deviceConfigs };
      if (selectedDeviceKey && updatedDeviceConfigs[selectedDeviceKey] && currentSlideId) {
        const config = updatedDeviceConfigs[selectedDeviceKey];
        const updatedSlides = config.slides.map((slide) =>
          slide.id === currentSlideId
            ? { ...slide, canvas: { ...state.canvas }, layers: cloneLayers(state.layers) }
            : slide
        );
        updatedDeviceConfigs[selectedDeviceKey] = {
          ...config,
          slides: updatedSlides,
          isModified: true,
        };
      }

      set({
        canvas: { ...state.canvas },
        layers: cloneLayers(state.layers),
        historyIndex: newIndex,
        deviceConfigs: updatedDeviceConfigs,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex, selectedDeviceKey, deviceConfigs, currentSlideId } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];

      // Update current slide in device config
      let updatedDeviceConfigs = { ...deviceConfigs };
      if (selectedDeviceKey && updatedDeviceConfigs[selectedDeviceKey] && currentSlideId) {
        const config = updatedDeviceConfigs[selectedDeviceKey];
        const updatedSlides = config.slides.map((slide) =>
          slide.id === currentSlideId
            ? { ...slide, canvas: { ...state.canvas }, layers: cloneLayers(state.layers) }
            : slide
        );
        updatedDeviceConfigs[selectedDeviceKey] = {
          ...config,
          slides: updatedSlides,
          isModified: true,
        };
      }

      set({
        canvas: { ...state.canvas },
        layers: cloneLayers(state.layers),
        historyIndex: newIndex,
        deviceConfigs: updatedDeviceConfigs,
        isDirty: true,
      });
    }
  },

  setIsDirty: (isDirty) => set({ isDirty }),

  reset: () => set(initialState),

  initialize: (
    baseCanvas,
    baseLayers,
    images,
    exportSizes,
    savedDeviceConfigs
  ) => {
    const normalizedLayers = normalizeLayers(baseLayers);

    // Build device configs from saved or create new ones
    const initialDeviceConfigs: DeviceConfigMap = {};

    exportSizes.forEach((exportSize) => {
      const key = `${exportSize.name}-${exportSize.width}x${exportSize.height}`;

      if (savedDeviceConfigs && savedDeviceConfigs[key]) {
        // Use saved device config - it should already have slides array
        const savedConfig = savedDeviceConfigs[key];
        
        // Handle both old format (canvas/layers) and new format (slides)
        if (savedConfig.slides && savedConfig.slides.length > 0) {
          // New format with slides
          initialDeviceConfigs[key] = {
            exportSize: { ...savedConfig.exportSize },
            slides: savedConfig.slides.map((slide) => ({
              id: slide.id,
              canvas: { ...slide.canvas },
              layers: normalizeLayers(slide.layers),
            })),
            isModified: savedConfig.isModified,
          };
        } else {
          // Old format - convert to slides (backward compatibility)
          const oldCanvas = (savedConfig as any).canvas || {
            width: exportSize.width,
            height: exportSize.height,
            backgroundColor: baseCanvas.backgroundColor,
          };
          const oldLayers = (savedConfig as any).layers || [];
          
          // Create 4 slides from the old format
          const slides: SlideData[] = [];
          for (let i = 0; i < 4; i++) {
            slides.push({
              id: generateSlideId(key, i),
              canvas: { ...oldCanvas },
              layers: normalizeLayers(oldLayers).map((layer) => ({
                ...layer,
                id: `${layer.id}-${i}`,
              })),
            });
          }
          
          initialDeviceConfigs[key] = {
            exportSize: { ...savedConfig.exportSize },
            slides,
            isModified: savedConfig.isModified,
          };
        }
      } else {
        // Create new device config with 4 slides
        const scaleX = exportSize.width / baseCanvas.width;
        const scaleY = exportSize.height / baseCanvas.height;

        const scaledLayers = normalizedLayers.map((layer) => {
          const props = layer.properties as any;
          return {
            ...layer,
            x: Math.round(layer.x * scaleX),
            y: Math.round(layer.y * scaleY),
            width: Math.round(layer.width * scaleX),
            height: Math.round(layer.height * scaleY),
            properties: {
              ...props,
              fontSize: props.fontSize
                ? Math.round(props.fontSize * Math.min(scaleX, scaleY))
                : props.fontSize,
              offsetX: props.offsetX
                ? Math.round(props.offsetX * scaleX)
                : props.offsetX,
              offsetY:
                props.offsetY !== undefined
                  ? Math.round(props.offsetY * scaleY)
                  : props.offsetY,
              borderRadius: props.borderRadius
                ? Math.round(props.borderRadius * Math.min(scaleX, scaleY))
                : props.borderRadius,
              shadowBlur: props.shadowBlur
                ? Math.round(props.shadowBlur * Math.min(scaleX, scaleY))
                : props.shadowBlur,
              shadowOffsetX: props.shadowOffsetX
                ? Math.round(props.shadowOffsetX * scaleX)
                : props.shadowOffsetX,
              shadowOffsetY: props.shadowOffsetY
                ? Math.round(props.shadowOffsetY * scaleY)
                : props.shadowOffsetY,
            },
          };
        });

        const deviceCanvas: CanvasConfig = {
          width: exportSize.width,
          height: exportSize.height,
          backgroundColor: baseCanvas.backgroundColor,
        };

        // Create 4 slides for this device
        const slides: SlideData[] = [];
        for (let i = 0; i < 4; i++) {
          slides.push({
            id: generateSlideId(key, i),
            canvas: { ...deviceCanvas },
            layers: scaledLayers.map((layer) => ({
              ...layer,
              id: `${layer.id}-${i}`,
              properties: { ...layer.properties },
            })),
          });
        }

        initialDeviceConfigs[key] = {
          exportSize,
          slides,
          isModified: false,
        };
      }
    });

    // Select default device (prefer iPhone)
    const iphoneExport = exportSizes.find(
      (s) =>
        s.name.toLowerCase().includes("iphone") ||
        (s.platform === "ios" && !s.name.toLowerCase().includes("ipad"))
    );
    const defaultExport = iphoneExport || exportSizes[0];
    const defaultDeviceKey = defaultExport
      ? `${defaultExport.name}-${defaultExport.width}x${defaultExport.height}`
      : null;

    // Get the active canvas/layers from the default device's first slide
    const activeConfig = defaultDeviceKey
      ? initialDeviceConfigs[defaultDeviceKey]
      : null;
    const firstSlide = activeConfig?.slides[0];

    const activeCanvas = firstSlide?.canvas || baseCanvas;
    const activeLayers = firstSlide?.layers || normalizedLayers;
    const activeSlideId = firstSlide?.id || null;

    set({
      canvas: { ...activeCanvas },
      layers: cloneLayers(activeLayers),
      selectedLayerId: null,
      images,
      exportSizes,
      deviceConfigs: initialDeviceConfigs,
      selectedDeviceKey: defaultDeviceKey,
      currentSlideId: activeSlideId,
      history: [
        {
          canvas: { ...activeCanvas },
          layers: cloneLayers(activeLayers),
        },
      ],
      historyIndex: 0,
      isDirty: false,
    });
  },
}));
