import { create } from 'zustand'
import type { LayerConfig, CanvasConfig, ImageAsset, ExportSize, SlideData } from '@/types'
import { normalizeLayers } from '@/lib/layerUtils'

export interface Slide {
  id: string
  canvas: CanvasConfig
  layers: LayerConfig[]
}

interface EditorState {
  // Project info
  projectName: string
  setProjectName: (name: string) => void
  
  // Slides (multiple template images)
  slides: Slide[]
  setSlides: (slides: Slide[]) => void
  addSlide: () => void
  duplicateSlide: (slideId: string) => void
  deleteSlide: (slideId: string) => void
  
  // Current slide
  currentSlideId: string | null
  setCurrentSlideId: (id: string | null) => void
  
  // Get current slide
  getCurrentSlide: () => Slide | undefined
  
  // Layers in current slide
  updateLayer: (slideId: string, layerId: string, updates: Partial<LayerConfig>) => void
  deleteLayer: (slideId: string, layerId: string) => void
  addLayer: (slideId: string, layer: LayerConfig) => void
  
  // Selection
  selectedLayerId: string | null
  setSelectedLayerId: (id: string | null) => void
  
  // Get selected layer
  getSelectedLayer: () => LayerConfig | undefined
  
  // Images
  images: ImageAsset[]
  addImage: (image: ImageAsset) => void
  
  // Export sizes
  exportSizes: ExportSize[]
  setExportSizes: (sizes: ExportSize[]) => void
  
  // History
  history: Slide[][]
  historyIndex: number
  pushHistory: () => void
  undo: () => void
  redo: () => void
  
  // Dirty state
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
  
  // Device frame settings
  deviceFrame: {
    type: 'none' | 'iphone' | 'android' | 'dynamic'
    orientation: 'portrait' | 'landscape'
    showFrame: boolean
  }
  setDeviceFrame: (frame: Partial<EditorState['deviceFrame']>) => void
  
  reset: () => void
  initialize: (canvas: CanvasConfig, layers: LayerConfig[], images: ImageAsset[], exportSizes: ExportSize[], savedSlides?: SlideData[]) => void
}

