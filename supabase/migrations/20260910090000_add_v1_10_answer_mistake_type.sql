alter table public.answers
  add column mistake_type text;

alter table public.answers
  add constraint answers_mistake_type_check check (
    mistake_type is null
    or (
      mistake_type in (
        'CONCEPT_GAP',
        'FORMULA_FORGOTTEN',
        'CALCULATION',
        'MISREAD',
        'GUESS',
        'TIME_PRESSURE',
        'RECALL_FAILURE'
      )
      and marks_awarded is not null
      and is_correct is distinct from true
    )
  );
