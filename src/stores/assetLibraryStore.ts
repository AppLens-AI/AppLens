import { create } from "zustand";
import { assetApi } from "@/lib/api";
import type { Asset } from "@/types";

interface AssetLibraryState {
  // State
  assets: Asset[];
  isLoading: boolean;
  isUploading: boolean;
  searchQuery: string;
  activeFilter: string; // "" | "image" | "svg" | "icon"
  page: number;
  totalPages: number;
  total: number;
  hasMore: boolean;

  // Actions
  fetchAssets: (reset?: boolean) => Promise<void>;
  searchAssets: (query: string) => Promise<void>;
  uploadAsset: (file: File, type?: string, category?: string, tags?: string[]) => Promise<Asset | null>;
  deleteAsset: (id: string) => Promise<boolean>;
  setFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  loadMore: () => Promise<void>;
  reset: () => void;
}

const PAGE_SIZE = 50;

export const useAssetLibraryStore = create<AssetLibraryState>((set, get) => ({
  assets: [],
  isLoading: false,
  isUploading: false,
  searchQuery: "",
  activeFilter: "",
  page: 1,
  totalPages: 1,
  total: 0,
  hasMore: false,

  fetchAssets: async (reset = false) => {
    const { activeFilter, page, searchQuery } = get();
    const currentPage = reset ? 1 : page;

    set({ isLoading: true });
    try {
      let response;
      if (searchQuery) {
        response = await assetApi.search(searchQuery, currentPage, PAGE_SIZE);
      } else {
        response = await assetApi.getAll(activeFilter || undefined, currentPage, PAGE_SIZE);
      }

      const data = response.data.data;
      const newAssets = data.assets || [];

      set((state) => ({
        assets: reset ? newAssets : [...state.assets, ...newAssets],
        total: data.total,
        totalPages: data.totalPages,
        page: currentPage,
        hasMore: currentPage < data.totalPages,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      set({ isLoading: false });
    }
  },

  searchAssets: async (query: string) => {
    set({ searchQuery: query, page: 1 });
    const { activeFilter } = get();

    set({ isLoading: true });
    try {
      let response;
      if (query.trim()) {
        response = await assetApi.search(query, 1, PAGE_SIZE);
      } else {
        response = await assetApi.getAll(activeFilter || undefined, 1, PAGE_SIZE);
      }

      const data = response.data.data;
      set({
        assets: data.assets || [],
        total: data.total,
        totalPages: data.totalPages,
        page: 1,
        hasMore: 1 < data.totalPages,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to search assets:", error);
      set({ isLoading: false });
    }
  },

  uploadAsset: async (file, type, category, tags) => {
    set({ isUploading: true });
    try {
      const response = await assetApi.upload(file, type, category, tags);
      const newAsset = response.data.data;

      set((state) => ({
        assets: [newAsset, ...state.assets],
        total: state.total + 1,
        isUploading: false,
      }));

      return newAsset;
    } catch (error) {
      console.error("Failed to upload asset:", error);
      set({ isUploading: false });
      return null;
    }
  },

  deleteAsset: async (id: string) => {
    try {
      await assetApi.delete(id);
      set((state) => ({
        assets: state.assets.filter((a) => a.id !== id),
        total: state.total - 1,
      }));
      return true;
    } catch (error) {
      console.error("Failed to delete asset:", error);
      return false;
    }
  },

  setFilter: (filter: string) => {
    set({ activeFilter: filter, page: 1, assets: [] });
    get().fetchAssets(true);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  loadMore: async () => {
    const { hasMore, page } = get();
    if (!hasMore) return;
    set({ page: page + 1 });
    await get().fetchAssets();
  },

  reset: () => {
    set({
      assets: [],
      isLoading: false,
      isUploading: false,
      searchQuery: "",
      activeFilter: "",
      page: 1,
      totalPages: 1,
      total: 0,
      hasMore: false,
    });
  },
}));
