import { useEditorStore } from "@/stores/editorStore";
import { Grid3X3, Magnet } from "lucide-react";

export default function AlignmentToolbar() {
  const {
    snapToGrid,
    gridSize,
    showSmartGuides,
    setSnapToGrid,
    setGridSize,
    setShowSmartGuides,
  } = useEditorStore();

  return (
    <div className="space-y-4">
      {/* Grid & Snap Settings */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Snap & Guides
        </label>

        <label className="flex items-center justify-between px-3 py-2.5 bg-background border border-border rounded-xl cursor-pointer hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-2.5">
            <Grid3X3 className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary font-medium">
              Snap to Grid
            </span>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-border rounded-full peer-checked:bg-emerald-500 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </div>
        </label>

        {snapToGrid && (
          <div className="space-y-2 pl-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Grid Size</span>
              <span className="text-xs font-semibold text-text-primary">
                {gridSize}px
              </span>
            </div>
            <input
              type="range"
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              min={5}
              max={100}
              step={5}
              className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        )}

        <label className="flex items-center justify-between px-3 py-2.5 bg-background border border-border rounded-xl cursor-pointer hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-2.5">
            <Magnet className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary font-medium">
              Smart Guides
            </span>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={showSmartGuides}
              onChange={(e) => setShowSmartGuides(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-border rounded-full peer-checked:bg-emerald-500 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </div>
        </label>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-text-muted mb-2 font-medium">
          Keyboard Shortcuts
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Nudge 1px</span>
            <span className="text-text-secondary font-mono">Arrow Keys</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Nudge 10px</span>
            <span className="text-text-secondary font-mono">Shift+Arrow</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Toggle Grid</span>
            <span className="text-text-secondary font-mono">⌘G</span>
          </div>
        </div>
      </div>
    </div>
  );
}
