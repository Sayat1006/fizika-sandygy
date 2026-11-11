-- Сабақ кезінде оқушылардың телефоннан қосылуы: сессия, қатысушылар, жауаптар
-- (Supabase-та қолданылған: 20261111132721_live_class_sessions)
create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9]{6}$'),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  question jsonb,                 -- ағымдағы сұрақ: {id, kind, text, options[], correct?, open, reveal}
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create index live_sessions_teacher_idx on public.live_sessions (teacher_id, created_at desc);

create table public.live_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  secret uuid not null default gen_random_uuid(),
  joined_at timestamptz not null default now()
);
create index live_participants_session_idx on public.live_participants (session_id);

create table public.live_answers (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  participant_id uuid not null references public.live_participants(id) on delete cascade,
  qid text not null,
  answer text not null check (char_length(answer) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (participant_id, qid)
);
create index live_answers_session_idx on public.live_answers (session_id, qid);

alter table public.live_sessions enable row level security;
alter table public.live_participants enable row level security;
alter table public.live_answers enable row level security;

-- Мұғалім тек өз сессиясын көреді және басқарады
create policy live_sessions_own on public.live_sessions for all to authenticated
  using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));
create policy live_participants_teacher on public.live_participants for select to authenticated
  using (exists (select 1 from public.live_sessions s where s.id = session_id and s.teacher_id = (select auth.uid())));
create policy live_answers_teacher on public.live_answers for select to authenticated
  using (exists (select 1 from public.live_sessions s where s.id = session_id and s.teacher_id = (select auth.uid())));

-- Сессияны бастау (мұғалім): алдыңғы ашық сессиялар жабылады, 6 таңбалы бірегей код
create or replace function public.live_start(p_title text default '')
returns public.live_sessions language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c text; r public.live_sessions;
begin
  if uid is null then raise exception 'auth required'; end if;
  update live_sessions set ended_at = now() where teacher_id = uid and ended_at is null;
  loop
    c := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from live_sessions where code = c and ended_at is null);
  end loop;
  insert into live_sessions (code, teacher_id, title) values (c, uid, left(coalesce(p_title, ''), 200)) returning * into r;
  return r;
end $$;

-- Ашық сессия (4 сағаттан аспаған)
create or replace function public.live_open(p_code text)
returns public.live_sessions language sql stable security definer set search_path = public as $$
  select * from live_sessions where code = p_code and ended_at is null and created_at > now() - interval '4 hours' limit 1
$$;

-- Оқушы қосылады (тіркелусіз)
create or replace function public.live_join(p_code text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.live_sessions; p public.live_participants; nm text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  s := live_open(p_code);
  if s.id is null then raise exception 'session not found'; end if;
  if char_length(nm) < 1 or char_length(nm) > 40 then raise exception 'bad name'; end if;
  if (select count(*) from live_participants where session_id = s.id) >= 80 then raise exception 'session full'; end if;
  insert into live_participants (session_id, name) values (s.id, nm) returning * into p;
  return jsonb_build_object('pid', p.id, 'secret', p.secret, 'title', s.title);
end $$;

-- Оқушыға ағымдағы сұрақ (дұрыс жауап тек «көрсету» кезінде беріледі)
create or replace function public.live_state(p_code text, p_pid uuid default null, p_secret uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s public.live_sessions; q jsonb; mine text; ok boolean;
begin
  s := live_open(p_code);
  if s.id is null then return jsonb_build_object('ended', true); end if;
  q := s.question;
  ok := p_pid is not null and exists (select 1 from live_participants where id = p_pid and secret = p_secret and session_id = s.id);
  if q is not null then
    if not coalesce((q->>'reveal')::boolean, false) then q := q - 'correct'; end if;
    if ok then select answer into mine from live_answers where participant_id = p_pid and qid = q->>'id'; end if;
  end if;
  return jsonb_build_object('ended', false, 'title', s.title, 'question', q, 'mine', mine, 'joined', ok);
end $$;

-- Оқушының жауабы (сұрақ ашық болса ғана; қайта жіберсе — жаңартылады)
create or replace function public.live_answer(p_code text, p_pid uuid, p_secret uuid, p_qid text, p_answer text)
returns boolean language plpgsql security definer set search_path = public as $$
declare s public.live_sessions; a text := left(btrim(coalesce(p_answer, '')), 200);
begin
  s := live_open(p_code);
  if s.id is null or s.question is null or s.question->>'id' <> p_qid or not coalesce((s.question->>'open')::boolean, false) then return false; end if;
  if char_length(a) < 1 then return false; end if;
  if not exists (select 1 from live_participants where id = p_pid and secret = p_secret and session_id = s.id) then return false; end if;
  insert into live_answers (session_id, participant_id, qid, answer) values (s.id, p_pid, p_qid, a)
    on conflict (participant_id, qid) do update set answer = excluded.answer, created_at = now();
  return true;
end $$;

revoke all on function public.live_start(text) from public, anon;
grant execute on function public.live_start(text) to authenticated;
revoke all on function public.live_open(text) from public, anon, authenticated;
grant execute on function public.live_join(text, text) to anon, authenticated;
grant execute on function public.live_state(text, uuid, uuid) to anon, authenticated;
grant execute on function public.live_answer(text, uuid, uuid, text, text) to anon, authenticated;

-- Мұғалімнің тақтасы жауаптарды бірден көрсін
alter publication supabase_realtime add table public.live_answers, public.live_participants, public.live_sessions;
