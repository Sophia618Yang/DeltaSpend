alter table public.profiles
  add column if not exists role text not null default 'trial',
  add column if not exists parse_daily_limit integer,
  add column if not exists parse_rate_per_minute integer,
  add column if not exists parse_concurrent_limit integer;

alter table public.expense_parse_jobs
  add column if not exists file_hash text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes integer,
  add column if not exists failure_reason text,
  add column if not exists retry_count integer not null default 0,
  add column if not exists model_used text,
  add column if not exists input_tokens integer,
  add column if not exists output_tokens integer,
  add column if not exists total_tokens integer,
  add column if not exists duration_ms integer,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

create index if not exists expense_parse_jobs_user_created_idx
on public.expense_parse_jobs(user_id, created_at desc);

create index if not exists expense_parse_jobs_user_hash_idx
on public.expense_parse_jobs(user_id, file_hash);
