-- Бағалар мен промокодтар — әкімші панельден басқарылады (/admin → «Бағалар», «Промокодтар»).
--
-- prices: әр мерзім (month/year) × сынып (7–11) бағасы; grade = 0 — барлық бес сынып бірге алынғандағы баға
--   (null — мұндай жиынтық баға жоқ). Әр бағаға жеңілдік: sale_price (жеңілдік бағасы) және sale_until (соңғы күні,
--   null — мерзімсіз). Нақты баға: жеңілдік әрекет етсе — sale_price, әйтпесе — price.
-- promo_codes: пайыздық (pct) немесе сомалық (sum, ₸) жеңілдік; мерзімге/жазылым түріне/қолдану санына шектеуге болады.
--   Қолданылу саны төлем расталғанда артады.
-- Соманы әрдайым дерекқор есептейді (request_subscription), браузер тек көрсетеді.

create table if not exists public.prices (
  plan text not null check (plan in ('month', 'year')),
  grade int not null check (grade = 0 or grade between 7 and 11),
  price int check (price >= 0),
  sale_price int check (sale_price >= 0),
  sale_until date,
  updated_at timestamptz not null default now(),
  primary key (plan, grade)
);
alter table public.prices enable row level security;
drop policy if exists "prices are public" on public.prices;
create policy "prices are public" on public.prices for select using (true);
drop policy if exists "admin edits prices" on public.prices;
create policy "admin edits prices" on public.prices for all using (is_admin()) with check (is_admin());

insert into public.prices (plan, grade, price) values
  ('month', 7, 1500), ('month', 8, 1500), ('month', 9, 1500), ('month', 10, 1500), ('month', 11, 1500), ('month', 0, null),
  ('year', 7, 5000), ('year', 8, 5000), ('year', 9, 5000), ('year', 10, 4000), ('year', 11, 4000), ('year', 0, 19990)
on conflict (plan, grade) do nothing;

create table if not exists public.promo_codes (
  code text primary key check (code = upper(code) and code ~ '^[A-Z0-9А-ЯӘҒҚҢӨҰҮҺІ_-]{3,32}$'),
  kind text not null check (kind in ('pct', 'sum')),
  value int not null check (value > 0 and (kind <> 'pct' or value <= 100)),
  plan text check (plan in ('month', 'year')),
  max_uses int check (max_uses > 0),
  used int not null default 0,
  valid_until date,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);
alter table public.promo_codes enable row level security;
drop policy if exists "admin manages promo codes" on public.promo_codes;
create policy "admin manages promo codes" on public.promo_codes for all using (is_admin()) with check (is_admin());

alter table public.payment_requests add column if not exists base_amount int;
alter table public.payment_requests add column if not exists promo_code text;
alter table public.payment_requests add column if not exists discount int not null default 0;

-- бір бағаның нақты мәні (жеңілдік мерзімін ескеріп)
create or replace function public.price_now(p_plan text, p_grade int)
returns int language sql stable set search_path to 'public' as $$
  select case when sale_price is not null and (sale_until is null or sale_until >= kz_today()) then sale_price else price end
  from prices where plan = p_plan and grade = p_grade
$$;

drop function if exists public.plan_price(text, integer);
create or replace function public.plan_price(p_plan text, p_grades integer[])
returns integer language plpgsql stable set search_path to 'public' as $$
declare gs int[]; b int;
begin
  gs := (select array_agg(distinct g order by g) from unnest(p_grades) g);
  if gs = array[7, 8, 9, 10, 11] then
    b := price_now(p_plan, 0);
    if b is not null then return b; end if;
  end if;
  return (select coalesce(sum(price_now(p_plan, g)), 0)::int from unnest(gs) g);
end $$;

