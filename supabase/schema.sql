-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Businesses (Support multi-business)
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  currency text default 'USD',
  owner_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default now()
);

-- 2. Profiles (User details)
create table profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- 3. Business Members (Roles)
create table business_members (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  role text check (role in ('OWNER', 'ADMIN', 'STAFF', 'VIEWER')) not null default 'STAFF',
  unique(business_id, user_id)
);

-- 4. Parties (Customers & Suppliers)
create table parties (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  address text,
  gstin text,
  type text check (type in ('CUSTOMER', 'SUPPLIER', 'BOTH')) not null default 'CUSTOMER',
  opening_balance numeric default 0, -- Positive = To Receive, Negative = To Pay
  credit_limit numeric,
  created_at timestamp with time zone default now()
);

-- 5. Items (Inventory)
create table items (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  sku text,
  type text check (type in ('PRODUCT', 'SERVICE')) not null default 'PRODUCT',
  purchase_price numeric default 0,
  selling_price numeric default 0,
  tax_rate numeric default 0,
  stock_quantity numeric default 0,
  min_stock numeric default 0,
  unit text default 'PCS',
  created_at timestamp with time zone default now()
);

-- 6. Invoices (Sales & Purchases)
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  party_id uuid references parties(id),
  invoice_number text not null,
  type text check (type in ('SALE', 'PURCHASE', 'SALE_RETURN', 'PURCHASE_RETURN')) not null,
  date date default CURRENT_DATE,
  due_date date,
  total_amount numeric not null default 0,
  balance_amount numeric not null default 0, -- Track unpaid
  status text check (status in ('PAID', 'PARTIAL', 'UNPAID', 'CANCELLED')) default 'UNPAID',
  notes text,
  created_at timestamp with time zone default now()
);

-- 7. Invoice Items
create table invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade not null,
  item_id uuid references items(id),
  description text,
  quantity numeric not null default 1,
  rate numeric not null default 0,
  tax_amount numeric default 0,
  total numeric not null default 0
);

-- 8. Transactions (Payments)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  party_id uuid references parties(id),
  invoice_id uuid references invoices(id),
  amount numeric not null,
  type text check (type in ('RECEIPT', 'PAYMENT')) not null, -- Receipt (In), Payment (Out)
  mode text default 'CASH', -- Cash, Bank, Online
  date date default CURRENT_DATE,
  description text,
  created_at timestamp with time zone default now()
);

-- RLS Helpers
alter table businesses enable row level security;
alter table parties enable row level security;
alter table items enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table transactions enable row level security;

-- Simple "Member Access" Policy
create or replace function is_business_member(_business_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from business_members
    where business_id = _business_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Apply Policy to Parties
create policy "Members can view parties" on parties for select using (is_business_member(business_id));
create policy "Members can insert parties" on parties for insert with check (is_business_member(business_id));
create policy "Members can update parties" on parties for update using (is_business_member(business_id));

create policy "Members can view items" on items for select using (is_business_member(business_id));
create policy "Members can insert items" on items for insert with check (is_business_member(business_id));
create policy "Members can update items" on items for update using (is_business_member(business_id));

create policy "Members can view invoices" on invoices for select using (is_business_member(business_id));
create policy "Members can insert invoices" on invoices for insert with check (is_business_member(business_id));
create policy "Members can update invoices" on invoices for update using (is_business_member(business_id));

create policy "Members can view transactions" on transactions for select using (is_business_member(business_id));
create policy "Members can insert transactions" on transactions for insert with check (is_business_member(business_id));

-- Triggers for User Profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
