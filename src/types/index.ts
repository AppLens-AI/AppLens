export type AuthProvider = "local" | "google" | "github" | "apple";
export type UserRole = "user" | "admin";

export interface LinkedAccount {
  provider: AuthProvider;
  email: string;
  name?: string;
  avatar?: string;
  linkedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: AuthProvider;
  role: UserRole;
  linkedAccounts?: LinkedAccount[];
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Template {
  id: string;
  name: string;
  platform: "ios" | "android" | "both";
  category: string;
  thumbnail: string;
  thumbnails?: string[];
  jsonConfig: TemplateConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateConfig {
  canvas: CanvasConfig;
  layers: LayerConfig[];
  exports: ExportSize[];
  deviceConfigs?: DeviceConfigMap;
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
}

export interface LayerConfig {
  id: string;
  type: "text" | "image" | "shape" | "screenshot" | "gradient";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  properties: TextProperties | ImageProperties | ShapeProperties | GradientProperties;
  zIndex: number;
}

export interface TextProperties {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;
  position?: "top" | "center" | "bottom";
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "center" | "bottom";
  offsetX?: number;
  offsetY?: number;
}

export interface ImageProperties {
  src: string;
  placeholder: string;
  borderRadius: number;
  shadow: boolean;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  position?: "center" | "top" | "bottom" | "top-overflow" | "bottom-overflow";
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "center" | "bottom";
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  // Frame border properties
  frameBorder?: boolean;
  frameBorderWidth?: number;
  frameBorderColor?: string;
  frameBorderRadiusTL?: number;
  frameBorderRadiusTR?: number;
  frameBorderRadiusBL?: number;
  frameBorderRadiusBR?: number;
  // 3D perspective properties
  enable3D?: boolean;
  perspective?: number;       // perspective distance (400–2000, default 1000)
  rotateX?: number;           // X-axis rotation in degrees (-60 to 60)
  rotateY?: number;           // Y-axis rotation in degrees (-60 to 60)
  rotateZ?: number;           // Z-axis rotation in degrees (-60 to 60)
}

export interface GradientProperties {
  gradientType: "linear" | "radial";
  angle: number;
  colors: GradientStop[];
  position?: "top" | "center" | "bottom";
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "center" | "bottom";
  offsetX?: number;
  offsetY?: number;
}

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface ShapeProperties {
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  shapeType: "rect" | "circle" | "rounded";
  position?: "top" | "center" | "bottom";
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "center" | "bottom";
  offsetX?: number;
  offsetY?: number;
}

export interface ExportSize {
  name: string;
  platform: string;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  userId: string;
  templateId: string;
  name: string;
  thumbnail: string;
  projectConfig: ProjectConfig;
  template?: Template;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectConfig {
  canvas: CanvasConfig;
  layers: LayerConfig[];
  images: ImageAsset[];
  exports?: ExportSize[];
  deviceConfigs?: DeviceConfigMap;
}

export interface SlideData {
  id: string;
  canvas: CanvasConfig;
  layers: LayerConfig[];
}

export interface DeviceConfig {
  exportSize: ExportSize;
  slides: SlideData[];
  isModified: boolean;
}

export type DeviceConfigMap = Record<string, DeviceConfig>;

export interface ImageAsset {
  id: string;
  url: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

// Session types
export interface Session {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  location?: string;
  isCurrentDevice: boolean;
  lastActiveAt: string;
  createdAt: string;
}

// Notification types
export type NotificationType = 
  | "new_template" 
  | "feature_update" 
  | "system_announcement" 
  | "export_complete";

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailExportComplete: boolean;
  emailWeeklyDigest: boolean;
  emailNewTemplates: boolean;
  emailFeatureUpdates: boolean;
  emailSystemAnnouncements: boolean;
  inAppExportComplete: boolean;
  inAppNewTemplates: boolean;
  inAppFeatureUpdates: boolean;
  inAppSystemAnnouncements: boolean;
  productAlerts: boolean;
  marketingEmails: boolean;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Feedback types
export type FeedbackType = "bug_report" | "feature_request" | "general";
export type FeedbackStatus = "pending" | "in_progress" | "resolved" | "closed";
export type FeedbackPriority = "low" | "medium" | "high" | "critical";

export interface Feedback {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  category?: string;
  browserInfo?: string;
  appVersion?: string;
  environment?: string;
  adminNotes?: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackListResponse {
  feedback: Feedback[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// App info
export interface AppInfo {
  version: string;
  environment: string;
  isProduction: boolean;
  buildDate?: string;
}

// Admin types
export interface AdminUser extends User {
  projectCount: number;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: any[]; 
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalFeedback: number;
  pendingFeedback: number;
  feedbackStats: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    total: number;
  };
}

// Asset Library types
export interface Asset {
  id: string;
  name: string;
  url: string;
  type: "image" | "svg" | "icon";
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  tags?: string[];
  category?: string;
  createdAt: string;
}

export interface AssetListResponse {
  assets: Asset[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StockImage {
  id: string;
  url: string;
  thumbUrl: string;
  smallUrl: string;
  regularUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  description?: string;
  author: string;
  authorUrl: string;
  downloadUrl: string;
}
