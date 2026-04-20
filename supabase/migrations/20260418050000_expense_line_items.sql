alter table public.expenses
  add column if not exists line_items jsonb;
