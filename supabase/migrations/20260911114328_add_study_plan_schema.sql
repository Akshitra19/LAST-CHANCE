-- Additive LAST CHANCE schema expansion for granular study planning.

begin;

alter table public.app_settings
  add column if not exists saturday_study_hours numeric(4, 1) not null default 7;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'app_settings_saturday_hours_check' and conrelid = 'public.app_settings'::regclass) then
    alter table public.app_settings add constraint app_settings_saturday_hours_check check (saturday_study_hours >= 0 and saturday_study_hours <= 24);
  end if;
end
$$;

alter table public.daily_tasks
  add column if not exists plan_key text,
  add column if not exists plan_slot smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'daily_tasks_plan_pair_check' and conrelid = 'public.daily_tasks'::regclass) then
    alter table public.daily_tasks add constraint daily_tasks_plan_pair_check check ((plan_key is null) = (plan_slot is null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'daily_tasks_plan_key_check' and conrelid = 'public.daily_tasks'::regclass) then
    alter table public.daily_tasks add constraint daily_tasks_plan_key_check check (plan_key is null or length(btrim(plan_key)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'daily_tasks_plan_slot_check' and conrelid = 'public.daily_tasks'::regclass) then
    alter table public.daily_tasks add constraint daily_tasks_plan_slot_check check (plan_slot is null or plan_slot in (1, 2, 3));
  end if;
end
$$;

create unique index if not exists daily_tasks_plan_key_date_slot_uidx
  on public.daily_tasks (plan_key, task_date, plan_slot)
  where plan_key is not null;

commit;
