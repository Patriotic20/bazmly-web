// Mijoz xabarlari — backend `/v1/notifications`
import { api } from "./client";

export type Note = { id: string; text: string; at: number; read?: boolean };
type BNote = { id: number; type: string; title: string; body: string; read_at: string | null; sent_at: string };

export async function fetchNotes(): Promise<Note[]> {
  const page = await api<{ items: BNote[] }>("/v1/notifications", { query: { limit: 100, offset: 0 } });
  return page.items.map((n) => ({
    id: String(n.id),
    // body ba'zan "— 05.12, 18:00" ko'rinishida keladi (muassasa nomi bo'sh) — ortiqcha tire qo'shilmaydi
    text: [n.title, n.body].map((x) => (x ?? "").trim()).filter(Boolean).join(n.body?.trim().startsWith("—") ? " " : " — "),
    at: new Date(n.sent_at).getTime(),
    read: Boolean(n.read_at),
  }));
}
export const markNoteRead = (id: string) => api(`/v1/notifications/${id}/read`, { method: "POST" });
export const markAllNotesRead = () => api("/v1/notifications/read-all", { method: "POST" });
export const unreadCount = () => api<{ count?: number; unread?: number } | number>("/v1/notifications/unread-count");
