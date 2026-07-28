-- tiendas instaladas via OAuth de Tiendanube
create table stores (
  id bigint primary key,
  access_token text not null,
  store_url text,
  plan text not null default 'trial',
  trial_started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- configuración de widgets por tienda
create table widget_configs (
  id uuid primary key default gen_random_uuid(),
  store_id bigint not null references stores(id) on delete cascade,
  widget_type text not null default 'announcement-bar',
  config jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index widget_configs_store_id_idx on widget_configs(store_id);

-- actualiza updated_at automáticamente en cada update
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger widget_configs_updated_at
  before update on widget_configs
  for each row execute function update_updated_at();
