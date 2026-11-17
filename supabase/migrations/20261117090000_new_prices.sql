-- Жаңа бағалар (₸). web/src/app/lib/config.ts-тағы priceOf() осымен бірдей болуы керек.
--   Жылдық: 7–9-сынып — 5000, 10–11-сынып — 4000; бес сынып бірге (7–11) — 19 990 (жеңілдікпен).
--   Айлық: әр сыныпқа 1500.
create or replace function public.plan_price(p_plan text, p_grades integer[])
returns integer language sql immutable set search_path to 'public' as $$
  select case
    when p_plan = 'month' then 1500 * (select count(distinct g)::int from unnest(p_grades) g)
    when (select array_agg(distinct g order by g) from unnest(p_grades) g) = array[7, 8, 9, 10, 11] then 19990
    else (select coalesce(sum(case when g <= 9 then 5000 else 4000 end), 0)::int from (select distinct unnest(p_grades) g) x)
  end
$$;

create or replace function public.request_subscription(p_grades integer[], p_plan text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare rid uuid; gs int[];
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_plan not in ('month', 'year') then raise exception 'bad plan'; end if;
  if exists (select 1 from unnest(p_grades) g where g not between 7 and 11) then raise exception 'bad grade'; end if;
  gs := (select array_agg(distinct g order by g) from unnest(p_grades) g);
  insert into payment_requests (user_id, grades, plan, amount)
  values (auth.uid(), gs, p_plan, plan_price(p_plan, gs))
  returning id into rid;
  return rid;
end $$;

drop function if exists public.plan_price(text, integer);
