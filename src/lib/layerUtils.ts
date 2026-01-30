import { Slide } from "@/stores/editorStore";
import { LayerConfig } from "@/types";

export interface TemplateSlideProps {
  slide: Slide;
  isActive: boolean;
  index?: number;
  onClick: () => void;
}

type Position =
  | "center"
  | "top"
  | "bottom"
  | "top-overflow"
  | "bottom-overflow";
type AnchorX = "left" | "center" | "right";
type AnchorY = "top" | "center" | "bottom";

export interface LayoutConfig {
  position?: Position;
  anchorX?: AnchorX;
  anchorY?: AnchorY;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
}

export function normalizeLayerProperties<T = any>(properties: any): T {
  if (!properties || typeof properties !== "object") {
    return {} as T;
  }

  const values = Object.values(properties);

  if (values.length > 0 && Array.isArray(values[0])) {
    const normalized: any = {};

    values.forEach((itemArray: any) => {
      if (Array.isArray(itemArray)) {
        let propKey: string | undefined;
        let propValue: any;

        itemArray.forEach((obj: any) => {
          if (obj && typeof obj === "object") {
            if (obj.Key === "Key") {
              propKey = obj.Value;
            } else if (obj.Key === "Value") {
              propValue = obj.Value;
            }
          }
        });

        if (propKey !== undefined && propValue !== undefined) {
          normalized[propKey] = propValue;
        }
      }
    });

    return normalized as T;
  }

  if (
    values.length > 0 &&
    typeof values[0] === "object" &&
    values[0] !== null &&
    "Key" in values[0]
  ) {
    const normalized: any = {};

    values.forEach((item: any) => {
      if (item.Key !== undefined && item.Value !== undefined) {
        normalized[item.Key] = item.Value;
      }
    });

    return normalized as T;
  }

  return properties as T;
}

/**
 * Normalizes a layer's properties from MongoDB format
 * This should be called when loading layers from the backend
 */
export function normalizeLayer(layer: LayerConfig): LayerConfig {
  return {
    ...layer,
    properties: normalizeLayerProperties(layer.properties),
  };
}

/**
 * Normalizes all layers in an array
 */
export function normalizeLayers(layers: LayerConfig[]): LayerConfig[] {
  return layers.map(normalizeLayer);
}

export function calculateLayerStyle(
  layer: LayerConfig,
  canvas: { width: number; height: number },
  layoutConfig: LayoutConfig,
): React.CSSProperties {
  const {
    position = "center",
    anchorX = "center",
    anchorY = "center",
    offsetX = 0,
    offsetY = 0,
    scale = 1,
  } = layoutConfig;

  const isFullBackground =
    layer.type === "shape" &&
    layer.x === 0 &&
    layer.y === 0 &&
    layer.width === canvas.width &&
    layer.height === canvas.height;

  if (isFullBackground) {
    return {
      position: "absolute",
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
      opacity: layer.opacity,
      zIndex: layer.zIndex,
    };
  }

  const widthPercent = (layer.width / canvas.width) * 100 * scale;
  const heightPercent = (layer.height / canvas.height) * 100 * scale;

  let left: string;
  let translateX: string;

  const offsetXPercent = (offsetX / canvas.width) * 100;

  switch (anchorX) {
    case "left":
      left = `${offsetXPercent}%`;
      translateX = "0";
      break;
    case "right":
      left = `${100 - offsetXPercent}%`;
      translateX = "-100%";
      break;
    case "center":
    default:
      // Center at 50% and shift by offsetX so drag updates reflect on canvas
      left = `${50 + offsetXPercent}%`;
      translateX = "-50%";
      break;
  }

  let top: string;
  let translateY: string;

  switch (position) {
    case "top":
      top = `${(offsetY / canvas.height) * 100}%`;
      translateY =
        anchorY === "center" ? "-50%" : anchorY === "bottom" ? "-100%" : "0";
      break;
    case "bottom":
      top = `${100 - (offsetY / canvas.height) * 100}%`;
      translateY = "-100%";
      break;
    case "top-overflow":
      top = `${(offsetY / canvas.height) * 100}%`;
      translateY = anchorY === "bottom" ? "-100%" : "0";
      break;
    case "bottom-overflow":
      top = `${(offsetY / canvas.height) * 100}%`;
      translateY = "0";
      break;
    case "center":
    default:
      // Use offsetY as absolute position from top
      top = `${(offsetY / canvas.height) * 100}%`;
      translateY = "-50%";
      break;
  }

  if (layer.type === "text") {
    translateY = "0";
  }

  return {
    position: "absolute",
    left,
    top,
    width: layer.type === "text" ? `${widthPercent}%` : `${widthPercent}%`,
    height: layer.type === "text" ? "auto" : `${heightPercent}%`,
    transform: `translate(${translateX}, ${translateY}) rotate(${layer.rotation}deg)`,
    opacity: layer.opacity,
    cursor: layer.locked ? "default" : "pointer",
    zIndex: layer.zIndex,
  };
}
