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
