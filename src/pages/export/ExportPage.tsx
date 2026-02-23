import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { projectsApi, getProxyImageUrl } from "@/lib/api";
import { preloadFonts } from "@/lib/fonts";
import type {
  Project,
  TextProperties,
  ImageProperties,
  ShapeProperties,
  GradientProperties,
  ExportSize,
  CanvasConfig,
  LayerConfig,
  DeviceConfigMap,
  DeviceConfig,
  SlideData,
} from "@/types";
import {
  normalizeLayerProperties,
  normalizeLayers,
  resolveGradientColors,
  resolveGradientAngle,
  gradientToKonvaStops,
  gradientLinearPoints,
  calculateExportLayerPosition,
  clampBorderRadii,
  clampUniformRadius,
  render3DToCanvas,
  TEXT_RENDER_PADDING,
} from "@/lib/layerUtils";
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
  const [loadedImages, setLoadedImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());
  const [exportComplete, setExportComplete] = useState(false);
  const [deviceConfigs, setDeviceConfigs] = useState<DeviceConfigMap>({});

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const response = await projectsApi.getById(projectId);
        const data = response.data.data as Project;
        setProject(data);

        const sizes = data.projectConfig.exports?.length
          ? data.projectConfig.exports
          : data.template?.jsonConfig.exports || [];
        setSelectedSizes(
          new Set(sizes.map((s) => `${s.name}-${s.width}x${s.height}`)),
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
                    const props = normalizeLayerProperties<ImageProperties>(
                      l.properties,
                    );
                    if (props.src) {
                      imageUrls.push(props.src);
                    }
                  });
              });
            } else {
              const layers = (config as any).layers || [];
              layers
                .filter(
                  (l: LayerConfig) =>
                    l.type === "image" || l.type === "screenshot",
                )
                .forEach((l: LayerConfig) => {
                  const props = normalizeLayerProperties<ImageProperties>(
                    l.properties,
                  );
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
    const sizes = project?.projectConfig.exports?.length
      ? project.projectConfig.exports
      : project?.template?.jsonConfig.exports || [];
    const platformSizes = sizes.filter((s) => s.platform === platform);
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      platformSizes.forEach((s) => {
        next.add(`${s.name}-${s.width}x${s.height}`);
      });
      return next;
    });
  };

  const collectProjectFonts = useCallback((): string[] => {
    const fonts = new Set<string>();

    if (Object.keys(deviceConfigs).length > 0) {
      Object.values(deviceConfigs).forEach((config) => {
        if (config.slides && config.slides.length > 0) {
          config.slides.forEach((slide) => {
            slide.layers
              .filter((l) => l.type === "text")
              .forEach((l) => {
                const props = normalizeLayerProperties<TextProperties>(
                  l.properties,
                );
                if (props.fontFamily) {
                  fonts.add(props.fontFamily);
                }
              });
          });
        }
      });
    }

    if (project?.projectConfig?.layers) {
      project.projectConfig.layers
        .filter((l) => l.type === "text")
        .forEach((l) => {
          const props = normalizeLayerProperties<TextProperties>(l.properties);
          if (props.fontFamily) {
            fonts.add(props.fontFamily);
          }
        });
    }

    return Array.from(fonts);
  }, [deviceConfigs, project]);

  // ── Konva rendering helpers ──────────────────────────────────────────────

  /** Render a shape layer onto the Konva layer. */
  const renderShapeToKonva = (
    konvaLayer: Konva.Layer,
    layerConfig: LayerConfig,
    canvas: CanvasConfig,
    exportSize: ExportSize,
  ) => {
    const props = normalizeLayerProperties<ShapeProperties>(
      layerConfig.properties,
    );
    const pos = calculateExportLayerPosition(
      layerConfig,
      canvas,
      exportSize,
      props,
    );
    const scale = Math.min(
      exportSize.width / canvas.width,
      exportSize.height / canvas.height,
    );

    if (props.shapeType === "circle") {
      konvaLayer.add(
        new Konva.Circle({
          x: pos.x + pos.width / 2,
          y: pos.y + pos.height / 2,
          radius: Math.max(pos.width, pos.height) / 2,
          fill: props.fill || "transparent",
          stroke: props.stroke || undefined,
          strokeWidth: props.stroke ? (props.strokeWidth || 0) * scale : 0,
          opacity: layerConfig.opacity,
          rotation: layerConfig.rotation,
        }),
      );
    } else {
      const shapeRadius = clampUniformRadius(
        pos.width,
        pos.height,
        (props.cornerRadius || 0) * scale,
      );
      konvaLayer.add(
        new Konva.Rect({
          x: pos.x + pos.width / 2,
          y: pos.y + pos.height / 2,
          width: pos.width,
          height: pos.height,
          fill: props.fill || "transparent",
          stroke: props.stroke || undefined,
          strokeWidth: props.stroke ? (props.strokeWidth || 0) * scale : 0,
          cornerRadius: shapeRadius,
          opacity: layerConfig.opacity,
          rotation: layerConfig.rotation,
          offsetX: pos.width / 2,
          offsetY: pos.height / 2,
        }),
      );
    }
  };

  const renderGradientToKonva = (
    konvaLayer: Konva.Layer,
    layerConfig: LayerConfig,
    exportSize: ExportSize,
  ) => {
    const props = normalizeLayerProperties<GradientProperties>(
      layerConfig.properties,
    );
    const colors = resolveGradientColors(props);
    const gradientType = props.gradientType || "linear";
    const angle = resolveGradientAngle(props);
    const w = exportSize.width;
    const h = exportSize.height;
    const konvaStops = gradientToKonvaStops(colors);

    if (gradientType === "radial") {
      const radius = Math.max(w, h) / 2;
      konvaLayer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width: w,
          height: h,
          opacity: layerConfig.opacity,
          fillRadialGradientStartPoint: { x: w / 2, y: h / 2 },
          fillRadialGradientEndPoint: { x: w / 2, y: h / 2 },
          fillRadialGradientStartRadius: 0,
          fillRadialGradientEndRadius: radius,
          fillRadialGradientColorStops: konvaStops,
        }),
      );
    } else {
      const { start, end } = gradientLinearPoints(angle, w, h);
      konvaLayer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width: w,
          height: h,
          opacity: layerConfig.opacity,
          fillLinearGradientStartPoint: start,
          fillLinearGradientEndPoint: end,
          fillLinearGradientColorStops: konvaStops,
        }),
      );
    }
  };

  /** Render a text layer onto the Konva layer. */
  const renderTextToKonva = (
    konvaLayer: Konva.Layer,
    layerConfig: LayerConfig,
    canvas: CanvasConfig,
    exportSize: ExportSize,
  ) => {
    const props = normalizeLayerProperties<TextProperties>(
      layerConfig.properties,
    );
    const pos = calculateExportLayerPosition(
      layerConfig,
      canvas,
      exportSize,
      props,
    );

    const scaleX = exportSize.width / canvas.width;
    const textPadding = TEXT_RENDER_PADDING * scaleX;

    konvaLayer.add(
      new Konva.Text({
        x: pos.x + pos.width / 2,
        y: pos.y,
        width: pos.width,
        text: props.content || "",
        fontSize: (props.fontSize || 16) * scaleX,
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
        padding: textPadding,
        opacity: layerConfig.opacity,
        rotation: layerConfig.rotation,
        offsetX: pos.width / 2,
      }),
    );
  };

  const drawRoundedRect = (
    ctx: any,
    x: number,
    y: number,
    w: number,
    h: number,
    rTL: number,
    rTR: number,
    rBR: number,
    rBL: number,
  ) => {
    // Clamp radii so arcs never overlap — mirrors CSS border-radius behaviour.
    const [tl, tr, br, bl] = clampBorderRadii(w, h, rTL, rTR, rBR, rBL);

    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
  };

  const renderImageToKonva = async (
    konvaLayer: Konva.Layer,
    layerConfig: LayerConfig,
    canvas: CanvasConfig,
    exportSize: ExportSize,
  ) => {
    const props = normalizeLayerProperties<ImageProperties>(
      layerConfig.properties,
    );
    const pos = calculateExportLayerPosition(
      layerConfig,
      canvas,
      exportSize,
      props,
    );
    const scale = Math.min(
      exportSize.width / canvas.width,
      exportSize.height / canvas.height,
    );

    const img = loadedImages.get(props.src);
    const hasValidImage = img && img.complete && img.naturalWidth > 0;
    const rawBorderRadius = (props.borderRadius || 0) * scale;

    const hasFrameBorder =
      props.frameBorder && (props.frameBorderWidth || 0) > 0;
    const frameBorderWidth = (props.frameBorderWidth || 0) * scale;
    const frameBorderColor = props.frameBorderColor || "#1a1a1a";

    const totalWidth = pos.width;
    const totalHeight = pos.height;

    const rawTL = hasFrameBorder
      ? (props.frameBorderRadiusTL ?? (props.borderRadius || 0)) * scale
      : rawBorderRadius;
    const rawTR = hasFrameBorder
      ? (props.frameBorderRadiusTR ?? (props.borderRadius || 0)) * scale
      : rawBorderRadius;
    const rawBR = hasFrameBorder
      ? (props.frameBorderRadiusBR ?? (props.borderRadius || 0)) * scale
      : rawBorderRadius;
    const rawBL = hasFrameBorder
      ? (props.frameBorderRadiusBL ?? (props.borderRadius || 0)) * scale
      : rawBorderRadius;
    const [fbRadiusTL, fbRadiusTR, fbRadiusBR, fbRadiusBL] = clampBorderRadii(
      totalWidth,
      totalHeight,
      rawTL,
      rawTR,
      rawBR,
      rawBL,
    );
    const borderRadius = clampUniformRadius(
      totalWidth,
      totalHeight,
      rawBorderRadius,
    );
    const innerWidth = hasFrameBorder
      ? totalWidth - frameBorderWidth * 2
      : totalWidth;
    const innerHeight = hasFrameBorder
      ? totalHeight - frameBorderWidth * 2
      : totalHeight;

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
        const rgbaMatch = props.shadowColor.match(
          /rgba?\([^)]+,\s*([\d.]+)\s*\)/,
        );
        if (rgbaMatch) shadowOpacity = parseFloat(rgbaMatch[1]);
      }
      const blurPadding = shadowBlur * 3;
      const shadowRect = new Konva.Rect({
        x: -totalWidth / 2 + shadowOffsetX,
        y: -totalHeight / 2 + shadowOffsetY,
        width: totalWidth,
        height: totalHeight,
        fill: "black",
        cornerRadius: hasFrameBorder
          ? [fbRadiusTL, fbRadiusTR, fbRadiusBR, fbRadiusBL]
          : borderRadius,
        opacity: shadowOpacity,
      });
      shadowRect.filters([Konva.Filters.Blur]);
      shadowRect.blurRadius(shadowBlur);
      shadowRect.cache({
        x: -blurPadding,
        y: -blurPadding,
        width: totalWidth + blurPadding * 2,
        height: totalHeight + blurPadding * 2,
      });
      outerGroup.add(shadowRect);
    }

    const [innerTL, innerTR, innerBR, innerBL] = clampBorderRadii(
      innerWidth,
      innerHeight,
      hasFrameBorder
        ? Math.max(0, fbRadiusTL - frameBorderWidth)
        : borderRadius,
      hasFrameBorder
        ? Math.max(0, fbRadiusTR - frameBorderWidth)
        : borderRadius,
      hasFrameBorder
        ? Math.max(0, fbRadiusBR - frameBorderWidth)
        : borderRadius,
      hasFrameBorder
        ? Math.max(0, fbRadiusBL - frameBorderWidth)
        : borderRadius,
    );

    if (hasValidImage) {
      const cw = Math.ceil(innerWidth);
      const ch = Math.ceil(innerHeight);
      const offCanvas = document.createElement("canvas");
      offCanvas.width = cw;
      offCanvas.height = ch;
      const offCtx = offCanvas.getContext("2d");

      if (offCtx) {
        if (innerTL > 0 || innerTR > 0 || innerBR > 0 || innerBL > 0) {
          drawRoundedRect(
            offCtx,
            0,
            0,
            cw,
            ch,
            innerTL,
            innerTR,
            innerBR,
            innerBL,
          );
          offCtx.clip();
        }

        const imgAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = cw / ch;
        let dw: number, dh: number, dx: number, dy: number;

        if (imgAspect > containerAspect) {
          dh = ch;
          dw = dh * imgAspect;
          dx = (cw - dw) / 2;
          dy = 0;
        } else {
          dw = cw;
          dh = dw / imgAspect;
          dx = 0;
          dy = (ch - dh) / 2;
        }

        offCtx.drawImage(img, dx, dy, dw, dh);

        outerGroup.add(
          new Konva.Image({
            x: -cw / 2,
            y: -ch / 2,
            width: cw,
            height: ch,
            image: offCanvas,
          }),
        );
      }
    } else {
      outerGroup.add(
        new Konva.Rect({
          x: -innerWidth / 2,
          y: -innerHeight / 2,
          width: innerWidth,
          height: innerHeight,
          fill: "#e2e8f0",
          cornerRadius: hasFrameBorder
            ? [innerTL, innerTR, innerBR, innerBL]
            : borderRadius,
        }),
      );
    }

    // Frame border ring
    if (hasFrameBorder) {
      const borderRingShape = new Konva.Shape({
        sceneFunc: (ctx, shape) => {
          const ox = -totalWidth / 2,
            oy = -totalHeight / 2;
          const ix = -innerWidth / 2,
            iy = -innerHeight / 2;
          ctx.beginPath();
          // Outer (CW)
          ctx.moveTo(ox + fbRadiusTL, oy);
          ctx.lineTo(ox + totalWidth - fbRadiusTR, oy);
          ctx.arcTo(
            ox + totalWidth,
            oy,
            ox + totalWidth,
            oy + fbRadiusTR,
            fbRadiusTR,
          );
          ctx.lineTo(ox + totalWidth, oy + totalHeight - fbRadiusBR);
          ctx.arcTo(
            ox + totalWidth,
            oy + totalHeight,
            ox + totalWidth - fbRadiusBR,
            oy + totalHeight,
            fbRadiusBR,
          );
          ctx.lineTo(ox + fbRadiusBL, oy + totalHeight);
          ctx.arcTo(
            ox,
            oy + totalHeight,
            ox,
            oy + totalHeight - fbRadiusBL,
            fbRadiusBL,
          );
          ctx.lineTo(ox, oy + fbRadiusTL);
          ctx.arcTo(ox, oy, ox + fbRadiusTL, oy, fbRadiusTL);
          ctx.closePath();
          // Inner (CCW cutout)
          ctx.moveTo(ix + innerTL, iy);
          ctx.arcTo(ix, iy, ix, iy + innerTL, innerTL);
          ctx.lineTo(ix, iy + innerHeight - innerBL);
          ctx.arcTo(
            ix,
            iy + innerHeight,
            ix + innerBL,
            iy + innerHeight,
            innerBL,
          );
          ctx.lineTo(ix + innerWidth - innerBR, iy + innerHeight);
          ctx.arcTo(
            ix + innerWidth,
            iy + innerHeight,
            ix + innerWidth,
            iy + innerHeight - innerBR,
            innerBR,
          );
          ctx.lineTo(ix + innerWidth, iy + innerTR);
          ctx.arcTo(
            ix + innerWidth,
            iy,
            ix + innerWidth - innerTR,
            iy,
            innerTR,
          );
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        },
        fill: frameBorderColor,
      });
      outerGroup.add(borderRingShape);
    }

    // ── 3D perspective rendering ────────────────────────────────────────
    const is3D = props.enable3D || false;
    const perspective3D = props.perspective ?? 1000;
    const rotX = props.rotateX ?? 0;
    const rotY = props.rotateY ?? 0;
    const rotZ = props.rotateZ ?? 0;

    if (is3D && (rotX !== 0 || rotY !== 0 || rotZ !== 0)) {
      // Render the outerGroup to a flat canvas, then apply 3D warp.
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-99999px";
      document.body.appendChild(tempContainer);

      // Padding must cover shadow overflow (~3× blur) and 3D projection.
      const pad = 2.0;
      const stageW = Math.ceil(totalWidth * pad);
      const stageH = Math.ceil(totalHeight * pad);

      const tempStage = new Konva.Stage({
        container: tempContainer,
        width: stageW,
        height: stageH,
      });
      const tempLayer = new Konva.Layer();
      tempStage.add(tempLayer);

      // Re-center the group within the padded stage
      outerGroup.x(stageW / 2);
      outerGroup.y(stageH / 2);
      tempLayer.add(outerGroup);
      tempLayer.draw();

      const flatCanvas = tempStage.toCanvas({ pixelRatio: 1 });

      // Apply 3D warp — perspective is scaled to export-pixel space.
      // render3DToCanvas returns a canvas of the SAME dimensions (no
      // additional padding), so the center stays aligned.
      const warped = render3DToCanvas(
        flatCanvas as HTMLCanvasElement,
        perspective3D * scale,
        rotX,
        rotY,
        rotZ,
      );

      tempStage.destroy();
      tempContainer.remove();

      // Place the warped canvas so its center aligns with the original
      // image center on the main export canvas.
      konvaLayer.add(
        new Konva.Image({
          x: pos.x + pos.width / 2 - warped.width / 2,
          y: pos.y + pos.height / 2 - warped.height / 2,
          width: warped.width,
          height: warped.height,
          image: warped,
          opacity: layerConfig.opacity,
        }),
      );
    } else {
      konvaLayer.add(outerGroup);
    }
  };

  const renderSlide = useCallback(
    async (slide: SlideData, exportSize: ExportSize): Promise<Blob | null> => {
      const canvas = slide.canvas;
      const layers = normalizeLayers(slide.layers);

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
        }),
      );

      const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

      for (const layerConfig of sortedLayers) {
        if (!layerConfig.visible) continue;

        switch (layerConfig.type) {
          case "shape":
            renderShapeToKonva(layer, layerConfig, canvas, exportSize);
            break;
          case "gradient":
            renderGradientToKonva(layer, layerConfig, exportSize);
            break;
          case "text":
            renderTextToKonva(layer, layerConfig, canvas, exportSize);
            break;
          case "image":
          case "screenshot":
            await renderImageToKonva(layer, layerConfig, canvas, exportSize);
            break;
        }
      }

      layer.draw();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          try {
            offscreenStage.destroy();
            container.remove();
          } catch (_) {}
          resolve(null);
        }, 15000);

        try {
          offscreenStage.toBlob({
            callback: (blob) => {
              clearTimeout(timeout);
              offscreenStage.destroy();
              container.remove();
              resolve(blob);
            },
            mimeType: "image/png",
            pixelRatio: 1,
          });
        } catch (error) {
          clearTimeout(timeout);
          console.error("Export error:", error);
          offscreenStage.destroy();
          container.remove();
          resolve(null);
        }
      });
    },
    [loadedImages],
  );

  const buildExportPath = (exportSize: ExportSize, slideIndex: number) => {
    const platform = exportSize.platform?.toLowerCase();
    const nameLower = (exportSize.name || "").toLowerCase();
    const minDimension = Math.min(exportSize.width, exportSize.height);
    const aspectRatio =
      Math.max(exportSize.width, exportSize.height) / Math.max(minDimension, 1);

    const isIos = platform === "ios";
    const isAndroid = platform === "android";

    const isIpadLike = nameLower.includes("ipad") || nameLower.includes("pad");
    const isTabletLike =
      nameLower.includes("tablet") ||
      nameLower.includes("tab") ||
      nameLower.includes("pad");
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

  const getDeviceConfigForExport = (
    exportSize: ExportSize,
  ): DeviceConfig | null => {
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
        slides: [
          {
            id: `slide-${deviceKey.replace(/[^a-z0-9]/gi, "-")}-0`,
            canvas: oldCanvas,
            layers: oldLayers,
          },
        ],
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
          fontSize: props.fontSize
            ? Math.round(props.fontSize * scaleX)
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

    return {
      exportSize,
      slides: [
        {
          id: `slide-fallback-0`,
          canvas: {
            width: exportSize.width,
            height: exportSize.height,
            backgroundColor: baseCanvas.backgroundColor,
          },
          layers: scaledLayers,
        },
      ],
      isModified: false,
    };
  };

  const getTotalImages = () => {
    let total = 0;
    const sizes = project?.projectConfig.exports?.length
      ? project.projectConfig.exports
      : project?.template?.jsonConfig.exports || [];
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

    try {
      const projectFonts = collectProjectFonts();
      if (projectFonts.length > 0) {
        await preloadFonts(projectFonts);
      }

      const zip = new JSZip();
      const sizes = project.projectConfig.exports?.length
        ? project.projectConfig.exports
        : project.template?.jsonConfig.exports || [];
      const selectedExports = sizes.filter((s) =>
        selectedSizes.has(`${s.name}-${s.width}x${s.height}`),
      );

      let totalOperations = 0;
      selectedExports.forEach((exportSize) => {
        const config = getDeviceConfigForExport(exportSize);
        totalOperations += config?.slides?.length || 1;
      });

      let completed = 0;

      for (const exportSize of selectedExports) {
        const config = getDeviceConfigForExport(exportSize);

        if (config && config.slides) {
          for (
            let slideIndex = 0;
            slideIndex < config.slides.length;
            slideIndex++
          ) {
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
      saveAs(
        zipBlob,
        `${project.name.replace(/[^a-z0-9]/gi, "_")}_screenshots.zip`,
      );

      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(160 84% 39% / 0.15), transparent)",
          }}
        />
        <div className="text-center relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Preparing export...</p>
        </div>
      </div>
    );
  }

  const exportSizes = project?.projectConfig.exports?.length
    ? project.projectConfig.exports
    : project?.template?.jsonConfig.exports || [];
  const iosSizes = exportSizes.filter((s) => s.platform === "ios");
  const androidSizes = exportSizes.filter((s) => s.platform === "android");
  const totalImages = getTotalImages();

  return (
    <div className="min-h-screen bg-background">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(160 84% 39% / 0.15), transparent)",
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
                  <h1 className="text-lg font-bold text-foreground">
                    Export Screenshots
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {project?.name}
                  </p>
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
              <h2 className="text-lg font-bold text-foreground mb-4">
                Export Summary
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary rounded-xl text-center">
                  <p className="text-3xl font-bold text-primary">
                    {selectedSizes.size}
                  </p>
                  <p className="text-sm text-muted-foreground">Devices</p>
                </div>
                <div className="p-4 bg-secondary rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-400">
                    {totalImages}
                  </p>
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
                      <h3 className="font-bold text-foreground">
                        iOS App Store
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {iosSizes.length} sizes
                      </p>
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
                          {isSelected && (
                            <Check className="w-4 h-4 text-white" />
                          )}
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
                      <h3 className="font-bold text-foreground">
                        Google Play Store
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {androidSizes.length} sizes
                      </p>
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
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{size.name}</p>
                          <p
                            className={`text-sm ${
                              isSelected
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
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
                  <p className="font-bold text-foreground">
                    {totalImages} images
                  </p>
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
              <p className="text-sm text-muted-foreground">
                {totalImages} images downloaded
              </p>
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
