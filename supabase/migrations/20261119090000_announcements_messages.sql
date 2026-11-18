-- Хабарландырулар (әкімші → барлық мұғалім) және хат алмасу (мұғалім ↔ әкімші)

-- ── Хабарландырулар ──
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'info' check (kind in ('holiday', 'sale', 'update', 'info')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 2000),
  cta_label text check (cta_label is null or char_length(cta_label) <= 40),
  cta_url text check (cta_url is null or char_length(cta_url) <= 300),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
create policy announcements_read on public.announcements for select to authenticated
  using ((active and starts_at <= now() and (ends_at is null or ends_at > now())) or (select public.is_admin()));
create policy announcements_admin_ins on public.announcements for insert to authenticated with check ((select public.is_admin()));
create policy announcements_admin_upd on public.announcements for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy announcements_admin_del on public.announcements for delete to authenticated using ((select public.is_admin()));

-- кім көрді (әр мұғалімге бір рет шығады)
create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);
alter table public.announcement_reads enable row level security;
create policy ann_reads_select on public.announcement_reads for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy ann_reads_insert on public.announcement_reads for insert to authenticated with check (user_id = (select auth.uid()));

-- ── Хат алмасу: әр мұғалімнің әкімшімен бір «тредi» (user_id) ──
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_admin boolean not null default false,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_user_created on public.messages (user_id, created_at);
alter table public.messages enable row level security;
create policy messages_select on public.messages for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy messages_insert on public.messages for insert to authenticated with check (
  (user_id = (select auth.uid()) and not from_admin) or ((select public.is_admin()) and from_admin));
create policy messages_admin_delete on public.messages for delete to authenticated using ((select public.is_admin()));

-- оқылды деп белгілеу: мұғалім — әкімшінің хаттарын; әкімші — мұғалімнің хаттарын
create or replace function public.mark_messages_read(p_user uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is not null then
    if not public.is_admin() then raise exception 'forbidden'; end if;
    update public.messages set read_at = now() where user_id = p_user and not from_admin and read_at is null;
  else
    update public.messages set read_at = now() where user_id = auth.uid() and from_admin and read_at is null;
  end if;
end $$;
revoke all on function public.mark_messages_read(uuid) from public, anon;
grant execute on function public.mark_messages_read(uuid) to authenticated;

-- жаңа хат туралы Telegram хабары (бот: мұғалімнен → әкімшілерге, әкімшіден → мұғалімге)
create or replace function public.msg_notify() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(url := 'https://rumnyvcgpswdxjheaeif.supabase.co/functions/v1/telegram',
    body := jsonb_build_object('type', 'msg', 'id', new.id), headers := '{"Content-Type":"application/json"}'::jsonb);
  return new;
end $$;
drop trigger if exists messages_notify on public.messages;
create trigger messages_notify after insert on public.messages for each row execute function public.msg_notify();
