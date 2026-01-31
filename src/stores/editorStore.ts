import { create } from "zustand";
import type {
  LayerConfig,
  CanvasConfig,
  ImageAsset,
  ExportSize,
  SlideData,
  DeviceConfig,
  DeviceConfigMap,
} from "@/types";
import { normalizeLayers } from "@/lib/layerUtils";

export interface Slide {
  id: string;
  canvas: CanvasConfig;
  layers: LayerConfig[];
}

interface EditorState {
  // Project info
  projectName: string;
  setProjectName: (name: string) => void;

  // Slides (multiple template images)
  slides: Slide[];
  setSlides: (slides: Slide[]) => void;
  addSlide: () => void;
  duplicateSlide: (slideId: string) => void;
  deleteSlide: (slideId: string) => void;

  // Current slide
  currentSlideId: string | null;
  setCurrentSlideId: (id: string | null) => void;

  // Get current slide
  getCurrentSlide: () => Slide | undefined;

  // Layers in current slide
  updateLayer: (
    slideId: string,
    layerId: string,
    updates: Partial<LayerConfig>,
    options?: { pushToHistory?: boolean },
  ) => void;
  deleteLayer: (slideId: string, layerId: string) => void;
  addLayer: (slideId: string, layer: LayerConfig) => void;

  // Selection
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;

  // Get selected layer
  getSelectedLayer: () => LayerConfig | undefined;

  // Images
  images: ImageAsset[];
  addImage: (image: ImageAsset) => void;

  // Export sizes
  exportSizes: ExportSize[];
  setExportSizes: (sizes: ExportSize[]) => void;

  // Device preview mode
  selectedDeviceKey: string | null;
  setSelectedDeviceKey: (key: string | null) => void;
  deviceConfigs: DeviceConfigMap;
  setDeviceConfigs: (configs: DeviceConfigMap) => void;
  getDeviceSlidesForPreview: () => Slide[];
  getCurrentDeviceConfig: () => DeviceConfig | null;
  initializeDeviceConfig: (exportSize: ExportSize, baseSlides: Slide[]) => void;

  // History
  history: Slide[][];
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
    savedSlides?: SlideData[],
    savedDeviceConfigs?: DeviceConfigMap,
  ) => void;
}

