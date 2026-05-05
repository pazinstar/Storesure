import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { messagingService, ApiMessage } from "@/services/messaging.service";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  content: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  folder: "inbox" | "sent";
}

interface MessageContextType {
  messages: Message[];
  unreadCount: number;
  loading: boolean;
  addMessage: (message: Omit<Message, "id" | "timestamp" | "read" | "starred">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toggleStar: (id: string) => void;
  deleteMessage: (id: string) => void;
  sendMessage: (recipientId: string, recipientName: string, recipientRole: string, subject: string, content: string) => Promise<void>;
  getSentMessages: () => Message[];
  getInboxMessages: () => Message[];
  refresh: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

/** Convert an API message into the local Message shape. */
function toLocal(msg: ApiMessage, folder: "inbox" | "sent"): Message {
  return {
    id: String(msg.id),
    senderId: msg.sender_id,
    senderName: msg.sender_name,
    senderRole: msg.sender_role?.replace("_", " ") || "User",
    recipientId: msg.recipient_id,
    recipientName: msg.recipient_name,
    subject: msg.subject,
    content: msg.content,
    timestamp: new Date(msg.created_at),
    read: msg.read,
    starred: msg.starred,
    folder,
  };
}

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const [inbox, sent] = await Promise.all([
        messagingService.getInbox(),
        messagingService.getSent(),
      ]);
      setInboxMessages(inbox.map((m) => toLocal(m, "inbox")));
      setSentMessages(sent.map((m) => toLocal(m, "sent")));
    } catch {
      // API might not be reachable (dev mode) — keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const messages = [...inboxMessages, ...sentMessages].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const unreadCount = inboxMessages.filter((m) => !m.read).length;

  const addMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp" | "read" | "starred">) => {
      const newMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        read: false,
        starred: false,
      };
      if (message.folder === "sent") {
        setSentMessages((prev) => [newMessage, ...prev]);
      } else {
        setInboxMessages((prev) => [newMessage, ...prev]);
      }
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setInboxMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: true } : m))
    );
    // Fire API call in background
    messagingService.markRead(Number(id)).catch(() => {});
  }, []);

  const markAllAsRead = useCallback(() => {
    setInboxMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    messagingService.markAllRead().catch(() => {});
  }, []);

  const toggleStar = useCallback((id: string) => {
    setInboxMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m))
    );
    messagingService.toggleStar(Number(id)).catch(() => {});
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setInboxMessages((prev) => prev.filter((m) => m.id !== id));
    setSentMessages((prev) => prev.filter((m) => m.id !== id));
    messagingService.deleteMessage(Number(id)).catch(() => {});
  }, []);

  const sendMessage = useCallback(
    async (recipientId: string, recipientName: string, recipientRole: string, subject: string, content: string) => {
      try {
        const apiMsg = await messagingService.compose({
          recipient_id: recipientId,
          subject,
          content,
        });
        // Add the sent copy locally
        setSentMessages((prev) => [toLocal(apiMsg, "sent"), ...prev]);
      } catch {
        // Fallback: still show it locally
        const sentCopy: Message = {
          id: crypto.randomUUID(),
          senderId: "current-user",
          senderName: "You",
          senderRole: "User",
          recipientId,
          recipientName,
          subject,
          content,
          timestamp: new Date(),
          read: true,
          starred: false,
          folder: "sent",
        };
        setSentMessages((prev) => [sentCopy, ...prev]);
      }
    },
    []
  );

  const getInboxMessagesFn = useCallback(() => inboxMessages, [inboxMessages]);
  const getSentMessagesFn = useCallback(() => sentMessages, [sentMessages]);

  return (
    <MessageContext.Provider
      value={{
        messages,
        unreadCount,
        loading,
        addMessage,
        markAsRead,
        markAllAsRead,
        toggleStar,
        deleteMessage,
        sendMessage,
        getSentMessages: getSentMessagesFn,
        getInboxMessages: getInboxMessagesFn,
        refresh: fetchMessages,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessages must be used within MessageProvider");
  }
  return context;
}
