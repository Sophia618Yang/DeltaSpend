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
