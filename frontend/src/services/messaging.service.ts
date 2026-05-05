import { apiConfig } from "./config";
import { apiFetch } from "@/contexts/AuthContext";

const BASE = `${apiConfig.baseUrl}/messages`;

export interface ApiMessage {
  id: number;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id: string;
  recipient_name: string;
  recipient_role: string;
  subject: string;
  content: string;
  priority: "normal" | "high" | "urgent";
  parent: number | null;
  read: boolean;
  starred: boolean;
  created_at: string;
  read_at: string | null;
}

export const messagingService = {
  async getInbox(): Promise<ApiMessage[]> {
    const res = await apiFetch(`${BASE}/inbox/`);
    if (!res.ok) throw new Error("Failed to fetch inbox");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  },

  async getSent(): Promise<ApiMessage[]> {
    const res = await apiFetch(`${BASE}/sent/`);
    if (!res.ok) throw new Error("Failed to fetch sent");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  },

  async getStarred(): Promise<ApiMessage[]> {
    const res = await apiFetch(`${BASE}/starred/`);
    if (!res.ok) throw new Error("Failed to fetch starred");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  },

  async getMessage(id: number): Promise<ApiMessage> {
    const res = await apiFetch(`${BASE}/${id}/`);
    if (!res.ok) throw new Error("Failed to fetch message");
    return res.json();
  },

  async compose(data: {
    recipient_id: string;
    subject: string;
    content: string;
    priority?: string;
    parent_id?: number | null;
  }): Promise<ApiMessage> {
    const res = await apiFetch(`${BASE}/compose/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to send message");
    }
    return res.json();
  },

  async markRead(id: number): Promise<ApiMessage> {
    const res = await apiFetch(`${BASE}/${id}/read/`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to mark as read");
    return res.json();
  },

  async markAllRead(): Promise<{ marked: number }> {
    const res = await apiFetch(`${BASE}/mark-all-read/`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to mark all as read");
    return res.json();
  },

  async toggleStar(id: number): Promise<ApiMessage> {
    const res = await apiFetch(`${BASE}/${id}/star/`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to toggle star");
    return res.json();
  },

  async deleteMessage(id: number): Promise<void> {
    const res = await apiFetch(`${BASE}/${id}/delete/`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete message");
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiFetch(`${BASE}/unread-count/`);
    if (!res.ok) return 0;
    const data = await res.json();
    return data.unread;
  },

  async getThread(userId: string): Promise<ApiMessage[]> {
    const res = await apiFetch(`${BASE}/thread/?user_id=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch thread");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  },
};
