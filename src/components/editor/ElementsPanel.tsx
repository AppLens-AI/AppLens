import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { useEditorStore } from '@/stores/editorStore'
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Image,
  Square,
  Smartphone,
  Trash2,
  ChevronDown,
  Plus,
  Sparkles,
  X,
  GripVertical,
} from 'lucide-react'

const layerIcons: Record<string, React.ReactNode> = {
  text: <Type className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  screenshot: <Smartphone className="w-4 h-4" />,
  shape: <Square className="w-4 h-4" />,
}

const elementTypes = [
  { type: 'text', name: 'Text', icon: <Type className="w-6 h-6" />, color: 'emerald', description: 'Add headings & paragraphs' },
  { type: 'image', name: 'Image', icon: <Image className="w-6 h-6" />, color: 'blue', description: 'Upload or drag images' },
  { type: 'screenshot', name: 'Screenshot', icon: <Smartphone className="w-6 h-6" />, color: 'purple', description: 'Device mockups' },
  { type: 'shape', name: 'Shape', icon: <Square className="w-6 h-6" />, color: 'pink', description: 'Rectangles & circles' },
]

const colorVariants: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', hover: 'hover:bg-emerald-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', hover: 'hover:bg-blue-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30', hover: 'hover:bg-purple-500/20' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/30', hover: 'hover:bg-pink-500/20' },
}

