import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

export const templatesApi = {
  getAll: (platform?: string) =>
    api.get('/get-templates', { params: { platform } }),
  getById: (id: string) => api.get(`/get-template-byId/${id}`),
}

export const projectsApi = {
  create: (data: { templateId: string; name: string }) =>
    api.post('/create-project', data),
  getAll: () => api.get('/get-projects'),
  getById: (id: string) => api.get(`/get-project-byId/${id}`),
  update: (id: string, data: unknown) => api.put(`/update-project/${id}`, data),
  delete: (id: string) => api.delete(`/delete-projects/${id}`),
}

export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
