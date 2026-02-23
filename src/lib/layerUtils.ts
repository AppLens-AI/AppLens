import {
  LayerConfig,
  CanvasConfig,
  ExportSize,
  GradientProperties,
  GradientStop,
} from "@/types";

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * Canvas-space padding for text elements (in design-coordinate pixels).
 * Used by both the editor preview and Konva export to guarantee identical
 * text inset.  At a typical editor scale-factor of ~0.33 this resolves to
 * roughly 4 CSS pixels — matching the previous hard-coded `padding: 4px`.
 */
export const TEXT_RENDER_PADDING = 12;

// ── Gradient helpers ─────────────────────────────────────────────────────────

const DEFAULT_STOPS: [GradientStop, GradientStop] = [
  { color: "#667eea", position: 0 },
  { color: "#764ba2", position: 100 },
];

/** Normalise any gradient layer's color props into exactly 2 validated stops. */
export function resolveGradientColors(
  props: GradientProperties,
): [GradientStop, GradientStop] {
  const raw = Array.isArray(props.colors) ? props.colors.slice(0, 2) : [];
  return [raw[0] ?? DEFAULT_STOPS[0], raw[1] ?? DEFAULT_STOPS[1]];
}

/** Safe angle – always a finite number, default 180. */
export function resolveGradientAngle(props: GradientProperties): number {
  const a = props.angle;
  return typeof a === "number" && isFinite(a) ? a : 180;
}

/** CSS background string used by the editor preview. */
export function gradientToCSS(props: GradientProperties): string {
  const colors = resolveGradientColors(props);
  const type = props.gradientType || "linear";
  const angle = resolveGradientAngle(props);

  const stops = colors
    .map((c) => `${c.color} ${Math.min(100, Math.max(0, c.position))}%`)
    .join(", ");

  return type === "radial"
    ? `radial-gradient(circle, ${stops})`
    : `linear-gradient(${angle}deg, ${stops})`;
}

/** Konva-native flat color-stop array: [offset, color, offset, color, …] */
export function gradientToKonvaStops(
  colors: [GradientStop, GradientStop],
): (string | number)[] {
  const out: (string | number)[] = [];
  for (const stop of colors) {
    const pos = Number(stop.position);
    const safe = isFinite(pos) ? Math.min(1, Math.max(0, pos / 100)) : 0;
    out.push(safe, stop.color || "#000000");
  }
  return out;
}

/**
 * Compute the start/end points for a Konva linear gradient that matches
 * the CSS `linear-gradient(Xdeg, …)` convention.
 */
export function gradientLinearPoints(
  angle: number,
  w: number,
  h: number,
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    start: {
      x: w / 2 - (Math.cos(rad) * w) / 2,
      y: h / 2 - (Math.sin(rad) * h) / 2,
    },
    end: {
      x: w / 2 + (Math.cos(rad) * w) / 2,
      y: h / 2 + (Math.sin(rad) * h) / 2,
    },
  };
}

// ── Border-radius clamping ───────────────────────────────────────────────────

/**
 * Clamp four corner radii so they never exceed the rectangle's dimensions.
 *
 * This replicates the CSS border-radius clamping algorithm (CSS Backgrounds
 * Level 3, §5.5): when the sum of adjacent radii exceeds a side's length all
 * radii are scaled down proportionally so the arcs fit.
 *
 * Works for both uniform and per-corner radii and is safe to call with any
 * non-negative numbers — it will never enlarge a radius.
 */
export function clampBorderRadii(
  w: number,
  h: number,
  rTL: number,
  rTR: number,
  rBR: number,
  rBL: number,
): [tl: number, tr: number, br: number, bl: number] {
  // Avoid division-by-zero; if the rect is degenerate all radii collapse to 0.
  if (w <= 0 || h <= 0) return [0, 0, 0, 0];

  // CSS spec: f = min(L_side / (r_a + r_b)) for every side, capped at 1.
  const f = Math.min(
    1,
    w / Math.max(rTL + rTR, 1e-6),
    w / Math.max(rBL + rBR, 1e-6),
    h / Math.max(rTL + rBL, 1e-6),
    h / Math.max(rTR + rBR, 1e-6),
  );

  return [rTL * f, rTR * f, rBR * f, rBL * f];
}

/**
 * Convenience overload: clamp a single uniform radius for all four corners.
 */
