import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  Sparkles,
  X,
  Type,
  Image,
  Square,
  Circle,
  Triangle,
  Minus,
  Pencil,
  Shapes,
  Star,
  Heart,
  Smile,
  MessageSquare,
  StickyNote,
  ArrowRight,
  Stamp,
  Palette,
  Lock,
} from "lucide-react";

const elementTypes = [
  {
    type: "text",
    name: "Text",
    description: "Add text box",
    icon: <Type className="w-5 h-5" strokeWidth={2} />,
    color: "blue",
    enabled: true,
  },
  {
    type: "image",
    name: "Image",
    description: "Upload image",
    icon: <Image className="w-5 h-5" strokeWidth={2} />,
    color: "purple",
    enabled: true,
  },
  {
    type: "shape",
    name: "Shape",
    description: "Draw shapes",
    icon: <Shapes className="w-5 h-5" strokeWidth={2} />,
    color: "emerald",
    enabled: true,
  },
  {
    type: "background",
    name: "Gradient",
    description: "Gradient backgrounds",
    icon: <Palette className="w-5 h-5" strokeWidth={2} />,
    color: "emerald",
    enabled: true,
  },
  {
    type: "rectangle",
    name: "Rectangle",
    description: "Coming soon",
    icon: <Square className="w-5 h-5" strokeWidth={2} />,
    color: "cyan",
    enabled: false,
  },
  {
    type: "circle",
    name: "Circle",
    description: "Coming soon",
    icon: <Circle className="w-5 h-5" strokeWidth={2} />,
    color: "orange",
    enabled: false,
  },
  {
    type: "triangle",
    name: "Triangle",
    description: "Coming soon",
    icon: <Triangle className="w-5 h-5" strokeWidth={2} />,
    color: "pink",
    enabled: false,
  },
  {
    type: "line",
    name: "Line",
    description: "Coming soon",
    icon: <Minus className="w-5 h-5" strokeWidth={2} />,
    color: "indigo",
    enabled: false,
  },
  {
    type: "star",
    name: "Star",
    description: "Coming soon",
    icon: <Star className="w-5 h-5" strokeWidth={2} />,
    color: "yellow",
    enabled: false,
  },
  {
    type: "heart",
    name: "Heart",
    description: "Coming soon",
    icon: <Heart className="w-5 h-5" strokeWidth={2} />,
    color: "rose",
    enabled: false,
  },
  {
    type: "emoji",
    name: "Emoji",
    description: "Coming soon",
    icon: <Smile className="w-5 h-5" strokeWidth={2} />,
    color: "amber",
    enabled: false,
  },
  {
    type: "arrow",
    name: "Arrow",
    description: "Coming soon",
    icon: <ArrowRight className="w-5 h-5" strokeWidth={2} />,
    color: "lime",
    enabled: false,
  },
];

const colorVariants = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    hover: "hover:bg-blue-500/20 hover:border-blue-400/60",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    hover: "hover:bg-emerald-500/20 hover:border-emerald-400/60",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    hover: "hover:bg-purple-500/20 hover:border-purple-400/60",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/30",
    hover: "hover:bg-pink-500/20 hover:border-pink-400/60",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    hover: "hover:bg-orange-500/20 hover:border-orange-400/60",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    hover: "hover:bg-cyan-500/20 hover:border-cyan-400/60",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    hover: "hover:bg-indigo-500/20 hover:border-indigo-400/60",
  },
  teal: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/30",
    hover: "hover:bg-teal-500/20 hover:border-teal-400/60",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    hover: "hover:bg-yellow-500/20 hover:border-yellow-400/60",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    hover: "hover:bg-rose-500/20 hover:border-rose-400/60",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/30",
    hover: "hover:bg-violet-500/20 hover:border-violet-400/60",
  },
  lime: {
    bg: "bg-lime-500/10",
    text: "text-lime-400",
    border: "border-lime-500/30",
    hover: "hover:bg-lime-500/20 hover:border-lime-400/60",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    hover: "hover:bg-amber-500/20 hover:border-amber-400/60",
  },
};

export default function AddElementModal({
  isModalOpen,
  setIsModalOpen,
  handleAddElement,
}) {
  return (
    <Dialog
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      className="relative z-50"
    >
      {/* Dark backdrop */}
      <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto border border-zinc-800 overflow-hidden transform transition-all duration-300 ease-out">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

          {/* Header */}
          <div className="relative px-6 py-5 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>

                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    Add to Canvas
                  </DialogTitle>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    Choose an element to add
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors duration-200"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Grid Content with scroll */}
          <div className="relative p-6 bg-zinc-900 max-h-[65vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-4 gap-3">
              {elementTypes.map((el, index) => {
                const colors = colorVariants[el.color];
                const isEnabled = el.enabled;

                return (
                  <button
                    key={el.type}
                    onClick={() => isEnabled && handleAddElement(el.type)}
                    disabled={!isEnabled}
                    className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200 ease-out
                      ${
                        isEnabled
                          ? `bg-zinc-800/50 ${colors.border} ${colors.hover} active:scale-95 hover:shadow-lg cursor-pointer`
                          : "bg-zinc-800/20 border-zinc-700/30 cursor-not-allowed opacity-60"
                      }`}
                    style={{
                      animationDelay: `${index * 25}ms`,
                      animation: "fadeIn 0.4s ease-out forwards",
                      opacity: 0,
                    }}
                  >
                    {/* Lock icon for disabled items */}
                    {!isEnabled && (
                      <div className="absolute top-2 right-2">
                        <Lock
                          className="w-3 h-3 text-zinc-600"
                          strokeWidth={2}
                        />
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`p-2.5 rounded-lg ${colors.bg} ${colors.text} shadow-sm transition-transform duration-200
                      ${isEnabled ? "group-hover:scale-110" : "opacity-50"}`}
                    >
                      {el.icon}
                    </div>

                    {/* Text */}
                    <div className="text-center space-y-0.5">
                      <span
                        className={`text-xs font-semibold block ${isEnabled ? "text-white" : "text-zinc-500"}`}
                      >
                        {el.name}
                      </span>
                      <span
                        className={`text-[10px] leading-tight block ${isEnabled ? "text-zinc-500" : "text-zinc-600"}`}
                      >
                        {el.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="relative px-6 py-4 bg-zinc-900/50 border-t border-zinc-800">
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white font-medium text-sm transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
    </Dialog>
  );
}
