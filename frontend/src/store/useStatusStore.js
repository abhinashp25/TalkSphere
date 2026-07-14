import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useStatusStore = create((set, get) => ({
  statuses: [],
  isFetching: false,
  isUploading: false,
  activeStatus: null,
  isTextModalOpen: false,
  setIsTextModalOpen: (isOpen) => set({ isTextModalOpen: isOpen }),
  viewedIds: (() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("talksphere-viewed-statuses") || localStorage.getItem("chatify-viewed-statuses") || "[]"));
    } catch {
      return new Set();
    }
  })(),

  setActiveStatus: (statusOrUpdater) => {
    set((state) => {
      const nextStatus = typeof statusOrUpdater === "function"
        ? statusOrUpdater(state.activeStatus)
        : statusOrUpdater;
      return { activeStatus: nextStatus };
    });
  },

  markAsViewed: (id) => {
    const next = new Set(get().viewedIds);
    next.add(id);
    localStorage.setItem("talksphere-viewed-statuses", JSON.stringify(Array.from(next)));
    set({ viewedIds: next });
  },

  fetchStatuses: async () => {
    set({ isFetching: true });
    try {
      const res = await axiosInstance.get("/status");
      set({ statuses: res.data });
    } catch (e) {
      toast.error("Failed to load statuses");
    } finally {
      set({ isFetching: false });
    }
  },

  uploadStatus: async (content, type = "text") => {
    set({ isUploading: true });
    try {
      const res = await axiosInstance.post("/status", { content, type });
      set({ statuses: [res.data, ...get().statuses] });
      toast.success("Status posted!");
    } catch (e) {
      toast.error("Failed to post status");
    } finally {
      set({ isUploading: false });
    }
  }
}));
