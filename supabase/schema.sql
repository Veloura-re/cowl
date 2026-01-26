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
  username text unique,
  email text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- 3. Business Members (Roles)
create table business_members (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  role text check (role in ('OWNER', 'ADMIN', 'PARTNER', 'STAFF', 'VIEWER')) not null default 'STAFF',
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
  category text,
  description text,
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
  discount_amount numeric default 0,
  tax_amount numeric default 0,
  attachments jsonb default '[]',
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
alter table business_members enable row level security;
alter table parties enable row level security;
alter table items enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table transactions enable row level security;
alter table payment_modes enable row level security;

-- Business Policies
-- Using security definer function to avoid recursion
create policy "Owners can view their businesses" on businesses for select using (auth.uid() = owner_id or is_business_member(id));
create policy "Owners can insert businesses" on businesses for insert with check (auth.uid() = owner_id);
create policy "Owners can update their businesses" on businesses for update using (auth.uid() = owner_id);

-- Business Member Policies
create policy "Members can view membership" on business_members for select using (user_id = auth.uid() or is_business_member(business_id));
create policy "Owners can manage members" on business_members for all using (exists (select 1 from businesses where id = business_id and owner_id = auth.uid()));

-- Simple "Member Access" Policy Helper
-- SECURITY DEFINER is key here to avoid recursion by bypassing RLS during the check
create or replace function is_business_member(_business_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.business_members
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
create policy "Members can update transactions" on transactions for update using (is_business_member(business_id));
create policy "Members can delete transactions" on transactions for delete using (is_business_member(business_id));

create policy "Members can view payment modes" on payment_modes for select using (is_business_member(business_id));
create policy "Members can manage payment modes" on payment_modes for all using (is_business_member(business_id));

create policy "Members can view invoice items" on invoice_items for select using (exists (select 1 from invoices where id = invoice_id and is_business_member(business_id)));
create policy "Members can insert invoice items" on invoice_items for insert with check (exists (select 1 from invoices where id = invoice_id and is_business_member(business_id)));
create policy "Members can update invoice items" on invoice_items for update using (exists (select 1 from invoices where id = invoice_id and is_business_member(business_id)));
create policy "Members can delete invoice items" on invoice_items for delete using (exists (select 1 from invoices where id = invoice_id and is_business_member(business_id)));

-- 10. Notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text check (type in ('SALE', 'PURCHASE', 'STOCK', 'TEAM', 'SYSTEM')) not null,
  link text,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- 11. Notification Settings
create table notification_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  business_id uuid references businesses(id) on delete cascade not null,
  notify_sales boolean default true,
  notify_purchases boolean default true,
  notify_stock boolean default true,
  notify_team boolean default true,
  unique(user_id, business_id)
);

alter table notifications enable row level security;
alter table notification_settings enable row level security;

create policy "Users can view their notifications" on notifications for select using (user_id = auth.uid());
create policy "Users can insert their notifications" on notifications for insert with check (user_id = auth.uid());
create policy "Users can update their notifications" on notifications for update using (user_id = auth.uid());
create policy "Users can delete their notifications" on notifications for delete using (user_id = auth.uid());

create policy "Users can view their notification settings" on notification_settings for select using (user_id = auth.uid());
create policy "Users can manage their notification settings" on notification_settings for all using (user_id = auth.uid());

-- Helper to find who to notify in a business based on settings
create or replace function public.notify_members(_business_id uuid, _type text, _title text, _message text, _link text default null)
returns void as $$
declare
  member_record record;
begin
  for member_record in 
    select bm.user_id from public.business_members bm
    join public.notification_settings ns on ns.user_id = bm.user_id and ns.business_id = bm.business_id
    where bm.business_id = _business_id
    and (
      (_type = 'SALE' and ns.notify_sales) or
      (_type = 'PURCHASE' and ns.notify_purchases) or
      (_type = 'STOCK' and ns.notify_stock) or
      (_type = 'TEAM' and ns.notify_team)
    )
  loop
    insert into notifications (business_id, user_id, title, message, type, link)
    values (_business_id, member_record.user_id, _title, _message, _type, _link);
  end loop;
end;
$$ language plpgsql security definer;

-- Trigger for Sales/Purchases
create or replace function public.handle_new_invoice_notification()
returns trigger as $$
declare
  party_name text;
begin
  select name into party_name from parties where id = new.party_id;
  
  if new.type = 'SALE' then
    perform notify_members(new.business_id, 'SALE', 'New Sale: ' || new.invoice_number, 'A sale of ' || new.total_amount || ' to ' || coalesce(party_name, 'Walking Customer') || ' was recorded.');
  elsif new.type = 'PURCHASE' then
    perform notify_members(new.business_id, 'PURCHASE', 'New Purchase: ' || new.invoice_number, 'A purchase of ' || new.total_amount || ' from ' || coalesce(party_name, 'Supplier') || ' was recorded.');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_invoice_created
  after insert on invoices
  for each row execute procedure public.handle_new_invoice_notification();

-- Trigger for Stock Alerts
create or replace function public.handle_stock_alert()
returns trigger as $$
begin
  if new.stock_quantity <= new.min_stock and old.stock_quantity > new.min_stock then
    perform notify_members(new.business_id, 'STOCK', 'Low Stock: ' || new.name, 'Item ' || new.name || ' is running low on stock (' || new.stock_quantity || ' remaining).');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_stock_updated
  after update on items
  for each row execute procedure public.handle_stock_alert();

-- Logic to auto-create settings for new members
create or replace function public.handle_new_member_settings()
returns trigger as $$
begin
  insert into public.notification_settings (user_id, business_id)
  values (new.user_id, new.business_id)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_member_added_settings
  after insert on business_members
  for each row execute procedure public.handle_new_member_settings();

-- Triggers for User Profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, email, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    lower(split_part(new.email, '@', 1)) || '_' || floor(random() * 1000)::text,
    new.email, 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for Business Members (Auto-add Owner)
create or replace function public.handle_new_business()
returns trigger as $$
begin
  insert into public.business_members (business_id, user_id, role)
  values (new.id, new.owner_id, 'OWNER');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_business_created
  after insert on public.businesses
  for each row execute procedure public.handle_new_business();

-- 9. Payment Modes (Custom Business Modes)
create table payment_modes (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  unique(business_id, name)
);

-- 12. Daily Check Logs (Throttling)
create table daily_check_logs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  check_type text not null,
  last_check_at date default CURRENT_DATE,
  unique(business_id, check_type, last_check_at)
);
