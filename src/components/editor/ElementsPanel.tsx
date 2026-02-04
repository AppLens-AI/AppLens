import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useEditorStore } from "@/stores/editorStore";
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
} from "lucide-react";

const layerIcons: Record<string, React.ReactNode> = {
  text: <Type className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  screenshot: <Smartphone className="w-4 h-4" />,
  shape: <Square className="w-4 h-4" />,
};

const elementTypes = [
  {
    type: "text",
    name: "Text",
    icon: <Type className="w-6 h-6" />,
    color: "emerald",
    description: "Add headings & paragraphs",
  },
  {
    type: "screenshot",
    name: "Screenshot",
    icon: <Smartphone className="w-6 h-6" />,
    color: "purple",
    description: "Device mockups",
  },
  {
    type: "shape",
    name: "Shape",
    icon: <Square className="w-6 h-6" />,
    color: "pink",
    description: "Rectangles & circles",
  },
];

const colorVariants: Record<
  string,
  { bg: string; text: string; border: string; hover: string }
> = {
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
    hover: "hover:bg-emerald-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/30",
    hover: "hover:bg-blue-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-500",
    border: "border-purple-500/30",
    hover: "hover:bg-purple-500/20",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-500",
    border: "border-pink-500/30",
    hover: "hover:bg-pink-500/20",
  },
};

