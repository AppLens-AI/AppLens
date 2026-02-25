import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import type {
  NotificationPreferences,
  Notification,
  FeedbackType,
  Feedback,
  FeedbackListResponse,
  Session,
  AppInfo,
  UserListResponse,
  DashboardStats,
  AssetListResponse,
  Asset,
} from "@/types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const templatesApi = {
  getAll: (platform?: string) =>
    api.get("/get-templates", { params: { platform } }),
  getById: (id: string) => api.get(`/get-template-byId/${id}`),
};

export const projectsApi = {
  create: (data: { templateId: string; name: string }) =>
    api.post("/create-project", data),
  getAll: () => api.get("/get-projects"),
  getById: (id: string) => api.get(`/get-project-byId/${id}`),
  update: (id: string, data: unknown) => api.put(`/update-project/${id}`, data),
  delete: (id: string) => api.delete(`/delete-projects/${id}`),
};

export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/uploads/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const userApi = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put("/user/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/user/change-password", data),
  setPassword: (data: { password: string }) =>
    api.post("/user/set-password", data),
  deleteAccount: (data: { password?: string; confirmation: string }) =>
    api.delete("/user/account", { data }),
  unlinkAccount: (provider: string) =>
    api.delete(`/user/linked-accounts/${provider}`),
};

export const sessionsApi = {
  getAll: () => api.get<{ data: Session[] }>("/user/sessions"),
  revoke: (sessionId: string) => api.delete(`/user/sessions/${sessionId}`),
  revokeAll: () => api.delete("/user/sessions"),
};

export const notificationsApi = {
  getPreferences: () =>
    api.get<{ data: NotificationPreferences }>("/notifications/preferences"),
  updatePreferences: (data: Partial<NotificationPreferences>) =>
    api.put<{ data: NotificationPreferences }>(
      "/notifications/preferences",
      data,
    ),
  getAll: (page = 1, pageSize = 20) =>
    api.get<{ data: { items: Notification[]; total: number; page: number } }>(
      "/notifications",
      { params: { page, pageSize } },
    ),
  getUnreadCount: () =>
    api.get<{ data: { count: number } }>("/notifications/unread-count"),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const feedbackApi = {
  create: (data: {
    type: FeedbackType;
    title: string;
    description: string;
    category?: string;
    browserInfo?: string;
    appVersion?: string;
    environment?: string;
  }) => api.post<ApiResponse<Feedback>>("/feedback", data),
  getMyFeedback: (page = 1, pageSize = 20) =>
    api.get<ApiResponse<Feedback[]>>("/feedback/my", {
      params: { page, pageSize },
    }),
};

export const appApi = {
  getInfo: () => api.get<ApiResponse<AppInfo>>("/app-info"),
};

export const adminApi = {
  getUsers: (page = 1, pageSize = 20, role?: string) =>
    api.get<ApiResponse<UserListResponse>>("/admin/users", {
      params: { page, pageSize, role },
    }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: "user" | "admin") =>
    api.put<ApiResponse<null>>(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) =>
    api.delete<ApiResponse<null>>(`/admin/users/${id}`),

  getAllFeedback: (page = 1, pageSize = 20, type?: string, status?: string) =>
    api.get<ApiResponse<FeedbackListResponse>>("/admin/feedback", {
      params: { page, pageSize, type, status },
    }),
  getFeedbackStats: () => api.get("/admin/feedback/stats"),
  getFeedbackById: (id: string) =>
    api.get<ApiResponse<Feedback>>(`/admin/feedback/${id}`),
  updateFeedback: (
    id: string,
    data: {
      status?: string;
      priority?: string;
      adminNotes?: string;
      adminResponse?: string;
    },
  ) => api.put<ApiResponse<Feedback>>(`/admin/feedback/${id}`, data),
  deleteFeedback: (id: string) => api.delete(`/admin/feedback/${id}`),

  broadcastNotification: (title: string, message: string) =>
    api.post<ApiResponse<null>>("/admin/notifications/broadcast", {
      title,
      message,
      type: "system",
    }),

  getDashboardStats: () =>
    api.get<ApiResponse<DashboardStats>>("/admin/dashboard/stats"),
};

// AI API
export const aiApi = {
  getProviders: () =>
    api.get<ApiResponse<AIProvider[]>>("/ai/providers"),
  getConfig: () =>
    api.get<ApiResponse<AIConfigResponse>>("/ai/config"),
  saveConfig: (data: { provider: string; apiKey: string; selectedModel?: string }) =>
    api.post<ApiResponse<AIConfigResponse>>("/ai/config", data),
  updateModel: (selectedModel: string) =>
    api.put<ApiResponse<null>>("/ai/config/model", { selectedModel }),
  deleteConfig: () =>
    api.delete<ApiResponse<null>>("/ai/config"),
  fetchModels: () =>
    api.get<ApiResponse<AIModel[]>>("/ai/models"),
  fetchModelsWithKey: (provider: string, apiKey: string) =>
    api.get<ApiResponse<AIModel[]>>("/ai/models/validate", { params: { provider, apiKey } }),
  generateText: (data: GenerateTextRequest) =>
    api.post<ApiResponse<GenerateTextResponse>>("/ai/generate-text", data),
};

// AI Types used in api calls
export interface AIProvider {
  id: string;
  name: string;
  description: string;
  modelsUrl: string;
  docsUrl: string;
  icon: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export interface AIConfigResponse {
  id: string;
  provider: string;
  maskedKey: string;
  selectedModel: string;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateTextRequest {
  currentText?: string;
  appCategory?: string;
  tone: "professional" | "playful" | "minimal" | "luxury" | "technical" | "casual";
  textType: "tagline" | "subtitle" | "description" | "cta" | "feature_title" | "feature_description";
  context?: string;
  count?: number;
}

export interface GenerateTextResponse {
  suggestions: TextSuggestion[];
  model: string;
  provider: string;
}

export interface TextSuggestion {
  text: string;
  tone: string;
}

export const getProxyImageUrl = (originalUrl: string): string => {
  if (!originalUrl) return "";
  // Data URIs (e.g. inline SVG icons) don't need proxying
  if (originalUrl.startsWith("data:")) return originalUrl;
  const baseUrl = import.meta.env.VITE_API_URL || "/api";
  // If the image is already served from our backend, return it directly
  if (originalUrl.startsWith(baseUrl) || originalUrl.startsWith("/api/uploads")) {
    return originalUrl;
  }
  return `${baseUrl}/proxy-image?url=${encodeURIComponent(originalUrl)}`;
};

// Asset Library API
export const assetApi = {
  upload: (file: File, type?: string, category?: string, tags?: string[]) => {
    const formData = new FormData();
    formData.append("file", file);
    if (type) formData.append("type", type);
    if (category) formData.append("category", category);
    if (tags?.length) formData.append("tags", tags.join(","));
    return api.post<ApiResponse<Asset>>("/assets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAll: (type?: string, page = 1, pageSize = 50) =>
    api.get<ApiResponse<AssetListResponse>>("/assets", {
      params: { type, page, pageSize },
    }),
  search: (query: string, page = 1, pageSize = 50) =>
    api.get<ApiResponse<AssetListResponse>>("/assets/search", {
      params: { q: query, page, pageSize },
    }),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/assets/${id}`),
};
