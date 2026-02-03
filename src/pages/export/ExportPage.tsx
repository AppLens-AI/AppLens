import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { projectsApi, getProxyImageUrl } from "@/lib/api";
import type {
  Project,
  TextProperties,
  ImageProperties,
  ShapeProperties,
  ExportSize,
  CanvasConfig,
  LayerConfig,
  DeviceConfigMap,
  DeviceConfig,
  SlideData,
} from "@/types";
import { normalizeLayerProperties, normalizeLayers } from "@/lib/layerUtils";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Loader2,
  ArrowLeft,
  Download,
  Check,
  Apple,
  Smartphone,
  Package,
  CheckCircle2,
  X,
} from "lucide-react";
import Konva from "konva";

export default function ExportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [exportComplete, setExportComplete] = useState(false);
  const [deviceConfigs, setDeviceConfigs] = useState<DeviceConfigMap>({});

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const response = await projectsApi.getById(projectId);
        const data = response.data.data as Project;
        setProject(data);

        const sizes = data.template?.jsonConfig.exports || [];
        setSelectedSizes(
          new Set(sizes.map((s) => `${s.name}-${s.width}x${s.height}`))
        );

        const sourceDeviceConfigs =
          data.projectConfig.deviceConfigs ||
          data.template?.jsonConfig.deviceConfigs;
        if (sourceDeviceConfigs) {
          setDeviceConfigs(sourceDeviceConfigs);
        }

        const imageUrls: string[] = [];

        if (sourceDeviceConfigs) {
          Object.values(sourceDeviceConfigs).forEach((config) => {
            if (config.slides && config.slides.length > 0) {
              config.slides.forEach((slide) => {
                slide.layers
                  .filter((l) => l.type === "image" || l.type === "screenshot")
                  .forEach((l) => {
                    const props = normalizeLayerProperties<ImageProperties>(l.properties);
                    if (props.src) {
                      imageUrls.push(props.src);
                    }
                  });
              });
            } else {
              const layers = (config as any).layers || [];
              layers
                .filter((l: LayerConfig) => l.type === "image" || l.type === "screenshot")
                .forEach((l: LayerConfig) => {
                  const props = normalizeLayerProperties<ImageProperties>(l.properties);
                  if (props.src) {
                    imageUrls.push(props.src);
                  }
                });
            }
          });
        }

        const uniqueUrls = [...new Set(imageUrls)];

        const loadPromises = uniqueUrls.map((originalUrl) => {
          return new Promise<[string, HTMLImageElement]>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve([originalUrl, img]);
            img.onerror = () => resolve([originalUrl, img]);
            img.src = getProxyImageUrl(originalUrl);
          });
        });

        const loaded = await Promise.all(loadPromises);
        setLoadedImages(new Map(loaded));
      } catch (error) {
        console.error("Failed to fetch project:", error);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate]);

  const toggleSize = (sizeKey: string) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      if (next.has(sizeKey)) {
        next.delete(sizeKey);
      } else {
        next.add(sizeKey);
      }
      return next;
    });
  };

  const selectAllPlatform = (platform: string) => {
    const sizes = project?.template?.jsonConfig.exports || [];
    const platformSizes = sizes.filter((s) => s.platform === platform);
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      platformSizes.forEach((s) => {
        next.add(`${s.name}-${s.width}x${s.height}`);
      });
      return next;
    });
  };

  const calculateExportPosition = (
    layer: LayerConfig,
    canvas: CanvasConfig,
    exportSize: ExportSize,
    props: any
  ) => {
    const scaleX = exportSize.width / canvas.width;
    const scaleY = exportSize.height / canvas.height;

    const position = props.position || "center";
    const anchorX = props.anchorX || "center";
    const offsetX = props.offsetX || 0;
    const offsetY = props.offsetY !== undefined ? props.offsetY : 0;
    const imgScale = props.scale || 1;

    const isFullBackground =
      layer.type === "shape" &&
      layer.x === 0 &&
      layer.y === 0 &&
      layer.width === canvas.width &&
      layer.height === canvas.height;

    if (isFullBackground) {
      return {
        x: 0,
        y: 0,
        width: exportSize.width,
        height: exportSize.height,
        offsetX: 0,
        offsetY: 0,
      };
    }

    const width = layer.width * scaleX * imgScale;
    const height = layer.height * scaleY * imgScale;

    let x: number;
    switch (anchorX) {
      case "left":
        x = offsetX * scaleX;
        break;
      case "right":
        x = exportSize.width - offsetX * scaleX - width;
        break;
      case "center":
      default:
        x = (exportSize.width - width) / 2 + offsetX * scaleX;
        break;
    }

    let y: number;
    switch (position) {
      case "top":
        y = offsetY * scaleY;
        break;
      case "bottom":
        y = exportSize.height - offsetY * scaleY - height;
        break;
      case "top-overflow":
        y = offsetY * scaleY;
        break;
      case "bottom-overflow":
        y = offsetY * scaleY;
        break;
      case "center":
      default:
        y = offsetY * scaleY;
        if (layer.type !== "text") y -= height / 2;
        break;
    }

    return { x, y, width, height, offsetX: 0, offsetY: 0 };
  };

  const renderSlide = useCallback(
    async (
      slide: SlideData,
      exportSize: ExportSize
    ): Promise<Blob | null> => {
      const canvas = slide.canvas;
      const layers = normalizeLayers(slide.layers);
      
      const scaleX = exportSize.width / canvas.width;
      const scaleY = exportSize.height / canvas.height;
      const scale = Math.min(scaleX, scaleY);

      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const offscreenStage = new Konva.Stage({
        container,
        width: exportSize.width,
        height: exportSize.height,
      });

      const layer = new Konva.Layer();
      offscreenStage.add(layer);

      layer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width: exportSize.width,
          height: exportSize.height,
          fill: canvas.backgroundColor,
        })
      );

      const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

      for (const layerConfig of sortedLayers) {
        if (!layerConfig.visible) continue;

        if (layerConfig.type === "shape") {
          const props = normalizeLayerProperties<ShapeProperties>(layerConfig.properties);
          const pos = calculateExportPosition(layerConfig, canvas, exportSize, props);
          
          if (props.shapeType === "circle") {
            layer.add(
              new Konva.Circle({
                x: pos.x + pos.width / 2,
                y: pos.y + pos.height / 2,
                radius: Math.max(pos.width, pos.height) / 2,
                fill: props.fill || "transparent",
                stroke: props.stroke || undefined,
                strokeWidth: props.stroke ? (props.strokeWidth || 0) * scale : 0,
                opacity: layerConfig.opacity,
                rotation: layerConfig.rotation,
              })
            );
          } else {
            layer.add(
              new Konva.Rect({
                x: pos.x + pos.width / 2,
                y: pos.y + pos.height / 2,
                width: pos.width,
                height: pos.height,
                fill: props.fill || "transparent",
                stroke: props.stroke || undefined,
                strokeWidth: props.stroke ? (props.strokeWidth || 0) * scale : 0,
                cornerRadius: (props.cornerRadius || 0) * scale,
                opacity: layerConfig.opacity,
                rotation: layerConfig.rotation,
                offsetX: pos.width / 2,
                offsetY: pos.height / 2,
              })
            );
          }
        }

        if (layerConfig.type === "text") {
          const props = normalizeLayerProperties<TextProperties>(layerConfig.properties);
          const pos = calculateExportPosition(layerConfig, canvas, exportSize, props);

          layer.add(
            new Konva.Text({
              x: pos.x + pos.width / 2,
              y: pos.y,
              width: pos.width,
              text: props.content || "",
              fontSize: (props.fontSize || 16) * scale,
              fontFamily: props.fontFamily || "Inter",
              fontStyle:
                props.fontWeight === "700"
                  ? "bold"
                  : props.fontWeight === "600"
                    ? "600"
                    : "normal",
              fill: props.color || "#000000",
              align: props.align || "center",
              lineHeight: props.lineHeight || 1.5,
              opacity: layerConfig.opacity,
              rotation: layerConfig.rotation,
              offsetX: pos.width / 2,
            })
          );
        }

        if (layerConfig.type === "image" || layerConfig.type === "screenshot") {
          const props = normalizeLayerProperties<ImageProperties>(layerConfig.properties);
          const pos = calculateExportPosition(layerConfig, canvas, exportSize, props);

          const img = loadedImages.get(props.src);
          const hasValidImage = img && img.complete && img.naturalWidth > 0;
          const borderRadius = (props.borderRadius || 0) * scale;

          const outerGroup = new Konva.Group({
            x: pos.x + pos.width / 2,
            y: pos.y + pos.height / 2,
            rotation: layerConfig.rotation,
            opacity: layerConfig.opacity,
          });

          if (props.shadow) {
            const shadowOffsetX = (props.shadowOffsetX || 0) * scale;
            const shadowOffsetY = (props.shadowOffsetY || 4) * scale;
            const shadowBlur = Math.max((props.shadowBlur || 20) * scale, 1);

            let shadowOpacity = 0.25;
            if (props.shadowColor) {
              const rgbaMatch = props.shadowColor.match(/rgba?\([^)]+,\s*([\d.]+)\s*\)/);
              if (rgbaMatch) {
                shadowOpacity = parseFloat(rgbaMatch[1]);
              }
            }

            const blurPadding = shadowBlur * 3;

            const shadowRect = new Konva.Rect({
              x: -pos.width / 2 + shadowOffsetX,
              y: -pos.height / 2 + shadowOffsetY,
              width: pos.width,
              height: pos.height,
              fill: "black",
              cornerRadius: borderRadius,
              opacity: shadowOpacity,
            });
            shadowRect.filters([Konva.Filters.Blur]);
            shadowRect.blurRadius(shadowBlur);

            shadowRect.cache({
              x: -blurPadding,
              y: -blurPadding,
              width: pos.width + blurPadding * 2,
              height: pos.height + blurPadding * 2,
            });
            outerGroup.add(shadowRect);
          }

          if (hasValidImage) {
            const imageGroup = new Konva.Group({
              x: -pos.width / 2,
              y: -pos.height / 2,
            });

            imageGroup.clipFunc((ctx) => {
              ctx.beginPath();
              if (borderRadius > 0) {
                ctx.moveTo(borderRadius, 0);
                ctx.lineTo(pos.width - borderRadius, 0);
                ctx.arcTo(pos.width, 0, pos.width, borderRadius, borderRadius);
                ctx.lineTo(pos.width, pos.height - borderRadius);
                ctx.arcTo(pos.width, pos.height, pos.width - borderRadius, pos.height, borderRadius);
                ctx.lineTo(borderRadius, pos.height);
                ctx.arcTo(0, pos.height, 0, pos.height - borderRadius, borderRadius);
                ctx.lineTo(0, borderRadius);
                ctx.arcTo(0, 0, borderRadius, 0, borderRadius);
              } else {
                ctx.rect(0, 0, pos.width, pos.height);
              }
              ctx.closePath();
            });

            const imgNaturalWidth = img.naturalWidth;
            const imgNaturalHeight = img.naturalHeight;
            const containerWidth = pos.width;
            const containerHeight = pos.height;
            
            const imgAspect = imgNaturalWidth / imgNaturalHeight;
            const containerAspect = containerWidth / containerHeight;
            
            let drawWidth: number;
            let drawHeight: number;
            let drawX: number;
            let drawY: number;
            
            if (imgAspect > containerAspect) {
              drawHeight = containerHeight;
              drawWidth = containerHeight * imgAspect;
              drawX = (containerWidth - drawWidth) / 2;
              drawY = 0;
            } else {
              drawWidth = containerWidth;
              drawHeight = containerWidth / imgAspect;
              drawX = 0;
              drawY = (containerHeight - drawHeight) / 2;
            }

            imageGroup.add(
              new Konva.Image({
                x: drawX,
                y: drawY,
                width: drawWidth,
                height: drawHeight,
                image: img,
              })
            );
            outerGroup.add(imageGroup);
          } else {
            outerGroup.add(
              new Konva.Rect({
                x: -pos.width / 2,
                y: -pos.height / 2,
                width: pos.width,
                height: pos.height,
                fill: "#e2e8f0",
                cornerRadius: borderRadius,
              })
            );
          }

          layer.add(outerGroup);
        }
      }

      layer.draw();

      return new Promise((resolve) => {
        try {
          offscreenStage.toBlob({
            callback: (blob) => {
              offscreenStage.destroy();
              container.remove();
              resolve(blob);
            },
            mimeType: "image/png",
            pixelRatio: 1,
          });
        } catch (error) {
          console.error("Export error:", error);
          offscreenStage.destroy();
          container.remove();
          resolve(null);
        }
      });
    },
    [loadedImages]
  );

  const buildExportPath = (exportSize: ExportSize, slideIndex: number) => {
    const platform = exportSize.platform?.toLowerCase();
    const nameLower = (exportSize.name || "").toLowerCase();
    const minDimension = Math.min(exportSize.width, exportSize.height);
    const aspectRatio = Math.max(exportSize.width, exportSize.height) / Math.max(minDimension, 1);

    const isIos = platform === "ios";
    const isAndroid = platform === "android";

    const isIpadLike = nameLower.includes("ipad") || nameLower.includes("pad");
    const isTabletLike = nameLower.includes("tablet") || nameLower.includes("tab") || nameLower.includes("pad");
    const ipadBySize = minDimension >= 1500 && aspectRatio <= 1.7;
    const tabletBySize = minDimension >= 1200 && aspectRatio <= 1.9;

    const rootFolder = isIos ? "ios" : isAndroid ? "android" : "other";

    let deviceFolder = "other";
    if (isIos) {
      const isIpad = isIpadLike || ipadBySize;
      deviceFolder = isIpad ? "ios-ipad" : "ios-iphone";
    } else if (isAndroid) {
      const isTablet = isTabletLike || tabletBySize;
      deviceFolder = isTablet ? "android-tablet" : "android-phone";
    }

    const filename = `${exportSize.name.replace(/[^a-z0-9]/gi, "_")}_${exportSize.width}x${exportSize.height}_slide${slideIndex + 1}.png`;

    return `${rootFolder}/${deviceFolder}/${filename}`;
  };

  const getDeviceConfigForExport = (exportSize: ExportSize): DeviceConfig | null => {
    const deviceKey = `${exportSize.name}-${exportSize.width}x${exportSize.height}`;

    if (deviceConfigs[deviceKey]) {
      const config = deviceConfigs[deviceKey];
      
      if (config.slides && config.slides.length > 0) {
        return config;
      }
      
      const oldCanvas = (config as any).canvas || {
        width: exportSize.width,
        height: exportSize.height,
        backgroundColor: "#FFFFFF",
      };
      const oldLayers = (config as any).layers || [];
      
      return {
        exportSize: config.exportSize,
        slides: [{
          id: `slide-${deviceKey.replace(/[^a-z0-9]/gi, "-")}-0`,
          canvas: oldCanvas,
          layers: oldLayers,
        }],
        isModified: config.isModified,
      };
    }

    const baseCanvas = project?.projectConfig.canvas || {
      width: 1242,
      height: 2688,
      backgroundColor: "#D8E5D8",
    };
    const baseLayers = project?.projectConfig.layers || [];

    const scaleX = exportSize.width / baseCanvas.width;
    const scaleY = exportSize.height / baseCanvas.height;

    const scaledLayers = baseLayers.map((layer) => {
      const props = layer.properties as any;
      return {
        ...layer,
        x: Math.round(layer.x * scaleX),
        y: Math.round(layer.y * scaleY),
        width: Math.round(layer.width * scaleX),
        height: Math.round(layer.height * scaleY),
        properties: {
          ...props,
          fontSize: props.fontSize ? Math.round(props.fontSize * Math.min(scaleX, scaleY)) : props.fontSize,
          offsetX: props.offsetX ? Math.round(props.offsetX * scaleX) : props.offsetX,
          offsetY: props.offsetY !== undefined ? Math.round(props.offsetY * scaleY) : props.offsetY,
          borderRadius: props.borderRadius ? Math.round(props.borderRadius * Math.min(scaleX, scaleY)) : props.borderRadius,
          shadowBlur: props.shadowBlur ? Math.round(props.shadowBlur * Math.min(scaleX, scaleY)) : props.shadowBlur,
          shadowOffsetX: props.shadowOffsetX ? Math.round(props.shadowOffsetX * scaleX) : props.shadowOffsetX,
          shadowOffsetY: props.shadowOffsetY ? Math.round(props.shadowOffsetY * scaleY) : props.shadowOffsetY,
        },
      };
    });

    return {
      exportSize,
      slides: [{
        id: `slide-fallback-0`,
        canvas: {
          width: exportSize.width,
          height: exportSize.height,
          backgroundColor: baseCanvas.backgroundColor,
        },
        layers: scaledLayers,
      }],
      isModified: false,
    };
  };

  const getTotalImages = () => {
    let total = 0;
    const sizes = project?.template?.jsonConfig.exports || [];
    sizes.forEach((size) => {
      const key = `${size.name}-${size.width}x${size.height}`;
      if (selectedSizes.has(key)) {
        const config = getDeviceConfigForExport(size);
        total += config?.slides?.length || 1;
      }
    });
    return total;
  };

  const handleExport = async () => {
    if (!project || selectedSizes.size === 0) return;

    setIsExporting(true);
    setExportProgress(0);

    const zip = new JSZip();
    const sizes = project.template?.jsonConfig.exports || [];
    const selectedExports = sizes.filter((s) =>
      selectedSizes.has(`${s.name}-${s.width}x${s.height}`)
    );

    // Count total slides to export
    let totalOperations = 0;
    selectedExports.forEach((exportSize) => {
      const config = getDeviceConfigForExport(exportSize);
      totalOperations += config?.slides?.length || 1;
    });

    let completed = 0;

    for (const exportSize of selectedExports) {
      const config = getDeviceConfigForExport(exportSize);

      if (config && config.slides) {
        for (let slideIndex = 0; slideIndex < config.slides.length; slideIndex++) {
          const slide = config.slides[slideIndex];
          const blob = await renderSlide(slide, exportSize);
          if (blob) {
            const filepath = buildExportPath(exportSize, slideIndex);
            zip.file(filepath, blob);
          }
          completed++;
          setExportProgress((completed / totalOperations) * 100);
        }
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${project.name.replace(/[^a-z0-9]/gi, "_")}_screenshots.zip`);

    setIsExporting(false);
    setExportComplete(true);
    setTimeout(() => setExportComplete(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(160 84% 39% / 0.15), transparent)",
          }}
        />
        <div className="text-center relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Preparing export...</p>
        </div>
      </div>
    );
  }

  const exportSizes = project?.template?.jsonConfig.exports || [];
  const iosSizes = exportSizes.filter((s) => s.platform === "ios");
  const androidSizes = exportSizes.filter((s) => s.platform === "android");
  const totalImages = getTotalImages();

  return (
    <div className="min-h-screen bg-background">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(160 84% 39% / 0.15), transparent)",
        }}
      />

      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to={`/editor/${projectId}`}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Export Screenshots</h1>
                  <p className="text-sm text-muted-foreground">{project?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-card border border-border rounded-2xl">
              <h2 className="text-lg font-bold text-foreground mb-4">Export Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary rounded-xl text-center">
                  <p className="text-3xl font-bold text-primary">{selectedSizes.size}</p>
                  <p className="text-sm text-muted-foreground">Devices</p>
                </div>
                <div className="p-4 bg-secondary rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-400">{totalImages}</p>
                  <p className="text-sm text-muted-foreground">Images</p>
                </div>
              </div>
            </div>

            {iosSizes.length > 0 && (
              <div className="p-6 bg-card border border-border rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-foreground rounded-xl">
                      <Apple className="w-5 h-5 text-background" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">iOS App Store</h3>
                      <p className="text-sm text-muted-foreground">{iosSizes.length} sizes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => selectAllPlatform("ios")}
                    className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {iosSizes.map((size) => {
                    const key = `${size.name}-${size.width}x${size.height}`;
                    const isSelected = selectedSizes.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleSize(key)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "bg-foreground border-foreground text-background"
                            : "bg-card border-border hover:border-primary/50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-primary" : "bg-secondary"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{size.name}</p>
                          <p className="text-sm font-semibold">
                            {size.width} × {size.height}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {androidSizes.length > 0 && (
              <div className="p-6 bg-card border border-border rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-xl">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Google Play Store</h3>
                      <p className="text-sm text-muted-foreground">{androidSizes.length} sizes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => selectAllPlatform("android")}
                    className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {androidSizes.map((size) => {
                    const key = `${size.name}-${size.width}x${size.height}`;
                    const isSelected = selectedSizes.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleSize(key)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-white"
                            : "bg-card border-border hover:border-primary/50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-white" : "bg-secondary"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{size.name}</p>
                          <p
                            className={`text-sm ${
                              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {size.width} × {size.height}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-card border border-border rounded-2xl sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-secondary rounded-xl">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{totalImages} images</p>
                  <p className="text-sm text-muted-foreground">ZIP archive</p>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting || selectedSizes.size === 0}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 font-semibold rounded-xl transition-all ${
                  selectedSizes.size === 0
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                }`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Exporting... {Math.round(exportProgress)}%
                  </>
                ) : exportComplete ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Complete!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Export Screenshots
                  </>
                )}
              </button>

              {isExporting && (
                <div className="mt-4">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedSizes.size === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Select at least one size
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {exportComplete && (
        <div className="fixed bottom-8 right-8">
          <div className="flex items-center gap-3 px-5 py-4 bg-card border border-border rounded-2xl shadow-2xl">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Export Complete!</p>
              <p className="text-sm text-muted-foreground">{totalImages} images downloaded</p>
            </div>
            <button
              onClick={() => setExportComplete(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