export function clampUniformRadius(w: number, h: number, r: number): number {
  return Math.min(r, w / 2, h / 2);
}

// ── Existing code ────────────────────────────────────────────────────────────

export interface CanvasData {
  canvas: CanvasConfig;
  layers: LayerConfig[];
}

export interface TemplateSlideProps {
  canvas: CanvasConfig;
  layers: LayerConfig[];
  isActive: boolean;
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

/**
 * Recursively converts MongoDB BSON Key/Value serialisation back into plain JS
 * objects.  Handles both single-wrapped `[{Key, Value}, …]` and double-wrapped
 * `[[{Key:"Key",Value:k},{Key:"Value",Value:v}], …]` formats at any depth,
 * which is critical for nested structures like GradientProperties.colors.
 */
function deepNormalizeMongo(val: any): any {
  if (val == null || typeof val !== "object") return val;

  if (Array.isArray(val)) {
    // Detect BSON Document pattern: [{Key: …, Value: …}, …]
    if (
      val.length > 0 &&
      typeof val[0] === "object" &&
      val[0] !== null &&
      !Array.isArray(val[0]) &&
      "Key" in val[0] &&
      "Value" in val[0]
    ) {
      const obj: Record<string, any> = {};
      for (const item of val) {
        if (item?.Key !== undefined && item?.Value !== undefined) {
          obj[item.Key] = deepNormalizeMongo(item.Value);
        }
      }
      return obj;
    }

    // Regular array — recurse each element, then re-check the result because
    // the double-wrapped format `[[{Key:"Key",Value:k},{Key:"Value",Value:v}]]`
    // collapses into a single-wrapped KV doc after one recursion pass.
    const mapped = val.map((el: any) => deepNormalizeMongo(el));

    if (
      mapped.length > 0 &&
      typeof mapped[0] === "object" &&
      mapped[0] !== null &&
      !Array.isArray(mapped[0]) &&
      "Key" in mapped[0] &&
      "Value" in mapped[0]
    ) {
      const obj: Record<string, any> = {};
      for (const item of mapped) {
        if (item?.Key !== undefined && item?.Value !== undefined) {
          obj[item.Key] = deepNormalizeMongo(item.Value);
        }
      }
      return obj;
    }

    return mapped;
  }

  // Plain object — recurse into every value so nested BSON structures are
  // normalised even when the parent was already a normal JS object.
  const obj: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    obj[k] = deepNormalizeMongo(v);
  }
  return obj;
}

