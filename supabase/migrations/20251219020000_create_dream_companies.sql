-- Create Dream Companies Table
create table if not exists public.dream_companies (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    company_name text not null,
    industry text,
    company_size text check (company_size in ('Startup', 'SMB', 'Enterprise')),
    locations text[],
    website_url text,
    careers_page_url text,
    linkedin_company_url text,
    priority text check (priority in ('High', 'Medium', 'Low')) default 'Medium',
    target_roles text[],
    notes text,
    tags text[],
    status text check (status in ('Not Contacted', 'Researching', 'Networking', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'On Hold')) default 'Not Contacted',
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint dream_companies_pkey primary key (id)
);

-- Note: The user mentioned an "old dream companies table" might exist remotely.
-- This script assumes "dream_companies" is the correct name and creates it if missing.

-- Row Level Security for dream_companies
alter table public.dream_companies enable row level security;

create policy "Users can view their own dream companies"
    on public.dream_companies for select
    using (auth.uid() = user_id);

create policy "Users can insert their own dream companies"
    on public.dream_companies for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own dream companies"
    on public.dream_companies for update
    using (auth.uid() = user_id);

create policy "Users can delete their own dream companies"
    on public.dream_companies for delete
    using (auth.uid() = user_id);

-- Update Contacts Table to link to Dream Companies
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'contacts' and column_name = 'dream_company_id') then
        alter table public.contacts
        add column dream_company_id uuid references public.dream_companies(id) on delete set null;
    end if;
end $$;

-- Create Reminders Table
create table if not exists public.dream_company_reminders (
    id uuid not null default gen_random_uuid(),
    dream_company_id uuid not null references public.dream_companies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    due_date timestamp with time zone not null,
    frequency text check (frequency in ('Once', 'Weekly', 'Monthly')) default 'Once',
    note text,
    completed boolean default false,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint dream_company_reminders_pkey primary key (id)
);

-- Row Level Security for reminders
alter table public.dream_company_reminders enable row level security;

create policy "Users can manage their own reminders"
    on public.dream_company_reminders for all
    using (auth.uid() = user_id);

-- Add updated_at trigger for dream_companies
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_dream_companies_updated_at
    before update on public.dream_companies
    for each row
    execute function update_updated_at_column();