const initialState = {
  projectName: '',
  slides: [],
  currentSlideId: null,
  selectedLayerId: null,
  images: [],
  exportSizes: [],
  history: [],
  historyIndex: -1,
  isDirty: false,
  deviceFrame: {
    type: 'dynamic' as const,
    orientation: 'portrait' as const,
    showFrame: true,
  },
}

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,
  
  setProjectName: (projectName) => set({ projectName }),
  
  setSlides: (slides) => set({ slides }),
  
  addSlide: () => {
    const { slides, pushHistory } = get()
    pushHistory()
    
    // Clone the last slide or create a default one
    const lastSlide = slides[slides.length - 1]
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      canvas: lastSlide ? { ...lastSlide.canvas } : { width: 1242, height: 2688, backgroundColor: '#D8E5D8' },
      layers: lastSlide 
        ? lastSlide.layers.map(l => ({ 
            ...l, 
            id: `${l.id}-${Date.now()}`,
            properties: { ...l.properties }
          }))
        : [],
    }
    
    set({ 
      slides: [...slides, newSlide],
      currentSlideId: newSlide.id,
      isDirty: true,
    })
  },
  
  duplicateSlide: (slideId) => {
    const { slides, pushHistory } = get()
    pushHistory()
    
    const slideIndex = slides.findIndex(s => s.id === slideId)
    if (slideIndex === -1) return
    
    const slide = slides[slideIndex]
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      canvas: { ...slide.canvas },
      layers: slide.layers.map(l => ({
        ...l,
        id: `${l.id}-${Date.now()}`,
        properties: { ...l.properties },
      })),
    }
    
    const newSlides = [...slides]
    newSlides.splice(slideIndex + 1, 0, newSlide)
    
    set({ 
      slides: newSlides,
      currentSlideId: newSlide.id,
      isDirty: true,
    })
  },
  
  deleteSlide: (slideId) => {
    const { slides, currentSlideId, pushHistory } = get()
    if (slides.length <= 1) return // Keep at least one slide
    
    pushHistory()
    const newSlides = slides.filter(s => s.id !== slideId)
    
    set({
      slides: newSlides,
      currentSlideId: currentSlideId === slideId ? newSlides[0]?.id : currentSlideId,
      isDirty: true,
    })
  },
  
  setCurrentSlideId: (currentSlideId) => set({ currentSlideId, selectedLayerId: null }),
  
  getCurrentSlide: () => {
    const { slides, currentSlideId } = get()
    return slides.find(s => s.id === currentSlideId)
  },
  
  updateLayer: (slideId, layerId, updates) => {
    const { slides, pushHistory } = get()
    pushHistory()
    
    set({
      slides: slides.map(slide => {
        if (slide.id !== slideId) return slide
        return {
          ...slide,
          layers: slide.layers.map(layer =>
            layer.id === layerId ? { ...layer, ...updates } : layer
          ),
        }
      }),
      isDirty: true,
    })
  },
  
  deleteLayer: (slideId, layerId) => {
    const { slides, selectedLayerId, pushHistory } = get()
    pushHistory()
    
    set({
      slides: slides.map(slide => {
        if (slide.id !== slideId) return slide
        return {
          ...slide,
          layers: slide.layers.filter(layer => layer.id !== layerId),
        }
      }),
      selectedLayerId: selectedLayerId === layerId ? null : selectedLayerId,
      isDirty: true,
    })
  },
  
  addLayer: (slideId, layer) => {
    const { slides, pushHistory } = get()
    pushHistory()
    
    set({
      slides: slides.map(slide => {
        if (slide.id !== slideId) return slide
        return {
          ...slide,
          layers: [...slide.layers, layer],
        }
      }),
      isDirty: true,
    })
  },
  
  setSelectedLayerId: (id) => set({ selectedLayerId: id }),
  
  getSelectedLayer: () => {
    const { slides, currentSlideId, selectedLayerId } = get()
    const currentSlide = slides.find(s => s.id === currentSlideId)
    return currentSlide?.layers.find(l => l.id === selectedLayerId)
  },
  
  addImage: (image) => {
    const { images } = get()
    set({ images: [...images, image], isDirty: true })
  },
  
  setExportSizes: (exportSizes) => set({ exportSizes }),
  
  setDeviceFrame: (frame) => {
    const { deviceFrame } = get()
    set({ deviceFrame: { ...deviceFrame, ...frame }, isDirty: true })
  },
  
  pushHistory: () => {
    const { slides, history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(slides)))
    set({
      history: newHistory.slice(-50),
      historyIndex: newHistory.length - 1,
    })
  },
  
  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      set({
        slides: JSON.parse(JSON.stringify(history[newIndex])),
        historyIndex: newIndex,
        isDirty: true,
      })
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      set({
        slides: JSON.parse(JSON.stringify(history[newIndex])),
        historyIndex: newIndex,
        isDirty: true,
      })
    }
  },
  
  setIsDirty: (isDirty) => set({ isDirty }),
  
  reset: () => set(initialState),
  
  initialize: (canvas, layers, images, exportSizes, savedSlides) => {
    let initialSlides: Slide[]
    
    const normalizedLayers = normalizeLayers(layers)
    
    if (savedSlides && savedSlides.length > 0) {
      initialSlides = savedSlides.map((slide, i) => ({
        id: slide.id || `slide-${Date.now()}-${i}`,
        canvas: { ...slide.canvas },
        layers: normalizeLayers(slide.layers),
      }))
    } else {
      initialSlides = []
      for (let i = 0; i < 5; i++) {
        initialSlides.push({
          id: `slide-${Date.now()}-${i}`,
          canvas: { ...canvas },
          layers: normalizedLayers.map(l => ({
            ...l,
            id: `${l.id}-${i}`,
            properties: { ...l.properties },
          })),
        })
      }
    }
    
    set({
      slides: initialSlides,
      currentSlideId: initialSlides[0]?.id || null,
      selectedLayerId: null,
      images,
      exportSizes,
      history: [JSON.parse(JSON.stringify(initialSlides))],
      historyIndex: 0,
      isDirty: false,
    })
  },
}))
