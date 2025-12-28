-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create products table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price decimal(10, 2) not null,
  image_url text,
  status text default 'active' check (status in ('active', 'inactive')),
  stock integer default 0,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create carts table
create table public.carts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Create cart_items table
create table public.cart_items (
  id uuid default uuid_generate_v4() primary key,
  cart_id uuid references public.carts(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(cart_id, product_id)
);

-- Create orders table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  total_amount decimal(10, 2) not null,
  payment_url text,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  order_status text default 'pending' check (order_status in ('pending', 'processing', 'completed', 'cancelled')),
  invoice_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null,
  price decimal(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create contact_messages table
create table public.contact_messages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_messages enable row level security;

-- Policies for products
create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

create policy "Products are insertable by admins only"
  on public.products for insert
  with check (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com'); -- Replace with actual admin check logic

create policy "Products are updatable by admins only"
  on public.products for update
  using (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com');

create policy "Products are deletable by admins only"
  on public.products for delete
  using (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com');

-- Policies for carts
create policy "Users can view their own cart"
  on public.carts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cart"
  on public.carts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cart"
  on public.carts for update
  using (auth.uid() = user_id);

-- Policies for cart_items
create policy "Users can view their own cart items"
  on public.cart_items for select
  using (exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
    and carts.user_id = auth.uid()
  ));

create policy "Users can insert their own cart items"
  on public.cart_items for insert
  with check (exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
    and carts.user_id = auth.uid()
  ));

create policy "Users can update their own cart items"
  on public.cart_items for update
  using (exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
    and carts.user_id = auth.uid()
  ));

create policy "Users can delete their own cart items"
  on public.cart_items for delete
  using (exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
    and carts.user_id = auth.uid()
  ));

-- Policies for orders
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for select
  using (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com');

create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins can update orders"
  on public.orders for update
  using (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com');

-- Policies for order_items
create policy "Users can view their own order items"
  on public.order_items for select
  using (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  ));

create policy "Admins can view all order items"
  on public.order_items for select
  using (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com');

create policy "Users can insert their own order items"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  ));

-- Policies for contact_messages
create policy "Admins can view contact messages"
  on public.contact_messages for select
  using (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com');

create policy "Everyone can insert contact messages"
  on public.contact_messages for insert
  with check (true);

-- Create Storage Buckets
insert into storage.buckets (id, name, public) values ('products', 'products', true);
insert into storage.buckets (id, name, public) values ('invoices', 'invoices', false);

-- Storage Policies
create policy "Public Access to Product Images"
  on storage.objects for select
  using ( bucket_id = 'products' );

create policy "Admins can upload product images"
  on storage.objects for insert
  with check ( bucket_id = 'products' and (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com') );

create policy "Admins can update product images"
  on storage.objects for update
  using ( bucket_id = 'products' and (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com') );

create policy "Admins can delete product images"
  on storage.objects for delete
  using ( bucket_id = 'products' and (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com') );

create policy "Admins can access invoices"
  on storage.objects for select
  using ( bucket_id = 'invoices' and (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com') );

create policy "Users can access their own invoices"
  on storage.objects for select
  using ( bucket_id = 'invoices' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Admins/System can upload invoices"
  on storage.objects for insert
  with check ( bucket_id = 'invoices' and (auth.role() = 'service_role' or auth.email() = 'admin@luxcart.com') );