-- промокодтың жеңілдігі: (discount, err) — err бос болса, код жарамды
create or replace function public.promo_discount(p_code text, p_plan text, p_base int, out discount int, out err text)
language plpgsql stable security definer set search_path to 'public' as $$
declare c promo_codes;
begin
  discount := 0; err := null;
  select * into c from promo_codes where code = upper(trim(p_code));
  if c.code is null or not c.active then err := 'Мұндай промокод жоқ.'; return; end if;
  if c.valid_until is not null and c.valid_until < kz_today() then err := 'Промокодтың мерзімі өтіп кеткен.'; return; end if;
  if c.max_uses is not null and c.used >= c.max_uses then err := 'Промокод таусылды.'; return; end if;
  if c.plan is not null and c.plan <> p_plan then
    err := 'Бұл промокод тек ' || case when c.plan = 'month' then '1 айлық' else '1 жылдық' end || ' жазылымға жарайды.'; return;
  end if;
  discount := least(p_base, case when c.kind = 'pct' then round(p_base * c.value / 100.0)::int else c.value end);
end $$;
revoke all on function public.promo_discount(text, text, int) from public, anon;

-- сатып алушыға соманы көрсету (промокодпен)
create or replace function public.quote_subscription(p_grades integer[], p_plan text, p_promo text default null)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare base int; d int := 0; e text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_plan not in ('month', 'year') then raise exception 'bad plan'; end if;
  base := plan_price(p_plan, p_grades);
  if coalesce(trim(p_promo), '') <> '' then select x.discount, x.err into d, e from promo_discount(p_promo, p_plan, base) x; end if;
  return json_build_object('base', base, 'discount', coalesce(d, 0), 'amount', base - coalesce(d, 0), 'error', e);
end $$;

drop function if exists public.request_subscription(integer[], text);
create or replace function public.request_subscription(p_grades integer[], p_plan text, p_promo text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare rid uuid; gs int[]; base int; d int := 0; e text; pc text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_plan not in ('month', 'year') then raise exception 'bad plan'; end if;
  if exists (select 1 from unnest(p_grades) g where g not between 7 and 11) then raise exception 'bad grade'; end if;
  gs := (select array_agg(distinct g order by g) from unnest(p_grades) g);
  base := plan_price(p_plan, gs);
  if coalesce(trim(p_promo), '') <> '' then
    select x.discount, x.err into d, e from promo_discount(p_promo, p_plan, base) x;
    if e is not null then raise exception '%', e; end if;
    pc := upper(trim(p_promo));
  end if;
  insert into payment_requests (user_id, grades, plan, amount, base_amount, promo_code, discount)
  values (auth.uid(), gs, p_plan, base - d, base, pc, d)
  returning id into rid;
  return rid;
end $$;

-- төлем расталғанда промокодтың қолданылу санын арттыру
create or replace function public.decide_request(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
declare r payment_requests; g int; base date; s subscriptions;
begin
  -- admins from the website, or the Telegram bot (service role) after checking the admin's chat
  if not (is_admin() or coalesce(auth.role(), '') = 'service_role') then raise exception 'forbidden'; end if;
  select * into r from payment_requests where id = p_id for update;
  if r.id is null or r.status <> 'pending' then raise exception 'request not pending'; end if;
  update payment_requests set status = case when p_approve then 'approved' else 'rejected' end, decided_at = now() where id = p_id;
  if p_approve then
    foreach g in array r.grades loop
      select * into s from subscriptions where user_id = r.user_id and grade = g;
      base := case when s.id is null or s.trial or s.paid_until < kz_today() then kz_today() else s.paid_until end;
      insert into subscriptions (user_id, grade, paid_until, trial)
      values (r.user_id, g, base + case when r.plan = 'month' then interval '1 month' else interval '1 year' end, false)
      on conflict (user_id, grade) do update set paid_until = excluded.paid_until, trial = false, updated_at = now();
    end loop;
    if r.promo_code is not null then update promo_codes set used = used + 1 where code = r.promo_code; end if;
  end if;
end $$;
