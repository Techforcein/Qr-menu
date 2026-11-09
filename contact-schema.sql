-- PageForge Contact Forms Studio
-- Run this script once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.contact_forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled form' check (char_length(title) between 1 and 120),
  description text not null default '',
  fields jsonb not null default '[]'::jsonb,
  design jsonb not null default '{}'::jsonb,
  template text not null default 'pure-minimal',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.contact_forms(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists contact_forms_owner_idx on public.contact_forms(owner_id);
create index if not exists contact_submissions_form_idx on public.contact_form_submissions(form_id);
create index if not exists contact_submissions_date_idx on public.contact_form_submissions(submitted_at desc);

alter table public.contact_forms enable row level security;
alter table public.contact_form_submissions enable row level security;

drop policy if exists "contact forms public published or owner read" on public.contact_forms;
create policy "contact forms public published or owner read"
on public.contact_forms for select to anon, authenticated
using (published = true or owner_id = (select auth.uid()));

drop policy if exists "contact forms owner insert" on public.contact_forms;
create policy "contact forms owner insert"
on public.contact_forms for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "contact forms owner update" on public.contact_forms;
create policy "contact forms owner update"
on public.contact_forms for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "contact forms owner delete" on public.contact_forms;
create policy "contact forms owner delete"
on public.contact_forms for delete to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "public can submit to published forms" on public.contact_form_submissions;
create policy "public can submit to published forms"
on public.contact_form_submissions for insert to anon, authenticated
with check (
  exists (
    select 1 from public.contact_forms f
    where f.id = form_id and f.published = true
  )
);

drop policy if exists "owners read their form submissions" on public.contact_form_submissions;
create policy "owners read their form submissions"
on public.contact_form_submissions for select to authenticated
using (
  exists (
    select 1 from public.contact_forms f
    where f.id = form_id and f.owner_id = (select auth.uid())
  )
);

drop policy if exists "owners delete their form submissions" on public.contact_form_submissions;
create policy "owners delete their form submissions"
on public.contact_form_submissions for delete to authenticated
using (
  exists (
    select 1 from public.contact_forms f
    where f.id = form_id and f.owner_id = (select auth.uid())
  )
);

-- No public read/update/delete policy is created for submissions.
-- Public visitors can only INSERT into a currently published form.

-- Explicit API grants (RLS still controls which rows each role can access).
grant select on public.contact_forms to anon, authenticated;
grant insert, update, delete on public.contact_forms to authenticated;
grant insert on public.contact_form_submissions to anon, authenticated;
grant select, delete on public.contact_form_submissions to authenticated;

-- Upgrade existing installations safely (all statements are repeatable).
alter table public.contact_forms add column if not exists google_script_url text;
alter table public.contact_forms add column if not exists google_sheet_url text;
alter table public.contact_form_submissions add column if not exists read_at timestamptz;
alter table public.contact_form_submissions add column if not exists starred boolean not null default false;
alter table public.contact_form_submissions add column if not exists archived boolean not null default false;

drop policy if exists "owners update their form submissions" on public.contact_form_submissions;
create policy "owners update their form submissions"
on public.contact_form_submissions for update to authenticated
using (exists (select 1 from public.contact_forms f where f.id=form_id and f.owner_id=(select auth.uid())))
with check (exists (select 1 from public.contact_forms f where f.id=form_id and f.owner_id=(select auth.uid())));

grant update on public.contact_form_submissions to authenticated;
