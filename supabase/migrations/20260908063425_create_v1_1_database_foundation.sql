-- LAST CHANCE V1.1 database foundation.
-- Browser roles receive no table privileges; the Express backend uses service_role.

create table public.app_settings (
  singleton_key text primary key default 'default',
  exam_name text not null,
  exam_date date,
  target_marks smallint not null,
  weekday_study_hours numeric(4, 1) not null,
  sunday_study_hours numeric(4, 1) not null,
  monday_study_hours numeric(4, 1) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton_key_check check (singleton_key = 'default'),
  constraint app_settings_exam_name_check check (length(btrim(exam_name)) > 0),
  constraint app_settings_target_marks_check check (target_marks between 0 and 100),
  constraint app_settings_weekday_hours_check check (weekday_study_hours >= 0),
  constraint app_settings_sunday_hours_check check (sunday_study_hours >= 0),
  constraint app_settings_monday_hours_check check (monday_study_hours >= 0)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  syllabus_version text not null,
  source_paper_code text not null,
  official_section_number smallint,
  name text not null,
  display_order smallint not null,
  is_official boolean not null default true,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_code_check check (length(btrim(code)) > 0),
  constraint subjects_syllabus_version_check check (syllabus_version = 'GATE_2027'),
  constraint subjects_source_paper_code_check check (source_paper_code in ('GA', 'CS')),
  constraint subjects_section_check check (
    (source_paper_code = 'GA' and official_section_number is null)
    or (source_paper_code = 'CS' and official_section_number between 1 and 10)
  ),
  constraint subjects_name_check check (length(btrim(name)) > 0),
  constraint subjects_display_order_check check (display_order > 0),
  constraint subjects_version_code_key unique (syllabus_version, code),
  constraint subjects_id_version_key unique (id, syllabus_version)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null,
  parent_topic_id uuid,
  code text not null,
  syllabus_version text not null,
  name text not null,
  display_order smallint not null,
  is_official boolean not null default true,
  official_source_text text,
  preparation_status text not null default 'NOT_STARTED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_code_check check (length(btrim(code)) > 0),
  constraint topics_syllabus_version_check check (syllabus_version = 'GATE_2027'),
  constraint topics_name_check check (length(btrim(name)) > 0),
  constraint topics_display_order_check check (display_order > 0),
  constraint topics_status_check check (preparation_status in (
    'NOT_STARTED', 'LEARNING', 'PRACTICING', 'PYQ', 'REVISING', 'MASTERED', 'WEAK'
  )),
  constraint topics_not_own_parent_check check (parent_topic_id is null or parent_topic_id <> id),
  constraint topics_version_code_key unique (syllabus_version, code),
  constraint topics_id_subject_key unique (id, subject_id),
  constraint topics_id_subject_version_key unique (id, subject_id, syllabus_version),
  constraint topics_subject_version_fkey foreign key (subject_id, syllabus_version)
    references public.subjects (id, syllabus_version) on delete restrict,
  constraint topics_parent_same_subject_version_fkey
    foreign key (parent_topic_id, subject_id, syllabus_version)
    references public.topics (id, subject_id, syllabus_version) on delete restrict
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete restrict,
  topic_id uuid not null,
  question_text text not null,
  question_type text not null,
  marks smallint not null,
  difficulty text,
  year smallint,
  source text,
  correct_answer jsonb not null,
  explanation text,
  image_path text,
  archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_topic_subject_fkey foreign key (topic_id, subject_id)
    references public.topics (id, subject_id) on delete restrict,
  constraint questions_text_check check (length(btrim(question_text)) > 0),
  constraint questions_type_check check (question_type in ('MCQ', 'MSQ', 'NAT')),
  constraint questions_marks_check check (marks in (1, 2)),
  constraint questions_difficulty_check check (difficulty is null or difficulty in ('EASY', 'MEDIUM', 'HARD')),
  constraint questions_year_check check (year is null or year between 1980 and 2100),
  constraint questions_archive_check check (archived or archived_at is null)
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  option_key text not null,
  option_text text not null,
  display_order smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_options_key_check check (length(btrim(option_key)) > 0),
  constraint question_options_text_check check (length(btrim(option_text)) > 0),
  constraint question_options_display_order_check check (display_order > 0),
  constraint question_options_question_key_key unique (question_id, option_key),
  constraint question_options_question_order_key unique (question_id, display_order)
);

