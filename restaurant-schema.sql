-- Run once in Supabase SQL Editor. Existing public.pages is untouched.
create extension if not exists pgcrypto;
create table if not exists public.restaurants (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 120),
 tagline text not null default '',
 whatsapp text not null default '',
 address text not null default '',
 logo_url text not null default '',
 cover_url text not null default '',
 template text not null default 'classic' check (template in ('classic','midnight','spice','custom')),
 accent text not null default '#e85d04',
 background text not null default '#fffaf4',
 text_color text not null default '#202020',
 published boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.restaurant_categories (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 80),
 sort_order int not null default 0
);
create table if not exists public.restaurant_items (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 category_id uuid references public.restaurant_categories(id) on delete set null,
 name text not null check (char_length(name) between 1 and 120),
 description text not null default '',
 image_url text not null default '',
 image_path text not null default '',
 mrp numeric(10,2) not null check (mrp >= 0),
 price numeric(10,2) not null check (price >= 0),
 veg boolean not null default true,
 available boolean not null default true,
 sort_order int not null default 0,
 constraint valid_discount check (price <= mrp)
);
create index if not exists restaurants_owner_idx on public.restaurants(user_id);
create index if not exists restaurant_categories_parent_idx on public.restaurant_categories(restaurant_id);
create index if not exists restaurant_items_parent_idx on public.restaurant_items(restaurant_id);

alter table public.restaurants enable row level security;
alter table public.restaurant_categories enable row level security;
alter table public.restaurant_items enable row level security;

-- Public sees only published restaurants and their menu content.
create policy "restaurants public published read" on public.restaurants for select to anon,authenticated using (published or user_id = (select auth.uid()));
create policy "restaurants owner insert" on public.restaurants for insert to authenticated with check (user_id = (select auth.uid()));
create policy "restaurants owner update" on public.restaurants for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "restaurants owner delete" on public.restaurants for delete to authenticated using (user_id = (select auth.uid()));

create policy "categories public or owner read" on public.restaurant_categories for select to anon,authenticated using (exists (select 1 from public.restaurants r where r.id=restaurant_id and (r.published or r.user_id=(select auth.uid()))));
create policy "categories owner insert" on public.restaurant_categories for insert to authenticated with check (exists (select 1 from public.restaurants r where r.id=restaurant_id and r.user_id=(select auth.uid())));
create policy "categories owner update" on public.restaurant_categories for update to authenticated using (exists (select 1 from public.restaurants r where r.id=restaurant_id and r.user_id=(select auth.uid()))) with check (exists (select 1 from public.restaurants r where r.id=restaurant_id and r.user_id=(select auth.uid())));
create policy "categories owner delete" on public.restaurant_categories for delete to authenticated using (exists (select 1 from public.restaurants r where r.id=restaurant_id and r.user_id=(select auth.uid())));

create policy "items public or owner read" on public.restaurant_items for select to anon,authenticated using (exists (select 1 from public.restaurants r where r.id=restaurant_id and (r.published or r.user_id=(select auth.uid()))));
create policy "items owner insert" on public.restaurant_items for insert to authenticated with check (exists (select 1 from public.restaurants r where r.id=restaurant_id and r.user_id=(select auth.uid())) and (category_id is null or exists (select 1 from public.restaurant_categories c where c.id=category_id and c.restaurant_id=restaurant_id)));
create policy "items owner update" on public.restaurant_items for update to authenticated using (exists (select 1 from public.restaurants r where r.id=restaurant_id and r.user_id=(select auth.uid()))) with check (exists (select 1 from public.restaurants r where r.id=restaurant_id and r.user_id=(select auth.uid())) and (category_id is null or exists (select 1 from public.restaurant_categories c where c.id=category_id and c.restaurant_id=restaurant_id)));
create policy "items owner delete" on public.restaurant_items for delete to authenticated using (exists (select 1 from public.restaurants r where r.id=restaurant_id and r.user_id=(select auth.uid())));

-- Dedicated bucket for restaurant food images, public read, owner upload/delete.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('restaurant-images','restaurant-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "restaurant image public read" on storage.objects for select to anon,authenticated using (bucket_id='restaurant-images');
create policy "restaurant image owner insert" on storage.objects for insert to authenticated with check (bucket_id='restaurant-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "restaurant image owner delete" on storage.objects for delete to authenticated using (bucket_id='restaurant-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
