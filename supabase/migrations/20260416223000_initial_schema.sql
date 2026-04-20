create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  merchant text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  category text not null,
  spent_at timestamptz not null,
  source_type text not null,
  source_file_url text,
  notes text,
  is_subscription_candidate boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_parse_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_url text not null,
  status text not null default 'pending',
  parsed_payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  merchant text not null,
  normalized_merchant text not null,
  cadence text not null,
  last_amount numeric(12, 2) not null,
  status text not null default 'active',
  snoozed_until timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_merchant_idx
on public.subscriptions(user_id, normalized_merchant);

create table if not exists public.subscription_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  merchant text not null,
  normalized_merchant text not null,
  latest_amount numeric(12, 2) not null,
  cadence_guess text not null,
  confidence numeric(5, 2) not null default 0,
  status text not null default 'pending',
  source_expense_id uuid references public.expenses(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists subscription_candidates_user_merchant_idx
on public.subscription_candidates(user_id, normalized_merchant);

create table if not exists public.trial_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_name text not null,
  trial_ends_at timestamptz not null,
  first_charge_amount numeric(12, 2) not null,
  currency text not null default 'USD',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute procedure public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_parse_jobs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_candidates enable row level security;
alter table public.trial_reminders enable row level security;

create policy "profiles own rows" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "expenses own rows" on public.expenses
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "parse jobs own rows" on public.expense_parse_jobs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscriptions own rows" on public.subscriptions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscription candidates own rows" on public.subscription_candidates
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trial reminders own rows" on public.trial_reminders
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "expense files upload own folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'expense-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "expense files read own folder" on storage.objects
for select to authenticated
using (
  bucket_id = 'expense-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
