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
      const realMsg = res.data;

      // The socket "newMessage" event may have already arrived and replaced the temp
      // entry with the real message. Guard against that to avoid a duplicate.
      const currentMsgs = get().messages || [];
      const alreadyResolved = currentMsgs.some(m => String(m._id) === String(realMsg._id));

      let sentMsgs;
      if (alreadyResolved) {
        // Socket already added the real message — just remove the lingering temp entry
        sentMsgs = currentMsgs.filter(m => m._id !== tempId);
      } else {
        // Normal case: replace the temp entry with the real message from the server
        sentMsgs = currentMsgs.map(m => m._id === tempId ? realMsg : m);
      }

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

  emitTyping: (type = "text") => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    useAuthStore.getState().socket?.emit("typing", { to: selectedUser._id, type });
  },
  emitStopTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    useAuthStore.getState().socket?.emit("stopTyping", { to: selectedUser._id });
  },

  updateCachedMessage: (messageId, updater) => {
    const cache = { ...get().messagesCache };
    let foundPartnerId = null;
    for (const partnerId of Object.keys(cache)) {
      const msgs = cache[partnerId] || [];
      const idx = msgs.findIndex(m => String(m._id) === String(messageId));
      if (idx !== -1) {
        const updatedMsgs = [...msgs];
        updatedMsgs[idx] = updater(updatedMsgs[idx]);
        cache[partnerId] = updatedMsgs;
        foundPartnerId = partnerId;
        break;
      }
    }
    const currentSelectedUser = get().selectedUser;
    let activeUpdated = null;
    if (currentSelectedUser) {
      const idx = (get().messages || []).findIndex(m => String(m._id) === String(messageId));
      if (idx !== -1) {
        activeUpdated = [...get().messages];
        activeUpdated[idx] = updater(activeUpdated[idx]);
      }
    }
    set({
      messagesCache: cache,
      ...(activeUpdated ? { messages: activeUpdated } : {})
    });
  },

  subscribeToMessages: () => {
    const { isSoundEnabled } = get();
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (msg) => {
      const myId = useAuthStore.getState().authUser?._id;
      if (!myId) return;
      const partnerId = String(msg.senderId) === String(myId) ? String(msg.receiverId) : String(msg.senderId);

      const cachedMsgs = get().messagesCache[partnerId] || [];

      // Hard dedup — if this exact real _id is already in the cache, do nothing.
      if (cachedMsgs.some(m => String(m._id) === String(msg._id))) return;

      // If WE sent this message there is already an optimistic (temp-*) entry.
      // Replace that temp entry with the real message so we never have duplicates.
      // This is the race-condition fix: socket fires before HTTP response maps the temp.
      const hasTemp = String(msg.senderId) === String(myId)
        && cachedMsgs.some(m => String(m._id).startsWith("temp-"));

      let updatedCache;
      if (hasTemp) {
        // Replace the OLDEST temp entry (there should only ever be one per send)
        let replaced = false;
        updatedCache = cachedMsgs.map(m => {
          if (!replaced && String(m._id).startsWith("temp-")) {
            replaced = true;
            return msg; // swap temp → real
          }
          return m;
        });
      } else {
        // Normal case: a message from another person — just append it
        updatedCache = [...cachedMsgs, msg];
      }

      set({
        messagesCache: {
          ...get().messagesCache,
          [partnerId]: updatedCache
        }
      });

      const currentSelectedUser = get().selectedUser;
      if (!currentSelectedUser || String(partnerId) !== String(currentSelectedUser._id)) {
        // Message for a chat not currently open — increment unread badge
        if (String(msg.senderId) !== String(myId)) {
          set({ unreadCounts: { ...get().unreadCounts, [partnerId]: (get().unreadCounts[partnerId] || 0) + 1 } });
        }
        get().getMyChatPartners();
        return;
      }

      set({ messages: updatedCache });
      // Only play sound for messages received from someone else
      if (isSoundEnabled && String(msg.senderId) !== String(myId)) {
        const customMsgTone = localStorage.getItem("msg_tone") || "button-tap-sound.mp3";
        const s = new Audio(`/Notifications/${customMsgTone}`);
        s.currentTime = 0;
        s.play().catch(() => {});

        const isVibrateEnabled = localStorage.getItem("vibrate_mode") !== "false";
        if (isVibrateEnabled) {
          const v = new Audio("/vibration/phone-vibration.mp3");
          v.play().catch(() => {});
        }
      }
      get().markMessagesAsRead(partnerId);
      get().getMyChatPartners();
    });

    socket.on("messageLinkPreview", (updatedMsg) => {
      get().updateCachedMessage(updatedMsg._id, (msg) => ({ ...msg, linkPreview: updatedMsg.linkPreview }));
    });

    socket.on("scheduledMessageSent", ({ message }) => {
      const myId = useAuthStore.getState().authUser?._id;
      if (!myId) return;
      const partnerId = String(message.senderId) === String(myId) ? String(message.receiverId) : String(message.senderId);

      const cachedMsgs = get().messagesCache[partnerId] || [];
      if (!cachedMsgs.some(m => String(m._id) === String(message._id))) {
        const updatedCache = [...cachedMsgs, message];
        set({
          messagesCache: {
            ...get().messagesCache,
            [partnerId]: updatedCache
          }
        });

        const currentSelectedUser = get().selectedUser;
        if (currentSelectedUser && String(partnerId) === String(currentSelectedUser._id)) {
          set({ messages: updatedCache });
        }
      }
      get().getMyChatPartners();
      toast("📅 Scheduled message sent!", { duration: 2000 });
    });

    socket.on("messageEdited", ({ messageId, text, editedAt }) => {
      get().updateCachedMessage(messageId, (msg) => ({ ...msg, text, editedAt }));
    });

    socket.on("disappearTimerChanged", ({ byUserId, seconds }) => {
      const currentSelectedUser = get().selectedUser;
      if (currentSelectedUser && String(byUserId) === String(currentSelectedUser._id)) {
        set({ disappearSeconds: seconds });
        const label = seconds === 0 ? "disabled disappearing messages"
          : seconds === 86400 ? "set messages to disappear in 24 hours"
          : "set a disappear timer";
        toast(`⏱ ${currentSelectedUser.fullName} ${label}`, { duration: 3000 });
      }
    });

    socket.on("messagesRead", ({ by }) => {
      const currentSelectedUser = get().selectedUser;
      const cachedMsgs = get().messagesCache[by] || [];
      const updatedCache = cachedMsgs.map(m => {
        const recId = m.receiverId?._id ? String(m.receiverId._id) : String(m.receiverId);
        return recId === String(by) && !m.isRead ? { ...m, isRead: true } : m;
      });

      set({
        messagesCache: {
          ...get().messagesCache,
          [by]: updatedCache
        }
      });

      if (currentSelectedUser && String(by) === String(currentSelectedUser._id)) {
        set({ messages: updatedCache });
      }
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
      get().updateCachedMessage(messageId, (msg) => ({ ...msg, reactions }));
    });

    socket.on("messageDeleted", ({ messageId, deletedForAll }) => {
      if (deletedForAll) {
        get().updateCachedMessage(messageId, (msg) => ({
          ...msg,
          isDeletedForAll: true,
          text: null,
          image: null,
          audio: null,
          document: null,
          reactions: [],
          linkPreview: null,
          replyTo: null,
          isPinned: false
        }));
      } else {
        const cache = { ...get().messagesCache };
        for (const partnerId of Object.keys(cache)) {
          const msgs = cache[partnerId] || [];
          const filtered = msgs.filter(m => String(m._id) !== String(messageId));
          if (filtered.length !== msgs.length) {
            cache[partnerId] = filtered;
            break;
          }
        }
        const currentSelectedUser = get().selectedUser;
        const activeFiltered = (get().messages || []).filter(m => String(m._id) !== String(messageId));
        set({
          messagesCache: cache,
          messages: activeFiltered
        });
      }
    });

    socket.on("messagePinned", ({ messageId, isPinned }) => {
      get().updateCachedMessage(messageId, (msg) => ({ ...msg, isPinned }));
      const currentSelectedUser = get().selectedUser;
      if (currentSelectedUser) {
        const activeMsgs = get().messages || [];
        const pinned = activeMsgs.find(m => String(m._id) === String(messageId) && isPinned);
        set({ pinnedMessage: pinned || null });
      }
    });

    socket.on("userLastSeen", ({ userId, lastSeen }) => {
      set({ lastSeenMap: { ...get().lastSeenMap, [userId]: lastSeen } });
    });

    socket.on("userTyping", ({ from, type }) => {
      const myId = useAuthStore.getState().authUser?._id;
      if (myId && String(from) === String(myId)) return;
      set({ typingUsers: { ...get().typingUsers, [from]: type || "text" } });
    });

    socket.on("userStoppedTyping", ({ from }) => {
      const myId = useAuthStore.getState().authUser?._id;
      if (myId && String(from) === String(myId)) return;
      const n = { ...get().typingUsers };
      delete n[from];
      set({ typingUsers: n });
    });
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
