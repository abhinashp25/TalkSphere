import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts:       [],
  chats:             [],
  messages:          [],
  messagesCache:     {},
  hasMoreMessages:   false,
  isLoadingMore:     false,
  activeTab:         "chats",
  activeFilter:      "all",
  selectedUser:      null,
  isUsersLoading:    false,
  isMessagesLoading: false,
  isSoundEnabled:    JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  typingUsers:       {},
  searchQuery:       "",
  sidebarSearch:     "",
  unreadCounts:      {},
  replyingTo:        null,
  pendingInput:      null,
  starredMessages:   [],
  lastSeenMap:       {},
  pinnedMessage:     null,
  disappearSeconds:  0,
  favourites:        JSON.parse(localStorage.getItem("chatify-favourites")) || [],
  offlineQueue:      JSON.parse(localStorage.getItem("chatify-offline-queue")) || [],
  blockedUsers:      [],
  isSidebarCollapsed: false,
  isStatusViewerOpen: false,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },
  setActiveTab:     (tab)  => set({ activeTab: tab }),
  setActiveFilter:  (f)    => set({ activeFilter: f }),
  setSelectedUser:  (user) => {
    set({ selectedUser: user, replyingTo: null, pinnedMessage: null, disappearSeconds: 0 });
    if (user) {
      set({ 
        messages: get().messagesCache?.[user._id] || [],
        unreadCounts: { ...get().unreadCounts, [user._id]: 0 }
      });
    }
  },
  setSearchQuery:   (q) => set({ searchQuery: q }),
  setSidebarSearch: (q) => set({ sidebarSearch: q }),
  setReplyingTo:    (msg) => set({ replyingTo: msg }),
  clearReply:       () => set({ replyingTo: null }),
  setPendingInput:  (text) => set({ pendingInput: text }),
  clearPendingInput:() => set({ pendingInput: null }),
  setDisappearSeconds: (s) => set({ disappearSeconds: s }),
  toggleSidebar:          () => set({ isSidebarCollapsed: !get().isSidebarCollapsed }),
  setSidebarCollapsed:     (c) => set({ isSidebarCollapsed: c }),
  setStatusViewerOpen:     (v) => set({ isStatusViewerOpen: v }),

  toggleFavourite: (id) => {
    const isFav = get().favourites.includes(id);
    const updated = isFav
      ? get().favourites.filter(f => f !== id)
      : [...get().favourites, id];
    localStorage.setItem("chatify-favourites", JSON.stringify(updated));
    set({ favourites: updated });
    toast(isFav ? "Removed from favourites" : "Added to favourites", { duration: 1500 });
  },

  clearChat: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/clear/${userId}`);
      set({ 
        messages: [],
        messagesCache: {
          ...get().messagesCache,
          [userId]: []
        }
      });
      set({ chats: get().chats.filter(c => c._id !== userId) });
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not clear chat");
    }
  },

  markChatArchived: (userId, archived) => {
    set({ chats: get().chats.map(c => c._id === userId ? { ...c, isArchived: archived } : c) });
  },

  // -- Blocking --
  fetchBlockedUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/blocked");
      set({ blockedUsers: res.data });
    } catch { /* silent */ }
  },

  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/messages/block/${userId}`);
      const user = await axiosInstance.get("/messages/blocked");
      set({ blockedUsers: user.data });
      toast.success("User blocked");
    } catch {
      toast.error("Could not block user");
    }
  },

  unblockUser: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/block/${userId}`);
      set({ blockedUsers: get().blockedUsers.filter(u => u._id !== userId) });
      toast.success("User unblocked");
    } catch {
      toast.error("Could not unblock user");
    }
  },

  isUserBlocked: (userId) => get().blockedUsers.some(u => u._id === userId),

  // -- Contacts & Chats --
  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (e) {
      toast.error(e.response?.data?.message || "Error");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      const serverUnread = {};
      res.data.forEach(c => { if (c.unreadCount > 0) serverUnread[c._id] = c.unreadCount; });
      set({ chats: res.data, unreadCounts: { ...serverUnread, ...get().unreadCounts } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Error");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // -- Messages with pagination --
  getMessagesByUserId: async (userId) => {
    const hasCache = !!get().messagesCache?.[userId];
    set({
      messages: get().messagesCache?.[userId] || [],
      isMessagesLoading: !hasCache,
      hasMoreMessages: false
    });
    try {
      const res = await axiosInstance.get(`/messages/${userId}?limit=40`);
      const fetchedMessages = res.data.messages || [];
      set({
        messages: fetchedMessages,
        hasMoreMessages: res.data.hasMore,
        messagesCache: {
          ...get().messagesCache,
          [userId]: fetchedMessages
        }
      });
      const pinned = fetchedMessages.find(m => m.isPinned && !m.isDeletedForAll);
      set({ pinnedMessage: pinned || null });

      try {
        const d = await axiosInstance.get(`/disappear/${userId}`);
        set({ disappearSeconds: d.data.seconds || 0 });
      } catch { set({ disappearSeconds: 0 }); }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadMoreMessages: async () => {
    const { messages, selectedUser, hasMoreMessages, isLoadingMore } = get();
    if (!selectedUser || !hasMoreMessages || isLoadingMore) return;

    const oldest = messages[0];
    if (!oldest) return;
    set({ isLoadingMore: true });

    try {
      const res = await axiosInstance.get(`/messages/${selectedUser._id}?before=${oldest._id}&limit=40`);
      const loaded = [...res.data.messages, ...messages];
      set({
        messages:        loaded,
        hasMoreMessages: res.data.hasMore,
        isLoadingMore:   false,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: loaded
        }
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  // -- Offline queue --
  processOfflineQueue: async () => {
    const queue = get().offlineQueue;
    if (!queue.length || !window.navigator.onLine) return;
    toast.success(`Sending ${queue.length} queued message${queue.length > 1 ? "s" : ""}...`);
    for (const item of queue) {
      try {
        await axiosInstance.post(`/messages/send/${item.receiverId}`, item.payload);
      } catch (e) {
        console.error("Failed to send queued message", e);
      }
    }
    set({ offlineQueue: [] });
    localStorage.removeItem("chatify-offline-queue");
    get().getMyChatPartners();
    if (get().selectedUser) get().getMessagesByUserId(get().selectedUser._id);
  },

  sendMessage: async (messageData) => {
    const { selectedUser, replyingTo } = get();
    const { authUser } = useAuthStore.getState();
    const tempId = `temp-${Date.now()}`;
    const payload = { ...messageData, replyTo: replyingTo || undefined };

    const optimistic = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      audio: messageData.audio,
      replyTo: replyingTo || undefined,
      isForwarded: messageData.isForwarded || false,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      isRead: false,
      reactions: [],
    };

    const optimisticMsgs = [...(get().messages || []), optimistic];
    set({ 
      messages: optimisticMsgs, 
      replyingTo: null,
      messagesCache: {
        ...get().messagesCache,
        [selectedUser._id]: optimisticMsgs
      }
    });

    if (!window.navigator.onLine) {
      const newQueue = [...get().offlineQueue, { receiverId: selectedUser._id, payload }];
      set({ offlineQueue: newQueue });
      localStorage.setItem("chatify-offline-queue", JSON.stringify(newQueue));
      const pendingMsgs = (get().messages || []).map(m => m._id === tempId ? { ...m, isPendingList: true } : m);
      set({ 
        messages: pendingMsgs,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: pendingMsgs
        }
      });
      toast("Offline — message queued", { icon: "⏳" });
      return;
    }

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      const sentMsgs = (get().messages || []).map(m => m._id === tempId ? res.data : m);
      set({ 
        messages: sentMsgs,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: sentMsgs
        }
      });
      get().getMyChatPartners();
    } catch (e) {
      const failedMsgs = (get().messages || []).filter(m => m._id !== tempId);
      set({ 
        messages: failedMsgs,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: failedMsgs
        }
      });
      toast.error(e.response?.data?.message || "Send failed");
    }
  },

  markMessagesAsRead: async (senderId) => {
    try {
      await axiosInstance.put(`/messages/read/${senderId}`);
      const updated = (get().messages || []).map(m =>
        m.senderId === senderId && !m.isRead ? { ...m, isRead: true } : m
      );
      set({
        messages: updated,
        unreadCounts: { ...get().unreadCounts, [senderId]: 0 },
        messagesCache: {
          ...get().messagesCache,
          [senderId]: updated
        }
      });
    } catch (e) {
      console.warn("Failed to mark read:", e);
    }
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.put(`/messages/react/${messageId}`, { emoji });
      const updated = (get().messages || []).map(m => m._id === messageId ? { ...m, reactions: res.data.reactions } : m);
      set({ 
        messages: updated,
        messagesCache: {
          ...get().messagesCache,
          [get().selectedUser?._id]: updated
        }
      });
    } catch {
      toast.error("Could not react");
    }
  },

  deleteMessage: async (messageId, deleteForEveryone) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
      if (deleteForEveryone) {
        const updated = (get().messages || []).map(m =>
          m._id === messageId ? {
            ...m,
            isDeletedForAll: true,
            text: null,
            image: null,
            audio: null,
            document: null,
            reactions: [],
            linkPreview: null,
            replyTo: null,
            isPinned: false
          } : m
        );
        set({
          messages: updated,
          messagesCache: {
            ...get().messagesCache,
            [get().selectedUser?._id]: updated
          }
        });
      } else {
        const filtered = (get().messages || []).filter(m => m._id !== messageId);
        set({ 
          messages: filtered,
          messagesCache: {
            ...get().messagesCache,
            [get().selectedUser?._id]: filtered
          }
        });
      }
    } catch {
      toast.error("Could not delete");
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.patch(`/messages/${messageId}`, { text });
      const updated = (get().messages || []).map(m =>
        m._id === messageId ? { ...m, text: res.data.text, editedAt: res.data.editedAt } : m
      );
      set({
        messages: updated,
        messagesCache: {
          ...get().messagesCache,
          [get().selectedUser?._id]: updated
        }
      });
    } catch {
      toast.error("Could not edit message");
    }
  },

  toggleStarMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/star/${messageId}`);
      const updated = (get().messages || []).map(m => m._id === messageId ? { ...m, _starred: res.data.starred } : m);
      set({ 
        messages: updated,
        messagesCache: {
          ...get().messagesCache,
          [get().selectedUser?._id]: updated
        }
      });
      toast(res.data.starred ? "⭐ Message starred" : "Unstarred", { duration: 1500 });
    } catch {
      toast.error("Could not star message");
    }
  },

  togglePinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/pin/${messageId}`);
      const msgs = (get().messages || []).map(m => m._id === messageId ? { ...m, isPinned: res.data.isPinned } : m);
      set({ 
        messages: msgs, 
        pinnedMessage: res.data.isPinned ? msgs.find(m => m._id === messageId) : null,
        messagesCache: {
          ...get().messagesCache,
          [get().selectedUser?._id]: msgs
        }
      });
      toast(res.data.isPinned ? "📌 Message pinned" : "Unpinned", { duration: 1500 });
    } catch {
      toast.error("Could not pin message");
    }
  },

  emitTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    useAuthStore.getState().socket?.emit("typing", { to: selectedUser._id });
  },
  emitStopTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    useAuthStore.getState().socket?.emit("stopTyping", { to: selectedUser._id });
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (msg) => {
      const partnerId = msg.senderId === selectedUser._id ? msg.senderId : msg.receiverId;
      const cachedMsgs = get().messagesCache[partnerId] || [];
      const updatedCache = [...cachedMsgs, msg];
      
      set({
        messagesCache: {
          ...get().messagesCache,
          [partnerId]: updatedCache
        }
      });

      if (msg.senderId !== selectedUser._id) {
        set({ unreadCounts: { ...get().unreadCounts, [msg.senderId]: (get().unreadCounts[msg.senderId] || 0) + 1 } });
        return;
      }
      set({ messages: updatedCache });
      if (isSoundEnabled) { const s = new Audio("/sounds/notification.mp3"); s.currentTime = 0; s.play().catch(() => {}); }
      get().markMessagesAsRead(msg.senderId);
    });

    socket.on("messageLinkPreview", (updatedMsg) => {
      const updated = (get().messages || []).map(m =>
        m._id === updatedMsg._id ? { ...m, linkPreview: updatedMsg.linkPreview } : m
      );
      set({
        messages: updated,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: updated
        }
      });
    });

    socket.on("scheduledMessageSent", ({ message }) => {
      const { selectedUser: su } = get();
      if (!su) return;
      const isThisChat =
        (message.senderId === useAuthStore.getState().authUser._id && message.receiverId === su._id) ||
        (message.receiverId === useAuthStore.getState().authUser._id && message.senderId === su._id);
      if (isThisChat) {
        const updated = [...(get().messages || []), message];
        set({ 
          messages: updated,
          messagesCache: {
            ...get().messagesCache,
            [su._id]: updated
          }
        });
      }
      get().getMyChatPartners();
      toast("📅 Scheduled message sent!", { duration: 2000 });
    });

    socket.on("messageEdited", ({ messageId, text, editedAt }) => {
      const updated = (get().messages || []).map(m =>
        m._id === messageId ? { ...m, text, editedAt } : m
      );
      set({
        messages: updated,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: updated
        }
      });
    });

    socket.on("disappearTimerChanged", ({ byUserId, seconds }) => {
      if (byUserId === selectedUser._id) {
        const label = seconds === 0 ? "disabled disappearing messages"
          : seconds === 86400 ? "set messages to disappear in 24 hours"
          : "set a disappear timer";
        toast(`⏱ ${selectedUser.fullName} ${label}`, { duration: 3000 });
      }
    });

    socket.on("messagesRead", ({ by }) => {
      if (by !== selectedUser._id) return;
      const updated = (get().messages || []).map(m => m.receiverId === by && !m.isRead ? { ...m, isRead: true } : m);
      set({ 
        messages: updated,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: updated
        }
      });
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
      const updated = (get().messages || []).map(m => m._id === messageId ? { ...m, reactions } : m);
      set({ 
        messages: updated,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: updated
        }
      });
    });

    socket.on("messageDeleted", ({ messageId, deletedForAll }) => {
      let updated;
      if (deletedForAll) {
        updated = (get().messages || []).map(m =>
          m._id === messageId ? {
            ...m,
            isDeletedForAll: true,
            text: null,
            image: null,
            audio: null,
            document: null,
            reactions: [],
            linkPreview: null,
            replyTo: null,
            isPinned: false
          } : m
        );
      } else {
        updated = (get().messages || []).filter(m => m._id !== messageId);
      }
      set({ 
        messages: updated,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: updated
        }
      });
    });

    socket.on("messagePinned", ({ messageId, isPinned }) => {
      const msgs = (get().messages || []).map(m => m._id === messageId ? { ...m, isPinned } : m);
      set({ 
        messages: msgs, 
        pinnedMessage: isPinned ? msgs.find(m => m._id === messageId) : null,
        messagesCache: {
          ...get().messagesCache,
          [selectedUser._id]: msgs
        }
      });
    });

    socket.on("userLastSeen", ({ userId, lastSeen }) => {
      set({ lastSeenMap: { ...get().lastSeenMap, [userId]: lastSeen } });
    });

    socket.on("userTyping",        ({ from }) => { if (from !== selectedUser._id) return; set({ typingUsers: { ...get().typingUsers, [from]: true } }); });
    socket.on("userStoppedTyping", ({ from }) => { const n = { ...get().typingUsers }; delete n[from]; set({ typingUsers: n }); });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    [
      "newMessage", "messageLinkPreview", "scheduledMessageSent", "messageEdited",
      "disappearTimerChanged", "messagesRead", "messageReaction", "messageDeleted",
      "messagePinned", "userLastSeen", "userTyping", "userStoppedTyping",
    ].forEach(ev => socket?.off(ev));
  },
}));
