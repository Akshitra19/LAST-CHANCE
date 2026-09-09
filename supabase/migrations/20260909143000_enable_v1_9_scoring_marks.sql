alter table public.answers
  drop constraint if exists answers_marks_awarded_check;

alter table public.answers
  alter column marks_awarded type numeric(8, 6)
  using marks_awarded::numeric(8, 6);

alter table public.answers
  add constraint answers_marks_awarded_check check (
    marks_awarded is null
    or marks_awarded between -0.666667 and 2.000000
  );