export function normalizeLayerProperties<T = any>(properties: any): T {
  if (!properties || typeof properties !== "object") {
    return {} as T;
  }

  const result = deepNormalizeMongo(properties);

  // Ensure we always return a plain object, never an array
  return result && typeof result === "object" && !Array.isArray(result)
    ? (result as T)
    : ({} as T);
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

// ── Export position helpers ───────────────────────────────────────────────────

/** Check whether a layer acts as a full-canvas background. */
export function isLayerFullBackground(
  layer: LayerConfig,
  canvas: { width: number; height: number },
): boolean {
  return (
    layer.type === "gradient" ||
    (layer.type === "shape" &&
      layer.x === 0 &&
      layer.y === 0 &&
      layer.width === canvas.width &&
      layer.height === canvas.height)
  );
}

export interface ExportLayerPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute the pixel position of a layer inside an export image.
 *
 * This mirrors the CSS logic in `calculateLayerStyle` *exactly* so that the
 * Konva export and the editor preview agree pixel-for-pixel.
 *
 * Key differences from the previous inline calculation:
 *  - "bottom" position for **text** no longer subtracts height (CSS sets
 *    `translateY: 0` for text, placing the *top* edge at the computed offset).
 *  - anchorY is respected for non-text "top" position.
 */
export function calculateExportLayerPosition(
  layer: LayerConfig,
  canvas: CanvasConfig,
  exportSize: ExportSize,
  props: {
    position?: string;
    anchorX?: string;
    anchorY?: string;
    offsetX?: number;
    offsetY?: number;
    scale?: number;
  },
): ExportLayerPosition {
  const scaleX = exportSize.width / canvas.width;
  const scaleY = exportSize.height / canvas.height;

  if (isLayerFullBackground(layer, canvas)) {
    return { x: 0, y: 0, width: exportSize.width, height: exportSize.height };
  }

  const position = props.position || "center";
  const anchorX = props.anchorX || "center";
  const anchorY = props.anchorY || (layer.type === "text" ? "top" : "center");
  const offsetX = props.offsetX || 0;
  const offsetY = props.offsetY !== undefined ? props.offsetY : 0;
  const imgScale = props.scale || 1;

  const isText = layer.type === "text";

  const width = layer.width * scaleX * imgScale;
  const height = layer.height * scaleY * imgScale;

  // ── Horizontal (mirrors calculateLayerStyle anchorX) ──────────────────
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

  // ── Vertical (mirrors calculateLayerStyle position + text override) ───
  let y: number;
  switch (position) {
    case "top": {
      // CSS: top = offsetY%, translateY depends on anchorY (overridden to "0" for text)
      y = offsetY * scaleY;
      if (!isText) {
        if (anchorY === "center") y -= height / 2;
        else if (anchorY === "bottom") y -= height;
      }
      break;
    }
    case "bottom": {
      // CSS: top = (100% - offsetY%), translateY = "-100%" but "0" for text
      if (isText) {
        // Text top edge at (canvasHeight - offsetY)
        y = exportSize.height - offsetY * scaleY;
      } else {
        // Element bottom edge at (canvasHeight - offsetY)
        y = exportSize.height - offsetY * scaleY - height;
      }
      break;
    }
    case "top-overflow":
    case "bottom-overflow":
      // CSS: top = offsetY%, translateY = "0" (text override also gives "0")
      y = offsetY * scaleY;
      break;
    case "center":
    default:
      // CSS: top = offsetY%, translateY = "-50%" but "0" for text
      y = offsetY * scaleY;
      if (!isText) y -= height / 2;
      break;
  }

  return { x, y, width, height };
}

// ── Editor style helpers ─────────────────────────────────────────────────────

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
    layer.type === "gradient" ||
    (layer.type === "shape" &&
      layer.x === 0 &&
      layer.y === 0 &&
      layer.width === canvas.width &&
      layer.height === canvas.height);

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

// ── 3D perspective export helper ─────────────────────────────────────────────

/**
 * Render a source canvas through a CSS-style 3D perspective transform onto a
 * canvas of the **same dimensions**.
 *
 * The caller is responsible for providing a source canvas with enough padding
 * around the content to accommodate shadow overflow and 3D projection.
 *
 * The maths replicate the CSS transform chain
 * `rotateX(a) rotateY(b) rotateZ(c)` with `perspective(d)` exactly:
 *   - Rotation order: Rz applied first, then Ry, then Rx  (CSS right-to-left)
 *   - Projection: scale = d / (d − z)  (CSS convention: +z = toward viewer)
 *
 * The image is subdivided into a 24×24 grid and texture-mapped with affine
 * triangles so that the perspective warp is visually accurate.
 */
export function render3DToCanvas(
  sourceCanvas: HTMLCanvasElement,
  perspective: number,
  rotateX: number,
  rotateY: number,
  rotateZ: number,
): HTMLCanvasElement {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const result = document.createElement("canvas");
  result.width = w;
  result.height = h;
  const rCtx = result.getContext("2d");

  if (rCtx) {
    const cx = w / 2;
    const cy = h / 2;

    // Convert to radians
    const rx = (rotateX * Math.PI) / 180;
    const ry = (rotateY * Math.PI) / 180;
    const rz = (rotateZ * Math.PI) / 180;

    const cosX = Math.cos(rx),
      sinX = Math.sin(rx);
    const cosY = Math.cos(ry),
      sinY = Math.sin(ry);
    const cosZ = Math.cos(rz),
      sinZ = Math.sin(rz);

    // CSS transform:  rotateX(a) · rotateY(b) · rotateZ(c)
    // Matrix product:  Rx · Ry · Rz  →  apply Rz first, then Ry, then Rx.
    const rotate3D = (x: number, y: number, z: number) => {
      // Step 1 – Rz
      const x1 = x * cosZ - y * sinZ;
      const y1 = x * sinZ + y * cosZ;
      // Step 2 – Ry  (z is unchanged by Rz)
      const x2 = x1 * cosY + z * sinY;
      const z2 = -x1 * sinY + z * cosY;
      // Step 3 – Rx  (x is unchanged by Rx)
      const y3 = y1 * cosX - z2 * sinX;
      const z3 = y1 * sinX + z2 * cosX;
      return { x: x2, y: y3, z: z3 };
    };

    // CSS perspective projection:  scale = d / (d − z)
    //   z > 0  →  toward viewer  →  larger
    //   z < 0  →  away from viewer  →  smaller
    const project = (x: number, y: number, z: number) => {
      const d = perspective;
      const s = d / (d - z);
      return { x: cx + x * s, y: cy + y * s };
    };

    // Project each grid vertex individually for correct perspective.
    const hw = w / 2;
    const hh = h / 2;
    const projectVertex = (u: number, v: number) => {
      const px = -hw + u * w;
      const py = -hh + v * h;
      const r = rotate3D(px, py, 0);
      return project(r.x, r.y, r.z);
    };

    const subdivisions = 24;
    for (let row = 0; row < subdivisions; row++) {
      for (let col = 0; col < subdivisions; col++) {
        const u0 = col / subdivisions;
        const v0 = row / subdivisions;
        const u1 = (col + 1) / subdivisions;
        const v1 = (row + 1) / subdivisions;

        const p00 = projectVertex(u0, v0);
        const p10 = projectVertex(u1, v0);
        const p01 = projectVertex(u0, v1);
        const p11 = projectVertex(u1, v1);

        const sx0 = u0 * w,
          sy0 = v0 * h;
        const sx1 = u1 * w,
          sy1 = v1 * h;

        // Two triangles per quad
        drawTexturedTriangle(
          rCtx,
          sourceCanvas,
          sx0,
          sy0,
          sx1,
          sy0,
          sx0,
          sy1,
          p00.x,
          p00.y,
          p10.x,
          p10.y,
          p01.x,
          p01.y,
        );
        drawTexturedTriangle(
          rCtx,
          sourceCanvas,
          sx1,
          sy0,
          sx1,
          sy1,
          sx0,
          sy1,
          p10.x,
          p10.y,
          p11.x,
          p11.y,
          p01.x,
          p01.y,
        );
      }
    }
  }

  return result;
}

/**
 * Draw a textured triangle onto a 2D canvas context using affine mapping.
 * Each triangle's clip path is expanded ~1 px outward from its centroid
 * so adjacent triangles overlap slightly, eliminating sub-pixel seam gaps
 * that otherwise appear as a visible grid.
 */
function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement | HTMLImageElement,
  sx0: number,
  sy0: number,
  sx1: number,
  sy1: number,
  sx2: number,
  sy2: number,
  dx0: number,
  dy0: number,
  dx1: number,
  dy1: number,
  dx2: number,
  dy2: number,
) {
  // Expand the clip triangle ~1 px outward from its centroid to cover seams
  const EXPAND = 1.0;
  const cxD = (dx0 + dx1 + dx2) / 3;
  const cyD = (dy0 + dy1 + dy2) / 3;
  const expand = (x: number, y: number) => {
    const ex = x - cxD;
    const ey = y - cyD;
    const len = Math.sqrt(ex * ex + ey * ey) || 1;
    return { x: x + (ex / len) * EXPAND, y: y + (ey / len) * EXPAND };
  };
  const e0 = expand(dx0, dy0);
  const e1 = expand(dx1, dy1);
  const e2 = expand(dx2, dy2);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(e0.x, e0.y);
  ctx.lineTo(e1.x, e1.y);
  ctx.lineTo(e2.x, e2.y);
  ctx.closePath();
  ctx.clip();

  // Solve affine transform: source triangle → destination triangle
  const denom = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1);
  if (Math.abs(denom) < 1e-8) {
    ctx.restore();
    return;
  }

  const m11 =
    (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denom;
  const m12 =
    (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denom;
  const m13 =
    (dx0 * (sx1 * sy2 - sx2 * sy1) +
      dx1 * (sx2 * sy0 - sx0 * sy2) +
      dx2 * (sx0 * sy1 - sx1 * sy0)) /
    denom;
  const m21 =
    (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denom;
  const m22 =
    (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denom;
  const m23 =
    (dy0 * (sx1 * sy2 - sx2 * sy1) +
      dy1 * (sx2 * sy0 - sx0 * sy2) +
      dy2 * (sx0 * sy1 - sx1 * sy0)) /
    denom;

  ctx.setTransform(m11, m21, m12, m22, m13, m23);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}
