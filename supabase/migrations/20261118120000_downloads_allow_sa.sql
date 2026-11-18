-- БЖБ/ТЖБ (kind = 'sa') жүктеуі тіркелмей, «Жүктеуді тіркеу мүмкін болмады» қатесі шығатын еді
alter table public.downloads drop constraint downloads_kind_check;
alter table public.downloads add constraint downloads_kind_check check (kind = any (array['kmzh'::text, 'pres'::text, 'ws'::text, 'sa'::text]));
