import { sb } from './data';

/* Мұғалімдердің нақты пікірлері (supabase: reviews). Мұғалім кабинеттен жазады,
   әкімші бекітеді, басты бетте тек бекітілгені көрінеді. Ойдан шығарылған пікір жоқ. */
export interface Review { id: string; name: string; school: string; text: string; created_at: string; approved?: boolean; user_id?: string }

export async function publicReviews(): Promise<Review[]> {
  const { data } = await sb.from('reviews').select('id,name,school,text,created_at').eq('approved', true).order('created_at', { ascending: false }).limit(6);
  return (data as Review[]) || [];
}
export async function myReview(uid: string): Promise<Review | null> {
  const { data } = await sb.from('reviews').select('id,name,school,text,created_at,approved').eq('user_id', uid).order('created_at', { ascending: false }).limit(1);
  return (data?.[0] as Review) || null;
}
export async function sendReview(r: { name: string; school: string; text: string }) {
  const { error } = await sb.from('reviews').insert({ ...r, consent: true });
  if (error) throw new Error(/check/.test(error.message) ? 'Пікір 20–600 таңба болуы керек.' : 'Жіберу мүмкін болмады. Қайталап көріңіз.');
}
export async function deleteReview(id: string) { await sb.from('reviews').delete().eq('id', id); }
/* әкімші */
export async function allReviews(): Promise<Review[]> {
  const { data } = await sb.from('reviews').select('id,name,school,text,created_at,approved,user_id').order('created_at', { ascending: false }).limit(100);
  return (data as Review[]) || [];
}
export async function setApproved(id: string, approved: boolean) {
  const { error } = await sb.from('reviews').update({ approved }).eq('id', id);
  if (error) throw error;
}
