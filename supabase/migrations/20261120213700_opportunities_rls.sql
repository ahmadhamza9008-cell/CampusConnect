alter table public.opportunities enable row level security;

grant select, insert on public.opportunities to anon;
grant select, insert, update, delete on public.opportunities to authenticated;

drop policy if exists "Public can read approved opportunities"
    on public.opportunities;
create policy "Public can read approved opportunities"
    on public.opportunities
    for select
    to anon, authenticated
    using (status = 'approved');

drop policy if exists "Public can submit pending opportunities"
    on public.opportunities;
create policy "Public can submit pending opportunities"
    on public.opportunities
    for insert
    to anon, authenticated
    with check (status = 'pending');

drop policy if exists "Admin can manage opportunities"
    on public.opportunities;
create policy "Admin can manage opportunities"
    on public.opportunities
    for all
    to authenticated
    using (auth.uid() = 'd1cece27-f205-461d-bce7-ec9ceaf0a2c0'::uuid)
    with check (auth.uid() = 'd1cece27-f205-461d-bce7-ec9ceaf0a2c0'::uuid);

drop policy if exists "Restrict opportunity reads"
    on public.opportunities;
create policy "Restrict opportunity reads"
    on public.opportunities
    as restrictive
    for select
    to anon, authenticated
    using (
        status = 'approved'
        or auth.uid() = 'd1cece27-f205-461d-bce7-ec9ceaf0a2c0'::uuid
    );

drop policy if exists "Restrict opportunity submissions"
    on public.opportunities;
create policy "Restrict opportunity submissions"
    on public.opportunities
    as restrictive
    for insert
    to anon, authenticated
    with check (
        status = 'pending'
        or auth.uid() = 'd1cece27-f205-461d-bce7-ec9ceaf0a2c0'::uuid
    );

drop policy if exists "Restrict opportunity updates"
    on public.opportunities;
create policy "Restrict opportunity updates"
    on public.opportunities
    as restrictive
    for update
    to anon, authenticated
    using (auth.uid() = 'd1cece27-f205-461d-bce7-ec9ceaf0a2c0'::uuid)
    with check (auth.uid() = 'd1cece27-f205-461d-bce7-ec9ceaf0a2c0'::uuid);

drop policy if exists "Restrict opportunity deletions"
    on public.opportunities;
create policy "Restrict opportunity deletions"
    on public.opportunities
    as restrictive
    for delete
    to anon, authenticated
    using (auth.uid() = 'd1cece27-f205-461d-bce7-ec9ceaf0a2c0'::uuid);