export default function ElementsPanel() {
  const {
    slides,
    currentSlideId,
    selectedLayerId,
    setSelectedLayerId,
    updateLayer,
    deleteLayer,
    addLayer,
  } = useEditorStore()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null)

  const currentSlide = slides.find(s => s.id === currentSlideId)
  const layers = currentSlide?.layers || []
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex)

  const handleLayerUpdate = (layerId: string, updates: Record<string, unknown>) => {
    if (currentSlideId) {
      updateLayer(currentSlideId, layerId, updates)
    }
  }

  const handleDeleteLayer = (layerId: string) => {
    if (currentSlideId) {
      deleteLayer(currentSlideId, layerId)
    }
  }

  const handleAddElement = (elementType: string) => {
    if (!currentSlideId) return

    const currentSlide = slides.find(s => s.id === currentSlideId)
    if (!currentSlide) return

    const maxZIndex = currentSlide.layers.length > 0 
      ? Math.max(...currentSlide.layers.map(l => l.zIndex))
      : 0

    const newLayerId = `layer-${Date.now()}`
    let newLayer: any

    switch (elementType) {
      case 'text':
        newLayer = {
          id: newLayerId,
          type: 'text',
          name: 'Text',
          x: currentSlide.canvas.width / 2,
          y: currentSlide.canvas.height / 2,
          width: 400,
          height: 60,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: maxZIndex + 1,
          properties: {
            content: 'New Text',
            fontFamily: 'Inter',
            fontSize: 48,
            fontWeight: '700',
            color: '#000000',
            align: 'center',
            lineHeight: 1.2,
            position: 'center',
            anchorX: 'center',
            anchorY: 'center',
            offsetX: 0,
            offsetY: 0,
          }
        }
        break

      case 'image':
        newLayer = {
          id: newLayerId,
          type: 'image',
          name: 'Image',
          x: currentSlide.canvas.width / 2,
          y: currentSlide.canvas.height / 2,
          width: 300,
          height: 300,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: maxZIndex + 1,
          properties: {
            src: '',
            placeholder: '',
            borderRadius: 12,
            shadow: true,
            shadowBlur: 20,
            shadowColor: 'rgba(0,0,0,0.25)',
            shadowOffsetX: 0,
            shadowOffsetY: 4,
            position: 'center',
            anchorX: 'center',
            anchorY: 'center',
            offsetX: 0,
            offsetY: 0,
            scale: 1,
          }
        }
        break

      case 'screenshot':
        newLayer = {
          id: newLayerId,
          type: 'screenshot',
          name: 'Screenshot',
          x: currentSlide.canvas.width / 2,
          y: currentSlide.canvas.height / 2,
          width: 300,
          height: 600,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: maxZIndex + 1,
          properties: {
            src: '',
            placeholder: '',
            borderRadius: 24,
            shadow: true,
            shadowBlur: 30,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowOffsetX: 0,
            shadowOffsetY: 8,
            position: 'center',
            anchorX: 'center',
            anchorY: 'center',
            offsetX: 0,
            offsetY: 0,
            scale: 1,
          }
        }
        break

      case 'shape':
        newLayer = {
          id: newLayerId,
          type: 'shape',
          name: 'Shape',
          x: currentSlide.canvas.width / 2,
          y: currentSlide.canvas.height / 2,
          width: 200,
          height: 200,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: maxZIndex + 1,
          properties: {
            fill: '#4ADE80',
            stroke: '',
            strokeWidth: 0,
            cornerRadius: 12,
            shapeType: 'rounded',
            position: 'center',
            anchorX: 'center',
            anchorY: 'center',
            offsetX: 0,
            offsetY: 0,
          }
        }
        break

      default:
        return
    }

    addLayer(currentSlideId, newLayer)
    setIsModalOpen(false)
  }

  return (
    <div className={`bg-gradient-to-b from-background to-background/95 border-r border-border/50 h-full flex flex-col transition-all duration-300 ease-out ${isCollapsed ? 'w-14' : 'w-72'}`}>
      <div className="px-4 py-4 border-b border-border/50 flex items-center justify-between backdrop-blur-sm">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl shadow-sm shadow-emerald-500/10">
              <Layers className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <span className="text-sm font-semibold text-text-primary block">Elements</span>
              <span className="text-xs text-text-muted">{layers.length} layers</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-surface/80 rounded-xl transition-all duration-200 hover:scale-105"
        >
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="space-y-2">
            {sortedLayers.map((layer, index) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                onMouseEnter={() => setHoveredLayer(layer.id)}
                onMouseLeave={() => setHoveredLayer(null)}
                className={`
                  group flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer
                  transition-all duration-200 ease-out
                  ${
                    selectedLayerId === layer.id
                      ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'hover:bg-surface/80 border border-transparent hover:border-border/50'
                  }
                  ${!layer.visible ? 'opacity-40' : ''}
                  ${hoveredLayer === layer.id ? 'translate-x-1' : ''}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <GripVertical className="w-3 h-3 text-text-muted/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

                <div className={`p-2 rounded-lg transition-all duration-200 ${
                  selectedLayerId === layer.id 
                    ? 'bg-emerald-500/20 text-emerald-500 shadow-sm' 
                    : 'bg-surface/80 text-text-secondary group-hover:bg-surface'
                }`}>
                  {layerIcons[layer.type] || <Square className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate text-text-primary block">
                    {layer.name}
                  </span>
                  <span className="text-xs text-text-muted capitalize">{layer.type}</span>
                </div>

                <div className={`flex items-center gap-0.5 transition-all duration-200 ${
                  hoveredLayer === layer.id || selectedLayerId === layer.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLayerUpdate(layer.id, { visible: !layer.visible })
                    }}
                    className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                    title={layer.visible ? 'Hide' : 'Show'}
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5 text-text-muted hover:text-text-primary transition-colors" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLayerUpdate(layer.id, { locked: !layer.locked })
                    }}
                    className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                    title={layer.locked ? 'Unlock' : 'Lock'}
                  >
                    {layer.locked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-text-muted hover:text-text-primary transition-colors" />
                    )}
                  </button>
                  {!layer.locked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteLayer(layer.id)
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors group/delete"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-text-muted group-hover/delete:text-red-400 transition-colors" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {layers.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-surface to-border/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Layers className="w-7 h-7 text-text-muted/50" />
              </div>
              <p className="text-sm font-medium text-text-muted mb-1">No elements yet</p>
              <p className="text-xs text-text-muted/70">Click below to add your first element</p>
            </div>
          )}
        </div>
      )}

      {!isCollapsed && (
        <div className="p-4 border-t border-border/50 bg-gradient-to-t from-surface/50 to-transparent">
          <button
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Element
          </button>
        </div>
      )}

      {isCollapsed && (
        <div className="p-2 border-t border-border/50">
          <button
            className="w-full aspect-square bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:scale-105"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <DialogBackdrop 
          className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300" 
        />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative bg-gradient-to-b from-background to-surface/95 rounded-3xl shadow-2xl p-0 w-full max-w-lg mx-auto border border-border/50 overflow-hidden transition-all duration-300 scale-100">
            <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-purple-500/5" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-text-primary">
                      Add Element
                    </DialogTitle>
                    <p className="text-xs text-text-muted">Choose an element type to add</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-surface rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {elementTypes.map((el, index) => {
                  const colors = colorVariants[el.color]
                  return (
                    <button
                      key={el.type}
                      onClick={() => handleAddElement(el.type)}
                      className={`
                        flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border/50
                        transition-all duration-200 ease-out
                        hover:border-${el.color}-500/50 hover:shadow-lg hover:shadow-${el.color}-500/10
                        hover:scale-[1.02] active:scale-[0.98]
                        bg-gradient-to-b from-surface/50 to-transparent
                        group
                      `}
                      style={{ animationDelay: `${index * 75}ms` }}
                    >
                      <div className={`p-4 rounded-2xl ${colors.bg} ${colors.text} transition-all duration-200 group-hover:scale-110 shadow-sm`}>
                        {el.icon}
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-semibold text-text-primary block mb-0.5">
                          {el.name}
                        </span>
                        <span className="text-xs text-text-muted">
                          {el.description}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 bg-surface hover:bg-border/80 rounded-xl text-text-muted hover:text-text-primary font-medium text-sm transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}