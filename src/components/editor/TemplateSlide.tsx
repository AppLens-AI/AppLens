import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  LayerConfig,
  TextProperties,
  ImageProperties,
  ShapeProperties,
  GradientProperties,
  BackgroundColorProperties,
} from "@/types";
import { useEditorStore } from "@/stores/editorStore";
import { uploadApi } from "@/lib/api";
import {
  calculateLayerStyle,
  LayoutConfig,
  normalizeLayerProperties,
  TemplateSlideProps,
  gradientToCSS,
  TEXT_RENDER_PADDING,
} from "@/lib/layerUtils";
import { ImagePlus, Smartphone, Loader2 } from "lucide-react";

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type AnchorX = "left" | "center" | "right";
type Position =
  | "center"
  | "top"
  | "bottom"
  | "top-overflow"
  | "bottom-overflow";

interface InteractionState {
  mode: "move" | "resize";
  layerId: string;
  handle?: ResizeHandle;
  startPointerX: number;
  startPointerY: number;
  startCenterX: number;
  startCenterY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
  anchorX: AnchorX;
  position: Position;
}

export default function TemplateSlide({
  canvas,
  layers,
  isActive,
  onClick,
}: TemplateSlideProps) {
  const { selectedLayerId, setSelectedLayerId, updateLayer, pushHistory, snapToGrid, gridSize, showSmartGuides } =
    useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingLayerId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set());
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [smartGuides, setSmartGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  // Reactive scale factor — updated before paint and on container resize
  const [scaleFactor, setScaleFactor] = useState(0);

  // Compute scale synchronously after DOM update (before paint) so the first
  // visible frame already uses the correct pixel sizes.
  useLayoutEffect(() => {
    if (containerRef.current) {
      setScaleFactor(containerRef.current.offsetWidth / canvas.width);
    }
  }, [canvas.width, canvas.height, layers]);

  // Keep scale in sync when the container is resized (window resize, panel toggle, etc.)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setScaleFactor(el.offsetWidth / canvas.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [canvas.width]);

  const getScaleFactor = () => {
    if (!containerRef.current) return scaleFactor || 1;
    return containerRef.current.offsetWidth / canvas.width;
  };

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const scale = getScaleFactor();

    if (!rect) return { x: 0, y: 0 };

    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const computeCenter = (
    layer: LayerConfig,
    anchorX: AnchorX,
    position: Position,
    offsetX = 0,
    offsetY = 0,
  ) => {
    const { width, height } = layer;
    let centerX: number;

    switch (anchorX) {
      case "left":
        centerX = offsetX + width / 2;
        break;
      case "right":
        centerX = canvas.width - offsetX - width / 2;
        break;
      case "center":
      default:
        centerX = canvas.width / 2 + offsetX;
        break;
    }

    let centerY: number;
    if (position === "bottom") {
      centerY = canvas.height - offsetY - height / 2;
    } else {
      centerY = offsetY;
    }

    return { centerX, centerY };
  };

  const centerToOffsets = (
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    anchorX: AnchorX,
    position: Position,
  ) => {
    let offsetX: number;
    switch (anchorX) {
      case "left":
        offsetX = centerX - width / 2;
        break;
      case "right":
        offsetX = canvas.width - centerX - width / 2;
        break;
      case "center":
      default:
        offsetX = centerX - canvas.width / 2;
        break;
    }

    const offsetY =
      position === "bottom" ? canvas.height - centerY - height / 2 : centerY;

    return { offsetX, offsetY };
  };

  const startMove = (
    e: React.MouseEvent,
    layer: LayerConfig,
    props: Partial<TextProperties | ImageProperties | ShapeProperties>,
  ) => {
    if (!isActive || layer.locked || e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const anchorX: AnchorX = (props.anchorX as AnchorX) || "center";
    const position: Position = (props.position as Position) || "center";
    const offsetX = (props.offsetX as number) || 0;
    const offsetY = props.offsetY !== undefined ? (props.offsetY as number) : 0;

    const { centerX, centerY } = computeCenter(
      layer,
      anchorX,
      position,
      offsetX,
      offsetY,
    );
    const pointer = getCanvasPoint(e.clientX, e.clientY);

    pushHistory();
    setSelectedLayerId(layer.id);
    setInteraction({
      mode: "move",
      layerId: layer.id,
      startPointerX: pointer.x,
      startPointerY: pointer.y,
      startCenterX: centerX,
      startCenterY: centerY,
      startWidth: layer.width,
      startHeight: layer.height,
      startLeft: centerX - layer.width / 2,
      startTop: centerY - layer.height / 2,
      anchorX,
      position,
    });
  };

  const startResize = (
    e: React.MouseEvent,
    layer: LayerConfig,
    props: Partial<TextProperties | ImageProperties | ShapeProperties>,
    handle: ResizeHandle,
  ) => {
    if (!isActive || layer.locked || e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const anchorX: AnchorX = (props.anchorX as AnchorX) || "center";
    const position: Position = (props.position as Position) || "center";
    const offsetX = (props.offsetX as number) || 0;
    const offsetY = props.offsetY !== undefined ? (props.offsetY as number) : 0;

    const { centerX, centerY } = computeCenter(
      layer,
      anchorX,
      position,
      offsetX,
      offsetY,
    );
    const pointer = getCanvasPoint(e.clientX, e.clientY);

    pushHistory();
    setSelectedLayerId(layer.id);
    setInteraction({
      mode: "resize",
      handle,
      layerId: layer.id,
      startPointerX: pointer.x,
      startPointerY: pointer.y,
      startCenterX: centerX,
      startCenterY: centerY,
      startWidth: layer.width,
      startHeight: layer.height,
      startLeft: centerX - layer.width / 2,
      startTop: centerY - layer.height / 2,
      anchorX,
      position,
    });
  };

  const renderResizeHandles = (
    layer: LayerConfig,
    props: Partial<TextProperties | ImageProperties | ShapeProperties>,
  ) => {
    const handles: Array<{ id: ResizeHandle; style: React.CSSProperties }> = [
      { id: "nw", style: { top: "-6px", left: "-6px", cursor: "nwse-resize" } },
      {
        id: "n",
        style: {
          top: "-6px",
          left: "50%",
          transform: "translateX(-50%)",
          cursor: "ns-resize",
        },
      },
      {
        id: "ne",
        style: { top: "-6px", right: "-6px", cursor: "nesw-resize" },
      },
      {
        id: "e",
        style: {
          top: "50%",
          right: "-6px",
          transform: "translateY(-50%)",
          cursor: "ew-resize",
        },
      },
      {
        id: "se",
        style: { bottom: "-6px", right: "-6px", cursor: "nwse-resize" },
      },
      {
        id: "s",
        style: {
          bottom: "-6px",
          left: "50%",
          transform: "translateX(-50%)",
          cursor: "ns-resize",
        },
      },
      {
        id: "sw",
        style: { bottom: "-6px", left: "-6px", cursor: "nesw-resize" },
      },
      {
        id: "w",
        style: {
          top: "50%",
          left: "-6px",
          transform: "translateY(-50%)",
          cursor: "ew-resize",
        },
      },
    ];

    return (
      <div className="absolute inset-0 pointer-events-none">
        {handles.map((handle) => (
          <div
            key={handle.id}
            style={{
              position: "absolute",
              width: 12,
              height: 12,
              borderRadius: "9999px",
              background: "white",
              border: "2px solid #22c55e",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              ...handle.style,
            }}
            className="pointer-events-auto"
            onMouseDown={(e) => startResize(e, layer, props, handle.id)}
          />
        ))}
      </div>
    );
  };

  const handleLayerClick = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    setSelectedLayerId(layerId);
  };

  const handleCanvasClick = () => {
    onClick();
    setSelectedLayerId(null);
  };

  const handleImageUpload = async (layerId: string, file: File) => {
    setLoadingLayers((prev) => new Set(prev).add(layerId));

    try {
      const response = await uploadApi.uploadImage(file);
      const imageUrl = response.data.data.url;

      const state = useEditorStore.getState();
      const layer = state.layers.find((l) => l.id === layerId);

      if (layer) {
        updateLayer(layerId, {
          properties: {
            ...layer.properties,
            src: imageUrl,
          },
        });
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setLoadingLayers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(layerId);
        return newSet;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingLayerId.current) {
      handleImageUpload(uploadingLayerId.current, file);
    }
    uploadingLayerId.current = null;
    if (e.target) {
      e.target.value = "";
    }
  };

  const triggerFileUpload = (layerId: string) => {
    uploadingLayerId.current = layerId;
    fileInputRef.current?.click();
  };

  const renderLayer = (layer: LayerConfig) => {
    if (!layer.visible || scaleFactor === 0) return null;

    const isSelected = selectedLayerId === layer.id && isActive;

    const selectionStyle: React.CSSProperties = isSelected
      ? {
          outline: "2px solid #4ADE80",
          outlineOffset: "2px",
          borderRadius: "4px",
        }
      : {};

    switch (layer.type) {
      case "text": {
        const props = normalizeLayerProperties<TextProperties>(
          layer.properties,
        );

        const layoutConfig: LayoutConfig = {
          position: props.position || "center",
          anchorX: props.anchorX || "center",
          anchorY: props.anchorY || "top",
          offsetX: props.offsetX || 0,
          offsetY: props.offsetY !== undefined ? props.offsetY : 0,
        };

        const baseStyle = calculateLayerStyle(layer, canvas, layoutConfig);

        return (
          <div
            key={layer.id}
            onClick={(e) => handleLayerClick(e, layer.id)}
            onMouseDown={(e) => startMove(e, layer, props)}
            style={{
              ...baseStyle,
              ...selectionStyle,
              fontFamily: props.fontFamily || "Inter",
              fontSize: `${(props.fontSize || 16) * scaleFactor}px`,
              fontWeight: props.fontWeight || "400",
              color: props.color || "#000000",
              textAlign: (props.align || "left") as "left" | "center" | "right",
              lineHeight: props.lineHeight || 1.5,
              whiteSpace: "pre-wrap",
              padding: `${TEXT_RENDER_PADDING * scaleFactor}px`,
              cursor: layer.locked || !isActive ? "default" : "move",
            }}
            className={`transition-all duration-150 ${
              !layer.locked
                ? "hover:outline hover:outline-2 hover:outline-emerald-400/50 hover:outline-offset-2"
                : ""
            }`}
          >
            {props.content || ""}
            {isSelected && isActive && renderResizeHandles(layer, props)}
          </div>
        );
      }

      case "image":
      case "screenshot": {
        const props = normalizeLayerProperties<ImageProperties>(
          layer.properties,
        );
        const isLoading = loadingLayers.has(layer.id);

        const layoutConfig: LayoutConfig = {
          position: props.position || "center",
          anchorX: props.anchorX || "center",
          anchorY: props.anchorY || "center",
          offsetX: props.offsetX || 0,
          offsetY: props.offsetY !== undefined ? props.offsetY : 0,
          scale: props.scale || 1,
        };

        const baseStyle = calculateLayerStyle(layer, canvas, layoutConfig);
        const borderRadius = (props.borderRadius || 0) * scaleFactor;
        const shadowOffsetX = (props.shadowOffsetX || 0) * scaleFactor;
        const shadowOffsetY = (props.shadowOffsetY || 4) * scaleFactor;
        const shadowBlur = (props.shadowBlur || 20) * scaleFactor;

        const hasFrameBorder =
          props.frameBorder && (props.frameBorderWidth || 0) > 0;
        const frameBorderWidth = (props.frameBorderWidth || 0) * scaleFactor;
        const frameBorderColor = props.frameBorderColor || "#1a1a1a";
        const frameBorderRadiusTL =
          (props.frameBorderRadiusTL ?? borderRadius / scaleFactor) *
          scaleFactor;
        const frameBorderRadiusTR =
          (props.frameBorderRadiusTR ?? borderRadius / scaleFactor) *
          scaleFactor;
        const frameBorderRadiusBL =
          (props.frameBorderRadiusBL ?? borderRadius / scaleFactor) *
          scaleFactor;
        const frameBorderRadiusBR =
          (props.frameBorderRadiusBR ?? borderRadius / scaleFactor) *
          scaleFactor;
        const frameRadius = `${frameBorderRadiusTL}px ${frameBorderRadiusTR}px ${frameBorderRadiusBR}px ${frameBorderRadiusBL}px`;

        const is3D = props.enable3D || false;
        const perspective3D = props.perspective ?? 1000;
        const rotX = props.rotateX ?? 0;
        const rotY = props.rotateY ?? 0;
        const rotZ = props.rotateZ ?? 0;

        const baseTransform = baseStyle.transform || "";
        const scaledPerspective = perspective3D * scaleFactor;
        const transform3D = is3D
          ? `${baseTransform} perspective(${scaledPerspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
          : baseTransform;

        return (
          <div
            key={layer.id}
            onClick={(e) => handleLayerClick(e, layer.id)}
            onMouseDown={(e) => startMove(e, layer, props)}
            style={{
              ...baseStyle,
              ...selectionStyle,
              transform: transform3D,
              transformStyle: is3D ? "preserve-3d" : undefined,
              borderRadius: hasFrameBorder ? frameRadius : `${borderRadius}px`,
              overflow: "visible",
              boxShadow: props.shadow
                ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${
                    props.shadowColor || "rgba(0,0,0,0.25)"
                  }`
                : "none",
              border: hasFrameBorder
                ? `${frameBorderWidth}px solid ${frameBorderColor}`
                : "none",
              boxSizing: "border-box",
              cursor: layer.locked || !isActive ? "default" : "move",
            }}
            className={`transition-all duration-150 ${
              !layer.locked
                ? "hover:outline hover:outline-2 hover:outline-emerald-400/50 hover:outline-offset-2"
                : ""
            }`}
          >
            {props.src ? (
              <div
                className="relative w-full h-full"
                style={{
                  overflow: "hidden",
                  borderRadius: hasFrameBorder
                    ? `${Math.max(0, frameBorderRadiusTL - frameBorderWidth)}px ${Math.max(0, frameBorderRadiusTR - frameBorderWidth)}px ${Math.max(0, frameBorderRadiusBR - frameBorderWidth)}px ${Math.max(0, frameBorderRadiusBL - frameBorderWidth)}px`
                    : `${borderRadius}px`,
                }}
              >
                <img
                  src={props.src}
                  alt={layer.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {isSelected && isActive && renderResizeHandles(layer, props)}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                      <div className="relative bg-card/90 backdrop-blur-sm p-4 rounded-full shadow-2xl">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="w-full h-full bg-gradient-to-br from-secondary to-muted flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border relative"
                style={{
                  borderRadius: hasFrameBorder
                    ? `${Math.max(0, frameBorderRadiusTL - frameBorderWidth)}px ${Math.max(0, frameBorderRadiusTR - frameBorderWidth)}px ${Math.max(0, frameBorderRadiusBR - frameBorderWidth)}px ${Math.max(0, frameBorderRadiusBL - frameBorderWidth)}px`
                    : `${borderRadius}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLayerClick(e, layer.id);
                  if (!isLoading) {
                    triggerFileUpload(layer.id);
                  }
                }}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                      <div className="relative bg-card/90 backdrop-blur-sm p-4 rounded-full shadow-2xl">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium animate-pulse">
                      Uploading...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-card/50 rounded-full">
                      {layer.type === "screenshot" ? (
                        <Smartphone className="w-10 h-10 text-muted-foreground" />
                      ) : (
                        <ImagePlus className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      {props.placeholder || "Click to add image"}
                    </span>
                    {isSelected &&
                      isActive &&
                      renderResizeHandles(layer, props)}
                  </>
                )}
              </div>
            )}
          </div>
        );
      }

      case "shape": {
        const props = normalizeLayerProperties<ShapeProperties>(
          layer.properties,
        );

        const layoutConfig: LayoutConfig = {
          position: props.position || "center",
          anchorX: props.anchorX || "center",
          anchorY: props.anchorY || "center",
          offsetX: props.offsetX || 0,
          offsetY: props.offsetY !== undefined ? props.offsetY : 0,
        };

        const baseStyle = calculateLayerStyle(layer, canvas, layoutConfig);
        const cornerRadius = (props.cornerRadius || 0) * scaleFactor;
        const strokeWidth = (props.strokeWidth || 0) * scaleFactor;

        return (
          <div
            key={layer.id}
            onClick={(e) => handleLayerClick(e, layer.id)}
            onMouseDown={(e) => startMove(e, layer, props)}
            style={{
              ...baseStyle,
              ...selectionStyle,
              backgroundColor: props.fill || "transparent",
              borderRadius:
                props.shapeType === "circle" ? "50%" : `${cornerRadius}px`,
              border: props.stroke
                ? `${strokeWidth}px solid ${props.stroke}`
                : "none",
              cursor: layer.locked || !isActive ? "default" : "move",
            }}
            className={`transition-all duration-150 ${
              !layer.locked
                ? "hover:outline hover:outline-2 hover:outline-emerald-400/50 hover:outline-offset-2"
                : ""
            }`}
          >
            {isSelected && isActive && renderResizeHandles(layer, props)}
          </div>
        );
      }

      case "gradient": {
        const props = normalizeLayerProperties<GradientProperties>(
          layer.properties,
        );

        const background = gradientToCSS(props);

        return (
          <div
            key={layer.id}
            onClick={(e) => handleLayerClick(e, layer.id)}
            onMouseDown={(e) => startMove(e, layer, props)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              background,
              opacity: layer.opacity,
              zIndex: layer.zIndex,
              cursor: layer.locked || !isActive ? "default" : "move",
              ...selectionStyle,
            }}
            className={`transition-all duration-150 ${
              !layer.locked
                ? "hover:outline hover:outline-2 hover:outline-emerald-400/50 hover:outline-offset-2"
                : ""
            }`}
          >
            {isSelected && isActive && renderResizeHandles(layer, props)}
          </div>
        );
      }

      case "backgroundColor": {
        const props = normalizeLayerProperties<BackgroundColorProperties>(
          layer.properties,
        );

        const layoutConfig: LayoutConfig = {
          position: props.position || "center",
          anchorX: props.anchorX || "center",
          anchorY: props.anchorY || "center",
          offsetX: props.offsetX || 0,
          offsetY: props.offsetY !== undefined ? props.offsetY : 0,
        };

        const baseStyle = calculateLayerStyle(layer, canvas, layoutConfig);

        return (
          <div
            key={layer.id}
            onClick={(e) => handleLayerClick(e, layer.id)}
            onMouseDown={(e) => startMove(e, layer, props)}
            style={{
              ...baseStyle,
              ...selectionStyle,
              backgroundColor: props.color || "#ffffff",
              cursor: layer.locked || !isActive ? "default" : "move",
            }}
            className={`transition-all duration-150 ${
              !layer.locked
                ? "hover:outline hover:outline-2 hover:outline-emerald-400/50 hover:outline-offset-2"
                : ""
            }`}
          >
            {isSelected && isActive && renderResizeHandles(layer, props)}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  const backgroundColor = canvas.backgroundColor;

  useEffect(() => {
    if (!interaction) return;

    const handlePointerMove = (event: MouseEvent) => {
      const state = useEditorStore.getState();
      const layer = state.layers.find((l) => l.id === interaction.layerId);

      if (!layer) return;

      const props = normalizeLayerProperties(layer.properties);
      const pointer = getCanvasPoint(event.clientX, event.clientY);
      const dx = pointer.x - interaction.startPointerX;
      const dy = pointer.y - interaction.startPointerY;

      // ── Snap-to-grid helper ──────────────────────────────────
      const snapValue = (val: number): number => {
        if (!snapToGrid || gridSize <= 0) return val;
        return Math.round(val / gridSize) * gridSize;
      };

      // ── Smart guide computation ─────────────────────────────
      const SNAP_THRESHOLD = 8; // px in canvas space
      const computeSmartGuidesForCenter = (cx: number, cy: number, w: number, h: number) => {
        if (!showSmartGuides) { setSmartGuides({ x: [], y: [] }); return { snapDx: 0, snapDy: 0 }; }

        const guidesX: number[] = [];
        const guidesY: number[] = [];

        // Canvas edges & center
        const canvasAnchorsX = [0, canvas.width / 2, canvas.width];
        const canvasAnchorsY = [0, canvas.height / 2, canvas.height];

        // Element left/center/right edges
        const elLeft = cx - w / 2;
        const elCenterX = cx;
        const elRight = cx + w / 2;
        const elTop = cy - h / 2;
        const elCenterY = cy;
        const elBottom = cy + h / 2;

        let snapDx = 0;
        let snapDy = 0;

        // Collect other layer positions for snapping
        const otherLayers = layers.filter((l) => l.id !== interaction.layerId && l.visible);
        const otherAnchorsX: number[] = [...canvasAnchorsX];
        const otherAnchorsY: number[] = [...canvasAnchorsY];

        otherLayers.forEach((otherLayer) => {
          const oProps = otherLayer.properties as any;
          const oAnchorX = oProps.anchorX || "center";
          const oPosition = oProps.position || "center";
          const oOffsetX = oProps.offsetX || 0;
          const oOffsetY = oProps.offsetY !== undefined ? oProps.offsetY : 0;
          const { centerX: oCX, centerY: oCY } = computeCenter(otherLayer, oAnchorX, oPosition, oOffsetX, oOffsetY);
          otherAnchorsX.push(oCX - otherLayer.width / 2, oCX, oCX + otherLayer.width / 2);
          otherAnchorsY.push(oCY - otherLayer.height / 2, oCY, oCY + otherLayer.height / 2);
        });

        // Snap X
        const elXPts = [elLeft, elCenterX, elRight];
        for (const elX of elXPts) {
          for (const anchor of otherAnchorsX) {
            if (Math.abs(elX - anchor) < SNAP_THRESHOLD) {
              snapDx = anchor - elX;
              guidesX.push(anchor);
              break;
            }
          }
          if (snapDx !== 0) break;
        }

        // Snap Y
        const elYPts = [elTop, elCenterY, elBottom];
        for (const elY of elYPts) {
          for (const anchor of otherAnchorsY) {
            if (Math.abs(elY - anchor) < SNAP_THRESHOLD) {
              snapDy = anchor - elY;
              guidesY.push(anchor);
              break;
            }
          }
          if (snapDy !== 0) break;
        }

        setSmartGuides({ x: guidesX, y: guidesY });
        return { snapDx, snapDy };
      };

      if (interaction.mode === "move") {
        let newCenterX = interaction.startCenterX + dx;
        let newCenterY = interaction.startCenterY + dy;

        // Apply snap-to-grid
        if (snapToGrid && gridSize > 0) {
          newCenterX = snapValue(newCenterX);
          newCenterY = snapValue(newCenterY);
        }

        // Apply smart guides snapping
        const { snapDx, snapDy } = computeSmartGuidesForCenter(
          newCenterX, newCenterY, layer.width, layer.height
        );
        newCenterX += snapDx;
        newCenterY += snapDy;

        const { offsetX, offsetY } = centerToOffsets(
          newCenterX,
          newCenterY,
          layer.width,
          layer.height,
          interaction.anchorX,
          interaction.position,
        );

        updateLayer(
          interaction.layerId,
          {
            properties: {
              ...props,
              offsetX: Math.round(offsetX * 100) / 100,
              offsetY: Math.round(offsetY * 100) / 100,
            },
          },
          { pushToHistory: false },
        );
        return;
      }

      if (interaction.mode === "resize" && interaction.handle) {
        const minSize = 20;

        let newLeft = interaction.startLeft;
        let newTop = interaction.startTop;
        let newWidth = interaction.startWidth;
        let newHeight = interaction.startHeight;

        if (interaction.handle.includes("e")) {
          newWidth = Math.max(minSize, interaction.startWidth + dx);
        }

        if (interaction.handle.includes("w")) {
          newWidth = Math.max(minSize, interaction.startWidth - dx);
          newLeft = interaction.startLeft + dx;
        }

        if (interaction.handle.includes("s")) {
          newHeight = Math.max(minSize, interaction.startHeight + dy);
        }

        if (interaction.handle.includes("n")) {
          newHeight = Math.max(minSize, interaction.startHeight - dy);
          newTop = interaction.startTop + dy;
        }

        // Apply snap-to-grid for resize
        if (snapToGrid && gridSize > 0) {
          newWidth = snapValue(newWidth);
          newHeight = snapValue(newHeight);
        }

        const newCenterX = newLeft + newWidth / 2;
        const newCenterY = newTop + newHeight / 2;

        const { offsetX, offsetY } = centerToOffsets(
          newCenterX,
          newCenterY,
          newWidth,
          newHeight,
          interaction.anchorX,
          interaction.position,
        );

        updateLayer(
          interaction.layerId,
          {
            width: Math.round(newWidth * 100) / 100,
            height: Math.round(newHeight * 100) / 100,
            properties: {
              ...props,
              offsetX: Math.round(offsetX * 100) / 100,
              offsetY: Math.round(offsetY * 100) / 100,
            },
          },
          { pushToHistory: false },
        );
      }
    };

    const handlePointerUp = () => {
      setInteraction(null);
      setSmartGuides({ x: [], y: [] });
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [interaction, updateLayer, canvas, snapToGrid, gridSize, showSmartGuides, layers]);

  return (
    <div
      ref={containerRef}
      className="relative h-full flex-shrink-0 group"
      style={{ aspectRatio: `${canvas.width}/${canvas.height}` }}
    >
      <div
        onClick={handleCanvasClick}
        className={`
          relative w-full h-full rounded-2xl overflow-hidden cursor-pointer
          transition-all duration-200
          ${
            isActive
              ? "ring-2 ring-emerald-500 ring-offset-2 shadow-xl shadow-emerald-500/20"
              : "ring-1 ring-border hover:ring-2 hover:ring-emerald-400/50 hover:shadow-lg"
          }
        `}
        style={{ backgroundColor }}
      >
        {sortedLayers.map(renderLayer)}

        {/* Grid overlay */}
        {isActive && snapToGrid && gridSize > 0 && scaleFactor > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 9997,
              opacity: 0.12,
              backgroundImage: `
                linear-gradient(to right, #22c55e 1px, transparent 1px),
                linear-gradient(to bottom, #22c55e 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize * scaleFactor}px ${gridSize * scaleFactor}px`,
            }}
          />
        )}

        {/* Smart guide lines */}
        {isActive && interaction && (smartGuides.x.length > 0 || smartGuides.y.length > 0) && scaleFactor > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 9998 }}
          >
            {smartGuides.x.map((x, i) => (
              <line
                key={`gx-${i}`}
                x1={`${(x / canvas.width) * 100}%`}
                y1="0"
                x2={`${(x / canvas.width) * 100}%`}
                y2="100%"
                stroke="#f43f5e"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.8"
              />
            ))}
            {smartGuides.y.map((y, i) => (
              <line
                key={`gy-${i}`}
                x1="0"
                y1={`${(y / canvas.height) * 100}%`}
                x2="100%"
                y2={`${(y / canvas.height) * 100}%`}
                stroke="#f43f5e"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.8"
              />
            ))}
          </svg>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
