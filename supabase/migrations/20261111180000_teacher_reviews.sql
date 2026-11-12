-- Мұғалімдердің пікірлері: кабинеттен жазылады, әкімші бекіткен соң басты бетте көрінеді.
-- Тек өз келісімімен (consent) және бекітілгені ғана жарияланады.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  school text not null default '' check (char_length(school) <= 120),
  text text not null check (char_length(btrim(text)) between 20 and 600),
  consent boolean not null check (consent),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_pub_idx on public.reviews (approved, created_at desc);
alter table public.reviews enable row level security;

-- Бекітілген пікірлерді бәрі көреді (басты бет)
create policy reviews_public on public.reviews for select to anon, authenticated using (approved);
-- Мұғалім өз пікірін көреді, жазады (бекітілмеген күйде ғана), өшіре алады
create policy reviews_own_select on public.reviews for select to authenticated using (user_id = (select auth.uid()));
create policy reviews_own_insert on public.reviews for insert to authenticated with check (user_id = (select auth.uid()) and not approved);
create policy reviews_own_delete on public.reviews for delete to authenticated using (user_id = (select auth.uid()));
-- Әкімші: бәрін көреді, бекітеді, өшіреді
create policy reviews_admin_select on public.reviews for select to authenticated using ((select public.is_admin()));
create policy reviews_admin_update on public.reviews for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy reviews_admin_delete on public.reviews for delete to authenticated using ((select public.is_admin()));

-- Басты бетке тек қажетті бағандар: user_id ашылмайды
revoke select on public.reviews from anon;
grant select (id, name, school, text, created_at, approved) on public.reviews to anon;
