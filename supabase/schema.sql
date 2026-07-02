-- Rental Scout: paste this entire file into the Supabase SQL editor and run it.
create extension if not exists pgcrypto;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  nickname text not null,
  full_address text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  listing_url text not null default '',
  asking_price numeric(14,2) not null default 0 check (asking_price >= 0),
  bedrooms numeric(5,1) not null default 0 check (bedrooms >= 0),
  bathrooms numeric(5,1) not null default 0 check (bathrooms >= 0),
  square_footage integer not null default 0 check (square_footage >= 0),
  year_built integer not null default 0 check (year_built >= 0),
  property_type text not null default 'Single family',
  condition_category text not null default 'Move-in ready'
    check (condition_category in ('Move-in ready', 'Light rehab', 'Medium rehab', 'Heavy rehab')),
  estimated_rehab_cost numeric(14,2) not null default 0 check (estimated_rehab_cost >= 0),

  estimated_monthly_rent numeric(14,2) not null default 0 check (estimated_monthly_rent >= 0),
  after_rehab_rent numeric(14,2) not null default 0 check (after_rehab_rent >= 0),
  average_area_rent numeric(14,2) not null default 0 check (average_area_rent >= 0),
  rent_source_notes text not null default '',
  monthly_taxes numeric(14,2) not null default 0 check (monthly_taxes >= 0),
  monthly_insurance numeric(14,2) not null default 0 check (monthly_insurance >= 0),
  monthly_hoa numeric(14,2) not null default 0 check (monthly_hoa >= 0),

  property_management_pct numeric(7,3) not null default 10 check (property_management_pct between 0 and 100),
  down_payment_pct numeric(7,3) not null default 20 check (down_payment_pct between 0 and 100),
  heloc_interest_rate numeric(7,3) not null default 10.5 check (heloc_interest_rate between 0 and 100),
  investment_interest_rate numeric(7,3) not null default 7.5 check (investment_interest_rate between 0 and 100),
  loan_term_years integer not null default 30 check (loan_term_years > 0),
  heloc_balance_override numeric(14,2) check (heloc_balance_override is null or heloc_balance_override >= 0),

  notes text not null default '',
  pros text not null default '',
  cons text not null default '',
  why_liked text not null default '',
  deal_status text not null default 'Watching'
    check (deal_status in ('Watching', 'Strong deal', 'Maybe', 'Pass', 'Scheduled visit', 'Visited', 'Offer made')),
  personal_interest_score integer not null default 5 check (personal_interest_score between 1 and 10),
  neighborhood_score integer not null default 5 check (neighborhood_score between 1 and 10),
  school_safety_score integer not null default 5 check (school_safety_score between 1 and 10),
  rehab_risk_score integer not null default 5 check (rehab_risk_score between 1 and 10),

  add_to_visit_list boolean not null default false,
  visit_date date,
  realtor_notes text not null default '',
  post_visit_decision text not null default '',
  verification_checklist jsonb not null default '[]'::jsonb
    check (jsonb_typeof(verification_checklist) = 'array'),
  status_history jsonb not null default '[]'::jsonb
    check (jsonb_typeof(status_history) = 'array'),

  down_payment_amount numeric(14,2) not null default 0,
  investment_loan_amount numeric(14,2) not null default 0,
  monthly_mortgage_payment numeric(14,2) not null default 0,
  heloc_balance numeric(14,2) not null default 0,
  heloc_required_payment numeric(14,2) not null default 0,
  heloc_interest_portion numeric(14,2) not null default 0,
  heloc_principal_portion numeric(14,2) not null default 0,
  heloc_remaining_balance numeric(14,2) not null default 0,
  property_management_fee numeric(14,2) not null default 0,
  total_monthly_outflow numeric(14,2) not null default 0,
  monthly_cash_flow numeric(14,2) not null default 0,
  rent_to_price_ratio numeric(12,8) not null default 0,
  total_project_cost numeric(14,2) not null default 0,
  after_rehab_cash_flow numeric(14,2) not null default 0,
  deal_rating text not null default 'red' check (deal_rating in ('green', 'yellow', 'red')),
  deal_score integer not null default 0 check (deal_score between 0 and 100)
);

create index if not exists properties_user_id_idx on public.properties(user_id);
create index if not exists properties_user_updated_idx on public.properties(user_id, updated_at desc);
create index if not exists properties_user_score_idx on public.properties(user_id, deal_score desc);
create index if not exists properties_user_visit_idx on public.properties(user_id, add_to_visit_list);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

alter table public.properties enable row level security;
alter table public.properties force row level security;

drop policy if exists "Users can read own properties" on public.properties;
create policy "Users can read own properties"
on public.properties for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own properties" on public.properties;
create policy "Users can insert own properties"
on public.properties for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own properties" on public.properties;
create policy "Users can update own properties"
on public.properties for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own properties" on public.properties;
create policy "Users can delete own properties"
on public.properties for delete
to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
revoke all on public.properties from anon;
