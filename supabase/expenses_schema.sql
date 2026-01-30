-- ==========================================
-- EXPENSES MODULE SCHEMA
-- ==========================================

-- Expense Categories (User-defined)
create table if not exists expense_categories (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  type text check (type in ('IN', 'OUT', 'BOTH')) not null default 'OUT',
  icon text default 'circle',
  color text default '#6b7280',
  created_at timestamp with time zone default now(),
  unique(business_id, name)
);

-- Expenses (In/Out records)
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  category_id uuid references expense_categories(id) on delete set null,
  amount numeric not null,
  type text check (type in ('IN', 'OUT')) not null,
  date date default CURRENT_DATE,
  description text,
  notes text,
  attachments jsonb default '[]',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table expense_categories enable row level security;
alter table expenses enable row level security;

-- Policies for expense_categories
create policy "Members can view expense categories" on expense_categories 
  for select using (is_business_member(business_id));
create policy "Members can insert expense categories" on expense_categories 
  for insert with check (is_business_member(business_id));
create policy "Members can update expense categories" on expense_categories 
  for update using (is_business_member(business_id));
create policy "Members can delete expense categories" on expense_categories 
  for delete using (is_business_member(business_id));

-- Policies for expenses
create policy "Members can view expenses" on expenses 
  for select using (is_business_member(business_id));
create policy "Members can insert expenses" on expenses 
  for insert with check (is_business_member(business_id));
create policy "Members can update expenses" on expenses 
  for update using (is_business_member(business_id));
create policy "Members can delete expenses" on expenses 
  for delete using (is_business_member(business_id));

-- Indexes for performance
create index if not exists idx_expenses_business_id on expenses(business_id);
create index if not exists idx_expenses_category_id on expenses(category_id);
create index if not exists idx_expenses_date on expenses(date);
create index if not exists idx_expense_categories_business_id on expense_categories(business_id);

-- Default categories (optional - run after creating tables)
-- INSERT INTO expense_categories (business_id, name, type, icon, color) VALUES
--   ('YOUR_BUSINESS_ID', 'Salary', 'OUT', 'wallet', '#ef4444'),
--   ('YOUR_BUSINESS_ID', 'Rent', 'OUT', 'home', '#f97316'),
--   ('YOUR_BUSINESS_ID', 'Utilities', 'OUT', 'zap', '#eab308'),
--   ('YOUR_BUSINESS_ID', 'Transport', 'OUT', 'car', '#22c55e'),
--   ('YOUR_BUSINESS_ID', 'Other Income', 'IN', 'plus-circle', '#3b82f6');