create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  task_date date not null,
  subject_id uuid references public.subjects (id) on delete restrict,
  topic_id uuid,
  task_type text not null,
  planned_minutes integer not null,
  actual_minutes integer,
  status text not null default 'TODO',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_tasks_topic_subject_fkey foreign key (topic_id, subject_id)
    references public.topics (id, subject_id) on delete restrict,
  constraint daily_tasks_topic_requires_subject_check check (topic_id is null or subject_id is not null),
  constraint daily_tasks_type_check check (task_type in (
    'THEORY', 'PRACTICE', 'PYQ', 'REVISION', 'TEST', 'MATH', 'APTITUDE'
  )),
  constraint daily_tasks_planned_minutes_check check (planned_minutes > 0),
  constraint daily_tasks_actual_minutes_check check (actual_minutes is null or actual_minutes >= 0),
  constraint daily_tasks_status_check check (status in ('TODO', 'DONE', 'SKIPPED'))
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  test_type text not null,
  duration_minutes integer not null,
  total_marks numeric(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tests_name_check check (length(btrim(name)) > 0),
  constraint tests_type_check check (test_type in ('TOPIC', 'CUSTOM', 'FULL_MOCK')),
  constraint tests_duration_check check (duration_minutes > 0),
  constraint tests_total_marks_check check (total_marks is null or total_marks >= 0)
);

create table public.test_questions (
  test_id uuid not null references public.tests (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  position smallint not null,
  created_at timestamptz not null default now(),
  constraint test_questions_position_check check (position > 0),
  constraint test_questions_pkey primary key (test_id, question_id),
  constraint test_questions_test_position_key unique (test_id, position)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests (id) on delete restrict,
  status text not null default 'IN_PROGRESS',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(7, 2),
  total_time_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attempts_status_check check (status in ('IN_PROGRESS', 'SUBMITTED')),
  constraint attempts_submission_check check (
    (status = 'IN_PROGRESS' and submitted_at is null)
    or (status = 'SUBMITTED' and submitted_at is not null)
  ),
  constraint attempts_total_time_check check (total_time_seconds is null or total_time_seconds >= 0)
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  submitted_answer jsonb not null,
  is_correct boolean,
  marks_awarded numeric(5, 2),
  time_seconds integer not null default 0,
  marked_for_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint answers_marks_awarded_check check (marks_awarded is null or marks_awarded >= 0),
  constraint answers_time_seconds_check check (time_seconds >= 0),
  constraint answers_attempt_question_key unique (attempt_id, question_id)
);

create index topics_subject_id_idx on public.topics (subject_id);
create index topics_parent_topic_id_idx on public.topics (parent_topic_id);
create index questions_subject_id_idx on public.questions (subject_id);
create index questions_topic_id_idx on public.questions (topic_id);
create index daily_tasks_task_date_idx on public.daily_tasks (task_date);
create index daily_tasks_subject_id_idx on public.daily_tasks (subject_id);
create index daily_tasks_topic_id_idx on public.daily_tasks (topic_id);
create index question_options_question_id_idx on public.question_options (question_id);
create index test_questions_question_id_idx on public.test_questions (question_id);
create index attempts_test_id_idx on public.attempts (test_id);
create index attempts_started_at_idx on public.attempts (started_at);
create index answers_attempt_id_idx on public.answers (attempt_id);
create index answers_question_id_idx on public.answers (question_id);

alter table public.app_settings enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.attempts enable row level security;
alter table public.answers enable row level security;

revoke all on table public.app_settings, public.subjects, public.topics,
  public.questions, public.question_options, public.daily_tasks, public.tests,
  public.test_questions, public.attempts, public.answers from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.app_settings, public.subjects,
  public.topics, public.questions, public.question_options, public.daily_tasks,
  public.tests, public.test_questions, public.attempts, public.answers to service_role;