const initialState = {
  projectName: "",
  slides: [],
  currentSlideId: null,
  selectedLayerId: null,
  images: [],
  exportSizes: [],
  selectedDeviceKey: null,
  deviceConfigs: {} as DeviceConfigMap,
  history: [],
  historyIndex: -1,
  isDirty: false,
  deviceFrame: {
    type: "dynamic" as const,
    orientation: "portrait" as const,
    showFrame: true,
  },
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  setProjectName: (projectName) => set({ projectName }),

  setSlides: (slides) => set({ slides }),

  addSlide: () => {
    const { slides, pushHistory, selectedDeviceKey, deviceConfigs } = get();
    pushHistory();

    const lastSlide = slides[slides.length - 1];
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      canvas: lastSlide
        ? { ...lastSlide.canvas }
        : { width: 1242, height: 2688, backgroundColor: "#D8E5D8" },
      layers: lastSlide
        ? lastSlide.layers.map((l) => ({
            ...l,
            id: `${l.id}-${Date.now()}`,
            properties: { ...l.properties },
          }))
        : [],
    };

    let updatedDeviceConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedDeviceConfigs[selectedDeviceKey]) {
      const deviceConfig = updatedDeviceConfigs[selectedDeviceKey];
      const lastDeviceSlide =
        deviceConfig.slides[deviceConfig.slides.length - 1];
      const newDeviceSlide = {
        id: newSlide.id,
        canvas: lastDeviceSlide
          ? { ...lastDeviceSlide.canvas }
          : { ...newSlide.canvas },
        layers: lastDeviceSlide
          ? lastDeviceSlide.layers.map((l) => ({
              ...l,
              id: `${l.id}-${Date.now()}`,
              properties: { ...l.properties },
            }))
          : [],
      };
      updatedDeviceConfigs[selectedDeviceKey] = {
        ...deviceConfig,
        slides: [...deviceConfig.slides, newDeviceSlide],
        isModified: true,
      };
    }

    set({
      slides: [...slides, newSlide],
      currentSlideId: newSlide.id,
      deviceConfigs: updatedDeviceConfigs,
      isDirty: true,
    });
  },

  duplicateSlide: (slideId) => {
    const { slides, pushHistory, selectedDeviceKey, deviceConfigs } = get();
    pushHistory();

    const slideIndex = slides.findIndex((s) => s.id === slideId);
    if (slideIndex === -1) return;

    const slide = slides[slideIndex];
    const newSlideId = `slide-${Date.now()}`;
    const newSlide: Slide = {
      id: newSlideId,
      canvas: { ...slide.canvas },
      layers: slide.layers.map((l) => ({
        ...l,
        id: `${l.id}-${Date.now()}`,
        properties: { ...l.properties },
      })),
    };

    const newSlides = [...slides];
    newSlides.splice(slideIndex + 1, 0, newSlide);

    let updatedDeviceConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedDeviceConfigs[selectedDeviceKey]) {
      const deviceConfig = updatedDeviceConfigs[selectedDeviceKey];
      const deviceSlideIndex = deviceConfig.slides.findIndex(
        (s) => s.id === slideId,
      );
      if (deviceSlideIndex !== -1) {
        const deviceSlide = deviceConfig.slides[deviceSlideIndex];
        const newDeviceSlide = {
          id: newSlideId,
          canvas: { ...deviceSlide.canvas },
          layers: deviceSlide.layers.map((l) => ({
            ...l,
            id: `${l.id}-${Date.now()}`,
            properties: { ...l.properties },
          })),
        };
        const newDeviceSlides = [...deviceConfig.slides];
        newDeviceSlides.splice(deviceSlideIndex + 1, 0, newDeviceSlide);
        updatedDeviceConfigs[selectedDeviceKey] = {
          ...deviceConfig,
          slides: newDeviceSlides,
          isModified: true,
        };
      }
    }

    set({
      slides: newSlides,
      currentSlideId: newSlide.id,
      deviceConfigs: updatedDeviceConfigs,
      isDirty: true,
    });
  },

  deleteSlide: (slideId) => {
    const {
      slides,
      currentSlideId,
      pushHistory,
      selectedDeviceKey,
      deviceConfigs,
    } = get();
    if (slides.length <= 1) return;

    pushHistory();
    const newSlides = slides.filter((s) => s.id !== slideId);

    let updatedDeviceConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedDeviceConfigs[selectedDeviceKey]) {
      const deviceConfig = updatedDeviceConfigs[selectedDeviceKey];
      updatedDeviceConfigs[selectedDeviceKey] = {
        ...deviceConfig,
        slides: deviceConfig.slides.filter((s) => s.id !== slideId),
        isModified: true,
      };
    }

    set({
      slides: newSlides,
      currentSlideId:
        currentSlideId === slideId ? newSlides[0]?.id : currentSlideId,
      deviceConfigs: updatedDeviceConfigs,
      isDirty: true,
    });
  },

  setCurrentSlideId: (currentSlideId) =>
    set({ currentSlideId, selectedLayerId: null }),

  getCurrentSlide: () => {
    const { slides, currentSlideId } = get();
    return slides.find((s) => s.id === currentSlideId);
  },

  updateLayer: (slideId, layerId, updates, options) => {
    const { slides, pushHistory } = get();
    const shouldPushHistory = options?.pushToHistory !== false;

    if (shouldPushHistory) {
      pushHistory();
    }

    set({
      slides: slides.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          layers: slide.layers.map((layer) =>
            layer.id === layerId ? { ...layer, ...updates } : layer,
          ),
        };
      }),
      isDirty: true,
    });
  },

  deleteLayer: (slideId, layerId) => {
    const { slides, selectedLayerId, pushHistory } = get();
    pushHistory();

    set({
      slides: slides.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          layers: slide.layers.filter((layer) => layer.id !== layerId),
        };
      }),
      selectedLayerId: selectedLayerId === layerId ? null : selectedLayerId,
      isDirty: true,
    });
  },

  addLayer: (slideId, layer) => {
    const { slides, pushHistory } = get();
    pushHistory();

    set({
      slides: slides.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          layers: [...slide.layers, layer],
        };
      }),
      isDirty: true,
    });
  },

  setSelectedLayerId: (id) => set({ selectedLayerId: id }),

  getSelectedLayer: () => {
    const { slides, currentSlideId, selectedLayerId } = get();
    const currentSlide = slides.find((s) => s.id === currentSlideId);
    return currentSlide?.layers.find((l) => l.id === selectedLayerId);
  },

  addImage: (image) => {
    const { images } = get();
    set({ images: [...images, image], isDirty: true });
  },

  setExportSizes: (exportSizes) => set({ exportSizes }),

  setSelectedDeviceKey: (key) => {
    const { selectedDeviceKey, slides, deviceConfigs } = get();

    if (key === selectedDeviceKey) return;

    const cloneSlides = (slidesArr: Slide[]) =>
      slidesArr.map((slide) => ({
        id: slide.id,
        canvas: { ...slide.canvas },
        layers: slide.layers.map((l) => ({
          ...l,
          properties: { ...l.properties },
        })),
      }));

    let updatedConfigs = { ...deviceConfigs };
    if (selectedDeviceKey && updatedConfigs[selectedDeviceKey]) {
      updatedConfigs[selectedDeviceKey] = {
        ...updatedConfigs[selectedDeviceKey],
        slides: cloneSlides(slides),
        isModified: true,
      };
    }

    if (key && updatedConfigs[key]) {
      const newSlides = cloneSlides(updatedConfigs[key].slides as Slide[]);
      set({
        selectedDeviceKey: key,
        deviceConfigs: updatedConfigs,
        slides: newSlides,
        currentSlideId: newSlides[0]?.id || null,
        selectedLayerId: null,
        isDirty: true,
      });
    } else {
      set({
        selectedDeviceKey: key,
        deviceConfigs: updatedConfigs,
        isDirty: true,
      });
    }
  },

  setDeviceConfigs: (deviceConfigs) => set({ deviceConfigs }),

  getDeviceSlidesForPreview: () => {
    const { selectedDeviceKey, deviceConfigs, slides } = get();
    if (selectedDeviceKey && deviceConfigs[selectedDeviceKey]) {
      return deviceConfigs[selectedDeviceKey].slides.map((slide) => ({
        id: slide.id,
        canvas: { ...slide.canvas },
        layers: slide.layers.map((l) => ({
          ...l,
          properties: { ...l.properties },
        })),
      }));
    }
    return slides;
  },

  getCurrentDeviceConfig: () => {
    const { selectedDeviceKey, deviceConfigs } = get();
    if (selectedDeviceKey && deviceConfigs[selectedDeviceKey]) {
      return deviceConfigs[selectedDeviceKey];
    }
    return null;
  },

  initializeDeviceConfig: (exportSize, baseSlides) => {
    const { deviceConfigs } = get();
    const key = `${exportSize.name}-${exportSize.width}x${exportSize.height}`;

    if (!deviceConfigs[key]) {
      const baseCanvas = baseSlides[0]?.canvas || {
        width: 1242,
        height: 2688,
        backgroundColor: "#D8E5D8",
      };
      const scaleX = exportSize.width / baseCanvas.width;
      const scaleY = exportSize.height / baseCanvas.height;

      const scaledSlides = baseSlides.map((slide) => ({
        id: slide.id,
        canvas: {
          width: exportSize.width,
          height: exportSize.height,
          backgroundColor: slide.canvas.backgroundColor,
        },
        layers: slide.layers.map((layer) => {
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
        }),
      }));

      set({
        deviceConfigs: {
          ...deviceConfigs,
          [key]: {
            exportSize,
            slides: scaledSlides,
            isModified: false,
          },
        },
      });
    }
  },

  setDeviceFrame: (frame) => {
    const { deviceFrame } = get();
    set({ deviceFrame: { ...deviceFrame, ...frame }, isDirty: true });
  },

  pushHistory: () => {
    const { slides, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(slides)));
    set({
      history: newHistory.slice(-50),
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        slides: JSON.parse(JSON.stringify(history[newIndex])),
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        slides: JSON.parse(JSON.stringify(history[newIndex])),
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  setIsDirty: (isDirty) => set({ isDirty }),

  reset: () => set(initialState),

  initialize: (
    canvas,
    layers,
    images,
    exportSizes,
    savedSlides,
    savedDeviceConfigs,
  ) => {
    let initialSlides: Slide[];

    const normalizedLayers = normalizeLayers(layers);

    if (savedSlides && savedSlides.length > 0) {
      initialSlides = savedSlides.map((slide, i) => ({
        id: slide.id || `slide-${Date.now()}-${i}`,
        canvas: { ...slide.canvas },
        layers: normalizeLayers(slide.layers),
      }));
    } else {
      initialSlides = [];
      for (let i = 0; i < 5; i++) {
        initialSlides.push({
          id: `slide-${Date.now()}-${i}`,
          canvas: { ...canvas },
          layers: normalizedLayers.map((l) => ({
            ...l,
            id: `${l.id}-${i}`,
            properties: { ...l.properties },
          })),
        });
      }
    }

    const initialDeviceConfigs: DeviceConfigMap = savedDeviceConfigs || {};

    exportSizes.forEach((exportSize) => {
      const key = `${exportSize.name}-${exportSize.width}x${exportSize.height}`;
      if (!initialDeviceConfigs[key]) {
        const baseCanvas = initialSlides[0]?.canvas || {
          width: 1242,
          height: 2688,
          backgroundColor: "#D8E5D8",
        };
        const scaleX = exportSize.width / baseCanvas.width;
        const scaleY = exportSize.height / baseCanvas.height;

        const scaledSlides = initialSlides.map((slide) => ({
          id: slide.id,
          canvas: {
            width: exportSize.width,
            height: exportSize.height,
            backgroundColor: slide.canvas.backgroundColor,
          },
          layers: slide.layers.map((layer) => {
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
          }),
        }));

        initialDeviceConfigs[key] = {
          exportSize,
          slides: scaledSlides,
          isModified: false,
        };
      }
    });

    const iphoneExport = exportSizes.find(
      (s) =>
        s.name.toLowerCase().includes("iphone") ||
        (s.platform === "ios" && !s.name.toLowerCase().includes("ipad")),
    );
    const defaultExport = iphoneExport || exportSizes[0];
    const defaultDeviceKey = defaultExport
      ? `${defaultExport.name}-${defaultExport.width}x${defaultExport.height}`
      : null;

    const activeSlides =
      defaultDeviceKey && initialDeviceConfigs[defaultDeviceKey]
        ? initialDeviceConfigs[defaultDeviceKey].slides.map((slide) => ({
            id: slide.id,
            canvas: { ...slide.canvas },
            layers: slide.layers.map((l) => ({
              ...l,
              properties: { ...l.properties },
            })),
          }))
        : initialSlides;

    set({
      slides: activeSlides,
      currentSlideId: activeSlides[0]?.id || null,
      selectedLayerId: null,
      images,
      exportSizes,
      deviceConfigs: initialDeviceConfigs,
      selectedDeviceKey: defaultDeviceKey,
      history: [JSON.parse(JSON.stringify(activeSlides))],
      historyIndex: 0,
      isDirty: false,
    });
  },
}));
