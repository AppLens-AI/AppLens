import { useState, useMemo } from "react";
import { useEditorStore } from "@/stores/editorStore";
import type { ExportSize } from "@/types";
import {
  X,
  Settings,
  Plus,
  Trash2,
  Copy,
  Smartphone,
  Tablet,
  Check,
  ArrowRight,
} from "lucide-react";

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const PRESET_DEVICES: ExportSize[] = [
  { name: 'iPhone 6.5"', platform: "ios", width: 1242, height: 2688 },
  { name: 'iPhone 6.7"', platform: "ios", width: 1290, height: 2796 },
  { name: 'iPhone 5.5"', platform: "ios", width: 1242, height: 2208 },
  { name: 'iPad 12.9"', platform: "ios", width: 2048, height: 2732 },
  { name: 'iPad 11"', platform: "ios", width: 1668, height: 2388 },
  { name: "Android Phone", platform: "android", width: 1080, height: 1920 },
  { name: "Android Tablet 10", platform: "android", width: 1920, height: 1200 },
  { name: "Android Tablet 7", platform: "android", width: 1280, height: 800 },
];

type ModalView = "main" | "add" | "apply";

export default function DeviceSettingsModal({
  isOpen,
  onClose,
}: DeviceSettingsModalProps) {
  const {
    exportSizes,
    deviceConfigs,
    addExportSize,
    removeExportSize,
    applyConfigToDevices,
  } = useEditorStore();

  const [view, setView] = useState<ModalView>("main");

  // Add device form state
  const [addMode, setAddMode] = useState<"preset" | "custom">("preset");
  const [customName, setCustomName] = useState("");
  const [customWidth, setCustomWidth] = useState("1242");
  const [customHeight, setCustomHeight] = useState("2688");
  const [customPlatform, setCustomPlatform] = useState<"ios" | "android">(
    "ios",
  );

  // Apply config state
  const [sourceDeviceKey, setSourceDeviceKey] = useState<string>("");
  const [targetDeviceKeys, setTargetDeviceKeys] = useState<Set<string>>(
    new Set(),
  );

  const existingKeys = useMemo(
    () => new Set(exportSizes.map(getDeviceKey)),
    [exportSizes],
  );

  const availablePresets = useMemo(
    () => PRESET_DEVICES.filter((p) => !existingKeys.has(getDeviceKey(p))),
    [existingKeys],
  );

  if (!isOpen) return null;

  const handleAddPreset = (preset: ExportSize) => {
    addExportSize(preset);
  };

  const handleAddCustom = () => {
    const name = customName.trim();
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);

    if (!name || isNaN(width) || isNaN(height) || width <= 0 || height <= 0)
      return;

    const newSize: ExportSize = {
      name,
      platform: customPlatform,
      width,
      height,
    };

    if (existingKeys.has(getDeviceKey(newSize))) return;

    addExportSize(newSize);
    setCustomName("");
    setCustomWidth("1242");
    setCustomHeight("2688");
    setView("main");
  };

  const handleRemoveDevice = (deviceKey: string) => {
    if (exportSizes.length <= 1) return; // Keep at least one device
    removeExportSize(deviceKey);
  };

  const handleApplyConfig = () => {
    if (!sourceDeviceKey || targetDeviceKeys.size === 0) return;
    applyConfigToDevices(sourceDeviceKey, Array.from(targetDeviceKeys));
    // Keep source/target selection so the state is visible when reopening
    setView("main");
  };

  const toggleTargetDevice = (key: string) => {
    setTargetDeviceKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const resetAndClose = () => {
    setView("main");
    // Preserve source/target selection so it persists across modal opens
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={resetAndClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Device Settings</h2>
              <p className="text-xs text-slate-400">
                {view === "main" && "Manage device dimensions"}
                {view === "add" && "Add a new device"}
                {view === "apply" && "Apply configuration across devices"}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === "main" && (
            <div className="space-y-6">
              {/* Devices List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Active Devices ({exportSizes.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {exportSizes.map((size) => {
                    const key = getDeviceKey(size);
                    const config = deviceConfigs[key];
                    const slideCount = config?.slides?.length || 0;

                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl group hover:border-slate-600/50 transition-all"
                      >
                        <div className="p-2 bg-slate-700/80 rounded-lg">
                          {isTabletDevice(size) ? (
                            <Tablet className="w-4 h-4 text-slate-300" />
                          ) : (
                            <Smartphone className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {size.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {size.width} × {size.height} · {size.platform} ·{" "}
                            {slideCount} slides
                          </p>
                        </div>
                        {exportSizes.length > 1 && (
                          <button
                            onClick={() => handleRemoveDevice(key)}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                            title="Remove device"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setView("add")}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Device
                </button>
                <button
                  onClick={() => {
                    // Only set a default source if none was previously selected
                    if (
                      !sourceDeviceKey ||
                      !existingKeys.has(sourceDeviceKey)
                    ) {
                      setSourceDeviceKey(
                        exportSizes.length > 0
                          ? getDeviceKey(exportSizes[0])
                          : "",
                      );
                    }
                    // Keep previous target selections intact
                    setView("apply");
                  }}
                  disabled={exportSizes.length < 2}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Copy className="w-4 h-4" />
                  Apply Config
                </button>
              </div>
            </div>
          )}

          {view === "add" && (
            <div className="space-y-6">
              {/* Mode Tabs */}
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setAddMode("preset")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    addMode === "preset"
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Presets
                </button>
                <button
                  onClick={() => setAddMode("custom")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    addMode === "custom"
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Custom
                </button>
              </div>

              {addMode === "preset" && (
                <div className="space-y-2">
                  {availablePresets.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      All preset devices have been added
                    </p>
                  ) : (
                    availablePresets.map((preset) => (
                      <button
                        key={getDeviceKey(preset)}
                        onClick={() => handleAddPreset(preset)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                      >
                        <div className="p-2 bg-slate-700/80 rounded-lg">
                          {isTabletDevice(preset) ? (
                            <Tablet className="w-4 h-4 text-slate-300" />
                          ) : (
                            <Smartphone className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-white">
                            {preset.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {preset.width} × {preset.height} · {preset.platform}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-400" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {addMode === "custom" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Device Name
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. My Custom Phone"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        min="100"
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(e.target.value)}
                        min="100"
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Platform
                    </label>
                    <div className="flex bg-slate-800 rounded-lg p-1">
                      <button
                        onClick={() => setCustomPlatform("ios")}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                          customPlatform === "ios"
                            ? "bg-slate-700 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        iOS
                      </button>
                      <button
                        onClick={() => setCustomPlatform("android")}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                          customPlatform === "android"
                            ? "bg-slate-700 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Android
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleAddCustom}
                    disabled={
                      !customName.trim() ||
                      !customWidth ||
                      !customHeight ||
                      parseInt(customWidth) <= 0 ||
                      parseInt(customHeight) <= 0
                    }
                    className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add Custom Device
                  </button>
                </div>
              )}
            </div>
          )}

          {view === "apply" && (
            <div className="space-y-6">
              {/* Source Device */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Source Device
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Select the device whose configuration you want to copy
                </p>
                <div className="space-y-2">
                  {exportSizes.map((size) => {
                    const key = getDeviceKey(size);
                    const isSelected = sourceDeviceKey === key;

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSourceDeviceKey(key);
                          // Remove source from targets if it was selected
                          setTargetDeviceKeys((prev) => {
                            const next = new Set(prev);
                            next.delete(key);
                            return next;
                          });
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          isSelected
                            ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                            : "bg-slate-800/80 border-slate-700/50 text-slate-200 hover:border-slate-600/50"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${isSelected ? "bg-blue-500/25" : "bg-slate-700/80"}`}
                        >
                          {isTabletDevice(size) ? (
                            <Tablet className="w-4 h-4" />
                          ) : (
                            <Smartphone className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold">{size.name}</p>
                          <p className="text-xs opacity-60">
                            {size.width} × {size.height}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {sourceDeviceKey && (
                <>
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="flex-1 h-px bg-slate-700/50" />
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-xs font-medium">Apply to</span>
                    <div className="flex-1 h-px bg-slate-700/50" />
                  </div>

                  {/* Target Devices */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Target Devices
                      </h3>
                      <button
                        onClick={() => {
                          const allKeys = exportSizes
                            .map(getDeviceKey)
                            .filter((k) => k !== sourceDeviceKey);
                          setTargetDeviceKeys(new Set(allKeys));
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Select All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {exportSizes
                        .filter(
                          (size) => getDeviceKey(size) !== sourceDeviceKey,
                        )
                        .map((size) => {
                          const key = getDeviceKey(size);
                          const isSelected = targetDeviceKeys.has(key);

                          return (
                            <button
                              key={key}
                              onClick={() => toggleTargetDevice(key)}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                                isSelected
                                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                                  : "bg-slate-800/80 border-slate-700/50 text-slate-200 hover:border-slate-600/50"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "border-slate-600"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div className="p-2 bg-slate-700/80 rounded-lg">
                                {isTabletDevice(size) ? (
                                  <Tablet className="w-4 h-4" />
                                ) : (
                                  <Smartphone className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-semibold">
                                  {size.name}
                                </p>
                                <p className="text-xs opacity-60">
                                  {size.width} × {size.height}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
          {view !== "main" ? (
            <>
              <button
                onClick={() => setView("main")}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
              {view === "apply" && (
                <button
                  onClick={handleApplyConfig}
                  disabled={!sourceDeviceKey || targetDeviceKeys.size === 0}
                  className="px-6 py-2.5 bg-emerald-500 text-white font-semibold text-sm rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Apply to {targetDeviceKeys.size} device
                  {targetDeviceKeys.size !== 1 ? "s" : ""}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                {exportSizes.length} device
                {exportSizes.length !== 1 ? "s" : ""} configured
              </p>
              <button
                onClick={resetAndClose}
                className="px-6 py-2.5 bg-slate-700 text-white font-semibold text-sm rounded-xl hover:bg-slate-600 transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
