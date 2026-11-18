import { useCallback, useEffect, useState } from 'react';
import { sb } from './data';

/** Хабарландыру (әкімші → барлық мұғалім) */
export type NoticeKind = 'holiday' | 'sale' | 'update' | 'info';
export interface Notice {
  id: string; kind: NoticeKind; title: string; body: string; cta_label: string | null; cta_url: string | null;
  starts_at: string; ends_at: string | null; active: boolean; created_at: string;
}
export const NOTICE_KIND: Record<NoticeKind, { label: string; icon: string }> = {
  holiday: { label: 'Мереке', icon: '🎉' },
  sale: { label: 'Жеңілдік', icon: '🏷️' },
  update: { label: 'Жаңарту', icon: '✨' },
  info: { label: 'Хабар', icon: '📢' },
};
/** cta_url = 'subscribe' — жазылым терезесін ашады; '/…' — сайт ішіндегі бет; әйтпесе сыртқы сілтеме */
export const SUBSCRIBE_CTA = 'subscribe';

/** Әлі көрмеген белсенді хабарландырулар (ескісі бірінші) */
export async function unseenNotices(uid: string): Promise<Notice[]> {
  const [a, r] = await Promise.all([
    sb.from('announcements').select('*').eq('active', true).order('created_at', { ascending: true }).limit(20),
    sb.from('announcement_reads').select('announcement_id').eq('user_id', uid),
  ]);
  if (a.error || !a.data) return [];
  const seen = new Set((r.data || []).map((x: { announcement_id: string }) => x.announcement_id));
  const now = new Date().toISOString();
  return (a.data as Notice[]).filter((n) => !seen.has(n.id) && n.starts_at <= now && (!n.ends_at || n.ends_at > now));
}
export const markNoticeSeen = (id: string) => sb.from('announcement_reads').upsert({ announcement_id: id }, { onConflict: 'announcement_id,user_id', ignoreDuplicates: true });

/** Хат (мұғалім ↔ әкімші) */
export interface Msg { id: string; user_id: string; from_admin: boolean; body: string; created_at: string; read_at: string | null }

export async function loadThread(uid: string): Promise<Msg[]> {
  const { data } = await sb.from('messages').select('*').eq('user_id', uid).order('created_at', { ascending: true }).limit(500);
  return (data as Msg[]) || [];
}
export async function sendMsg(uid: string, body: string, fromAdmin = false) {
  return sb.from('messages').insert({ user_id: uid, body: body.trim(), from_admin: fromAdmin });
}
export const markRead = (forUser?: string) => sb.rpc('mark_messages_read', forUser ? { p_user: forUser } : {});

/** Мұғалім үшін: әкімшінің оқылмаған хаттарының саны (мәзірдегі белгі) */
export function useUnread(uid: string | undefined) {
  const [n, setN] = useState(0);
  const refresh = useCallback(async () => {
    if (!uid) return setN(0);
    const { count } = await sb.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('from_admin', true).is('read_at', null);
    setN(count || 0);
  }, [uid]);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 60000);
    const f = () => void refresh(); window.addEventListener('fs-unread', f);
    return () => { clearInterval(t); window.removeEventListener('fs-unread', f); };
  }, [refresh]);
  return n;
}
export const pingUnread = () => window.dispatchEvent(new Event('fs-unread'));

export const hm = (s: string) => new Date(s).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
export const dayLabel = (s: string) => {
  const d = new Date(s), t = new Date(), y = new Date(Date.now() - 864e5);
  if (d.toDateString() === t.toDateString()) return 'Бүгін';
  if (d.toDateString() === y.toDateString()) return 'Кеше';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
