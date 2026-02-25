import { useState, useRef, useEffect, useCallback } from "react";
import { useAssetLibraryStore } from "@/stores/assetLibraryStore";
import { useEditorStore } from "@/stores/editorStore";
import {
  ICON_CATEGORIES,
  searchIcons,
  getIconCategoryCounts,
  type IconDefinition,
} from "@/lib/iconLibrary";
import {
  FolderOpen,
  Search,
  Upload,
  Trash2,
  Image,
  Smile,
  ChevronDown,
  Loader2,
  X,
  ImagePlus,
  FileImage,
} from "lucide-react";

type TabId = "uploads" | "icons";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: "uploads",
    label: "My Assets",
    icon: <FolderOpen className="w-3.5 h-3.5" />,
  },
  { id: "icons", label: "Icons", icon: <Smile className="w-3.5 h-3.5" /> },
];

export default function AssetLibraryPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("uploads");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`bg-gradient-to-b from-background to-background/95 border-r border-border/50 h-full flex flex-col transition-all duration-300 ease-out ${
        isCollapsed ? "w-14" : "w-72"
      }`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/50 flex items-center justify-between backdrop-blur-sm">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl shadow-sm shadow-emerald-500/10">
              <FileImage className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground block">
                Asset Library
              </span>
              <span className="text-xs text-muted-foreground">
                Images & Icons
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-secondary/80 rounded-xl transition-all duration-200 hover:scale-105"
        >
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
              isCollapsed ? "-rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Tab navigation */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "uploads" && <UploadedAssetsTab />}
            {activeTab === "icons" && <IconLibraryTab />}
          </div>
        </>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center gap-2 p-2 mt-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsCollapsed(false);
              }}
              className={`w-full aspect-square flex items-center justify-center rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
              title={tab.label}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadedAssetsTab() {
  const {
    assets,
    isLoading,
    isUploading,
    searchQuery,
    fetchAssets,
    searchAssets,
    uploadAsset,
    deleteAsset,
    setFilter,
    activeFilter,
  } = useAssetLibraryStore();

  const { canvas, addLayer, layers } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetchAssets(true);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        searchAssets(value);
      }, 300);
    },
    [searchAssets],
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      await uploadAsset(file);
    }

    if (e.target) e.target.value = "";
  };

  const handleAddToCanvas = (url: string, name: string) => {
    const maxZIndex =
      layers.length > 0 ? Math.max(...layers.map((l) => l.zIndex)) : 0;

    addLayer({
      id: `layer-${Date.now()}`,
      type: "image",
      name: name || "Asset",
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
        src: url,
        placeholder: "",
        borderRadius: 12,
        shadow: false,
        shadowBlur: 0,
        shadowColor: "rgba(0,0,0,0.25)",
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        position: "center",
        anchorX: "center",
        anchorY: "center",
        offsetX: 0,
        offsetY: canvas.height / 2,
        scale: 1,
      },
    });
  };

  const filters = [
    { id: "", label: "All" },
    { id: "image", label: "Images" },
    { id: "svg", label: "SVG" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-9 pr-8 py-2 bg-secondary/50 border border-border/50 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          {searchInput && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-secondary rounded"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 py-1.5 flex gap-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeFilter === f.id
                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-transparent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 asset-scroll">
        {isLoading && assets.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 bg-gradient-to-br from-secondary to-border/50 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ImagePlus className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No assets yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              Upload images to build your library
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border/50 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer bg-secondary/30 hover:shadow-md hover:shadow-emerald-500/5"
                onClick={() => handleAddToCanvas(asset.url, asset.name)}
              >
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-[10px] text-white/90 truncate font-medium">
                      {asset.name}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAsset(asset.id);
                    }}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="p-3 border-t border-border/50 bg-gradient-to-t from-secondary/30 to-transparent">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Assets
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Icon Library Tab ────────────────────────────────────────────
function IconLibraryTab() {
  const { canvas, addLayer, layers } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [iconColor, setIconColor] = useState("#ffffff");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const filteredIcons = searchIcons(searchQuery, selectedCategory);
  const categoryCounts = getIconCategoryCounts();

  const handleAddIconToCanvas = (icon: IconDefinition) => {
    const maxZIndex =
      layers.length > 0 ? Math.max(...layers.map((l) => l.zIndex)) : 0;

    // Colorize the SVG by replacing currentColor with chosen color
    const colorizedSvg = icon.svg.replace(/currentColor/g, iconColor);

    // Create a data URI from the SVG
    const svgDataUri = `data:image/svg+xml,${encodeURIComponent(colorizedSvg)}`;

    addLayer({
      id: `layer-${Date.now()}`,
      type: "image",
      name: icon.name,
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: 120,
      height: 120,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 1,
      zIndex: maxZIndex + 1,
      properties: {
        src: svgDataUri,
        placeholder: "",
        borderRadius: 0,
        shadow: false,
        shadowBlur: 0,
        shadowColor: "rgba(0,0,0,0)",
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        position: "center",
        anchorX: "center",
        anchorY: "center",
        offsetX: 0,
        offsetY: canvas.height / 2,
        scale: 1,
      },
    });
  };

  const currentCategory = ICON_CATEGORIES.find(
    (c) => c.id === selectedCategory,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search icons..."
            className="w-full pl-9 pr-8 py-2 bg-secondary/50 border border-border/50 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-secondary rounded"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Category + Color */}
      <div className="px-3 py-1.5 flex gap-2 items-center">
        {/* Category dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-lg text-xs font-medium text-foreground hover:bg-secondary/80 transition-all"
          >
            <span className="truncate">{currentCategory?.label || "All"}</span>
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground transition-transform flex-shrink-0 ml-1 ${
                isCategoryOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isCategoryOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-48 overflow-y-auto asset-scroll">
                {ICON_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {categoryCounts[cat.id] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <input
              type="color"
              value={iconColor}
              onChange={(e) => setIconColor(e.target.value)}
              className="w-7 h-7 rounded-lg border border-border/50 cursor-pointer bg-transparent"
              title="Icon color"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="px-3 pb-1">
        <span className="text-[10px] text-muted-foreground">
          {filteredIcons.length} icon{filteredIcons.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Icon grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 asset-scroll">
        {filteredIcons.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 bg-gradient-to-br from-secondary to-border/50 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Search className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No icons found
            </p>
            <p className="text-xs text-muted-foreground/70">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {filteredIcons.map((icon) => (
              <button
                key={icon.name}
                onClick={() => handleAddIconToCanvas(icon)}
                className="group relative aspect-square rounded-xl border border-border/30 hover:border-emerald-500/40 bg-secondary/20 hover:bg-emerald-500/10 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:shadow-sm hover:shadow-emerald-500/10"
                title={icon.name}
              >
                <div
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: iconColor }}
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                />
                <span className="text-[8px] leading-tight text-muted-foreground group-hover:text-emerald-500 truncate w-full text-center px-0.5 transition-colors duration-200">
                  {icon.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
