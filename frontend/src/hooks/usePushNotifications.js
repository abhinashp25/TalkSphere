import { useAuthStore } from "../store/useAuthStore";

export function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// Call this after the socket is connected.
// Returns a cleanup function to remove the listener.
export function subscribeToNotifications(socket, getContactName) {
  if (!("Notification" in window)) return () => {};

  const handleNewMessage = (newMessage) => {
    // Only show if the page is not visible
    if (document.visibilityState === "visible") return;
    if (Notification.permission !== "granted") return;

    const senderName = getContactName(newMessage.senderId) || "New message";
    const body = newMessage.text
      ? newMessage.text.slice(0, 80)
      : "📷 Sent you an image";

    const notification = new Notification(`TalkSphere — ${senderName}`, {
      body,
      icon: "/avatar.png",
      tag: newMessage.senderId, // group notifications per sender
    });

    // Click → focus the tab
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  socket.on("newMessage", handleNewMessage);

  return () => socket.off("newMessage", handleNewMessage);
}