export default function ElementsPanel() {
  const {
    canvas,
    layers,
    selectedLayerId,
    setSelectedLayerId,
    updateLayer,
    deleteLayer,
    addLayer,
  } = useEditorStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleLayerUpdate = (
    layerId: string,
    updates: Record<string, unknown>,
  ) => {
    updateLayer(layerId, updates);
  };

  const handleDeleteLayer = (layerId: string) => {
    deleteLayer(layerId);
  };

  const handleAddElement = (elementType: string) => {
    const maxZIndex =
      layers.length > 0
        ? Math.max(...layers.map((l) => l.zIndex))
        : 0;

    const newLayerId = `layer-${Date.now()}`;
    let newLayer: any;

    switch (elementType) {
      case "text":
        newLayer = {
          id: newLayerId,
          type: "text",
          name: "Text",
          x: canvas.width / 2,
          y: canvas.height / 2,
          width: 400,
          height: 60,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: maxZIndex + 1,
          properties: {
            content: "New Text",
            fontFamily: "Inter",
            fontSize: 48,
            fontWeight: "700",
            color: "#000000",
            align: "center",
            lineHeight: 1.2,
            position: "center",
            anchorX: "center",
            anchorY: "center",
            offsetX: 0,
            offsetY: canvas.height / 2,
          },
        };
        break;

      case "image":
        newLayer = {
          id: newLayerId,
          type: "image",
          name: "Image",
          x: canvas.width / 2,
          y: canvas.height / 2,
          width: 300,
          height: 300,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: maxZIndex + 1,
          properties: {
            src: "",
            placeholder: "",
            borderRadius: 12,
            shadow: true,
            shadowBlur: 20,
            shadowColor: "rgba(0,0,0,0.25)",
            shadowOffsetX: 0,
            shadowOffsetY: 4,
            position: "center",
            anchorX: "center",
            anchorY: "center",
            offsetX: 0,
            offsetY: canvas.height / 2,
            scale: 1,
          },
        };
        break;

      case "screenshot":
        newLayer = {
          id: newLayerId,
          type: "screenshot",
          name: "Screenshot",
          x: canvas.width / 2,
          y: canvas.height / 2,
          width: 300,
          height: 600,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: maxZIndex + 1,
          properties: {
            src: "",
            placeholder: "",
            borderRadius: 24,
            shadow: true,
            shadowBlur: 30,
            shadowColor: "rgba(0,0,0,0.3)",
            shadowOffsetX: 0,
            shadowOffsetY: 8,
            position: "center",
            anchorX: "center",
            anchorY: "center",
            offsetX: 0,
            offsetY: canvas.height / 2,
            scale: 1,
          },
        };
        break;

      case "shape":
        newLayer = {
          id: newLayerId,
          type: "shape",
          name: "Shape",
          x: canvas.width / 2,
          y: canvas.height / 2,
          width: 200,
          height: 200,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: maxZIndex + 1,
          properties: {
            fill: "#4ADE80",
            stroke: "",
            strokeWidth: 0,
            cornerRadius: 12,
            shapeType: "rounded",
            position: "center",
            anchorX: "center",
            anchorY: "center",
            offsetX: 0,
            offsetY: canvas.height / 2,
          },
        };
        break;

      default:
        return;
    }

    addLayer(newLayer);
    setIsModalOpen(false);
  };

  return (
    <div
      className={`bg-gradient-to-b from-background to-background/95 border-r border-border/50 h-full flex flex-col transition-all duration-300 ease-out ${
        isCollapsed ? "w-14" : "w-72"
      }`}
    >
      <div className="px-4 py-4 border-b border-border/50 flex items-center justify-between backdrop-blur-sm">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl shadow-sm shadow-emerald-500/10">
              <Layers className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <span className="text-sm font-semibold text-text-primary block">
                Elements
              </span>
              <span className="text-xs text-text-muted">
                {layers.length} layers
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-surface/80 rounded-xl transition-all duration-200 hover:scale-105"
        >
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform duration-300 ${
              isCollapsed ? "-rotate-90" : ""
            }`}
          />
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
                      ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                      : "hover:bg-surface/80 border border-transparent hover:border-border/50"
                  }
                  ${!layer.visible ? "opacity-40" : ""}
                  ${hoveredLayer === layer.id ? "translate-x-1" : ""}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <GripVertical className="w-3 h-3 text-text-muted/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

                <div
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    selectedLayerId === layer.id
                      ? "bg-emerald-500/20 text-emerald-500 shadow-sm"
                      : "bg-surface/80 text-text-secondary group-hover:bg-surface"
                  }`}
                >
                  {layerIcons[layer.type] || <Square className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate text-text-primary block">
                    {layer.name}
                  </span>
                  <span className="text-xs text-text-muted capitalize">
                    {layer.type}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-0.5 transition-all duration-200 ${
                    hoveredLayer === layer.id || selectedLayerId === layer.id
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLayerUpdate(layer.id, { visible: !layer.visible });
                    }}
                    className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                    title={layer.visible ? "Hide" : "Show"}
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5 text-text-muted hover:text-text-primary transition-colors" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLayerUpdate(layer.id, { locked: !layer.locked });
                    }}
                    className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                    title={layer.locked ? "Unlock" : "Lock"}
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
                        e.stopPropagation();
                        handleDeleteLayer(layer.id);
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
              <p className="text-sm font-medium text-text-muted mb-1">
                No elements yet
              </p>
              <p className="text-xs text-text-muted/70">
                Click below to add your first element
              </p>
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

    <Dialog
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      className="relative z-50"
    >
      {/* Vibrant backdrop */}
      <DialogBackdrop className="fixed inset-0 bg-black/70 backdrop-blur-xl transition-opacity duration-300" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="relative bg-white/10 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] w-full max-w-lg mx-auto border border-white/20 overflow-hidden transform transition-all duration-500 ease-out">
          
          {/* Decorative gradient blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/30 to-transparent rounded-full blur-3xl" />
          
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Animated icon */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl blur-md group-hover:blur-lg transition-all opacity-60" />
                  <div className="relative p-3.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6 text-white animate-pulse" strokeWidth={2.5} />
                  </div>
                </div>
                
                <div>
                  <DialogTitle className="text-2xl font-black text-white mb-1 tracking-tight">
                    Add Element
                  </DialogTitle>
                  <p className="text-sm text-white/70 font-medium">
                    Choose your element type
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsModalOpen(false)}
                className="group p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors group-hover:rotate-90 duration-200" />
              </button>
            </div>
          </div>

          {/* Grid Content */}
          <div className="relative p-8">
            <div className="grid grid-cols-2 gap-4">
              {elementTypes.map((el, index) => {
                const colors = colorVariants[el.color];
                return (
                  <button
                    key={el.type}
                    onClick={() => handleAddElement(el.type)}
                    className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300 ease-out active:scale-95 overflow-hidden"
                    style={{
                      animationDelay: `${index * 60}ms`,
                      animation: 'fadeSlideIn 0.5s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-20 transition-all duration-500`} />
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                    
                    {/* Icon with glow */}
                    <div className="relative">
                      <div className={`absolute inset-0 ${colors.bg} opacity-40 blur-2xl scale-150 group-hover:opacity-70 transition-opacity duration-300`} />
                      <div className={`relative p-4 rounded-2xl ${colors.bg} ${colors.text} shadow-xl transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300`}>
                        {el.icon}
                      </div>
                    </div>
                    
                    {/* Text */}
                    <div className="text-center space-y-1 relative">
                      <span className="text-sm font-bold text-white block">
                        {el.name}
                      </span>
                      <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                        {el.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="relative px-8 pb-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl text-white font-bold text-sm transition-all duration-200 border border-white/20 hover:border-white/30 active:scale-98 shadow-lg"
            >
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>

      <style >{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </Dialog>
    </div>
  );
}
