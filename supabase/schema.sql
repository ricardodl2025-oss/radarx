create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  canonical_key text unique,
  title text not null,
  brand text,
  model text,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  source text not null,
  external_id text,
  title text not null,
  store text not null,
  seller_name text,
  seller_id text,
  url text not null,
  price numeric(12,2) not null check(price>=0),
  original_price numeric(12,2),
  shipping numeric(12,2),
  shipping_free boolean default false,
  official_store boolean default false,
  condition text,
  in_stock boolean default true,
  raw jsonb,
  captured_at timestamptz not null default now()
);

create index if not exists offers_product_time_idx on offers(product_id,captured_at desc);
create index if not exists offers_source_external_idx on offers(source,external_id);

create table if not exists price_history (
  id bigserial primary key,
  product_id uuid references products(id) on delete cascade,
  offer_id uuid references offers(id) on delete set null,
  source text not null,
  price numeric(12,2) not null,
  shipping numeric(12,2),
  total_price numeric(12,2),
  captured_at timestamptz not null default now()
);
create index if not exists price_history_product_time_idx on price_history(product_id,captured_at desc);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  query text not null,
  email text not null,
  target_price numeric(12,2) not null check(target_price>0),
  active boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  mission text,
  status text not null default 'queued',
  input jsonb,
  output jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists trusted_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text unique not null,
  display_name text not null,
  enabled boolean not null default true,
  official_api boolean not null default false,
  base_url text,
  created_at timestamptz not null default now()
);

insert into trusted_sources(source_key,display_name,enabled,official_api)
values
('mercadolivre','Mercado Livre',true,true),
('magalu','Magazine Luiza',false,false),
('amazon','Amazon Brasil',false,false)
on conflict(source_key) do nothing;

alter table alerts enable row level security;
alter table products enable row level security;
alter table offers enable row level security;
alter table price_history enable row level security;
alter table agent_runs enable row level security;
alter table trusted_sources enable row level security;

-- O frontend não recebe service_role. As gravações passam pelas Netlify Functions.
-- Políticas públicas de leitura podem ser adicionadas depois quando houver autenticação de usuários.
