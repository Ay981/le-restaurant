create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_type') then
    create type public.order_type as enum ('dine_in', 'to_go', 'delivery');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'pending',
      'preparing',
      'served',
      'completed',
      'cancelled'
    );
  end if;
end$$;

create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  category_id bigint references public.categories(id) on delete set null,
  title text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  availability_count integer not null default 0 check (availability_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dishes_title_key'
      and conrelid = 'public.dishes'::regclass
  ) then
    alter table public.dishes
    add constraint dishes_title_key unique (title);
  end if;
end$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  order_type public.order_type not null default 'dine_in',
  status public.order_status not null default 'pending',
  note text,
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  total numeric(10, 2) generated always as (greatest(subtotal - discount, 0)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete restrict,
  dish_title_snapshot text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) generated always as (unit_price * quantity) stored,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_dishes_category_id on public.dishes(category_id);
create index if not exists idx_dishes_is_active on public.dishes(is_active);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dishes_set_updated_at on public.dishes;
create trigger trg_dishes_set_updated_at
before update on public.dishes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_orders_set_updated_at on public.orders;
create trigger trg_orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.dishes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists categories_read_all on public.categories;
create policy categories_read_all
on public.categories
for select
to anon, authenticated
using (true);

drop policy if exists dishes_read_all on public.dishes;
create policy dishes_read_all
on public.dishes
for select
to anon, authenticated
using (true);

drop policy if exists orders_authenticated_all on public.orders;
create policy orders_authenticated_all
on public.orders
for all
to authenticated
using (true)
with check (true);

drop policy if exists order_items_authenticated_all on public.order_items;
create policy order_items_authenticated_all
on public.order_items
for all
to authenticated
using (true)
with check (true);

insert into public.categories (name, sort_order)
values
  ('Hot Dishes', 1),
  ('Cold Dishes', 2),
  ('Soup', 3),
  ('Grill', 4),
  ('Appetizer', 5),
  ('Dessert', 6)
on conflict (name) do update
set sort_order = excluded.sort_order;

insert into public.dishes (
  category_id,
  title,
  price,
  image_url,
  availability_count,
  is_active
)
select
  c.id,
  seed.title,
  seed.price,
  seed.image_url,
  seed.availability_count,
  true
from (
  values
    ('Hot Dishes', 'Spicy seasoned seafood noodles', 2.29::numeric, '/image/pizza.png', 20),
    ('Cold Dishes', 'Salted Pasta with mushroom sauce', 2.69::numeric, '/image/pizza.png', 11),
    ('Soup', 'Beef dumpling in hot and sour soup', 2.99::numeric, '/image/pizza.png', 16),
    ('Hot Dishes', 'Healthy noodle with spinach leaf', 3.29::numeric, '/image/pizza.png', 22),
    ('Hot Dishes', 'Hot spicy fried rice with omelette', 3.49::numeric, '/image/pizza.png', 13),
    ('Hot Dishes', 'Spicy instant noodle with special omelette', 3.59::numeric, '/image/pizza.png', 17)
) as seed(category_name, title, price, image_url, availability_count)
join public.categories c
  on c.name = seed.category_name
on conflict (title) do update
set
  category_id = excluded.category_id,
  price = excluded.price,
  image_url = excluded.image_url,
  availability_count = excluded.availability_count,
  is_active = true,
  updated_at = now();
