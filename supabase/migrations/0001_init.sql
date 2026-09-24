-- GROW EVERYTHING — player, match, telemetry and commerce schema (Supabase / Postgres).
-- Players authenticate anonymously on first visit (supabase.auth.signInAnonymously) and can
-- later link an email / Google / Discord identity without losing progress (same auth.uid()).
-- Clients write only their own rows; match results and purchases come from trusted server
-- code (service role: an Edge Function or the payment webhook), never from the browser.

create extension if not exists pgcrypto;

-- ── Players ──────────────────────────────────────────────────────────────────
create table public.players (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default 'Player' check (char_length(display_name) between 1 and 24),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  platform      text not null default 'web',          -- web | crazygames | poki | steam | tiktok
  country       text,                                  -- ISO-3166 alpha-2 from the edge, not the client
  coins         integer not null default 0 check (coins >= 0),
  unlocked_level smallint not null default 1,
  cosmetics     jsonb not null default '{}'::jsonb,    -- owned skins/horns/eyes: { "skins": ["neon"], ... }
  equipped      jsonb not null default '{}'::jsonb
);

-- ── Sessions (one per page load) ─────────────────────────────────────────────
create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.players (id) on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  platform    text not null default 'web',
  device      text,                                    -- desktop | phone | tablet
  build       text,                                    -- game build id
  referrer    text,
  utm         jsonb not null default '{}'::jsonb       -- utm_source / campaign (TikTok, YouTube Shorts…)
);
create index on public.sessions (player_id, started_at desc);

-- ── Matches ──────────────────────────────────────────────────────────────────
create table public.matches (
  id            uuid primary key default gen_random_uuid(),
  room          text not null,
  city          text not null,
  started_at    timestamptz not null,
  ended_at      timestamptz,
  duration_s    real,
  end_reason    text,                                  -- time | last_standing | landmark | humans_out
  humans        smallint not null,
  bots          smallint not null,
  build         text
);
create index on public.matches (city, started_at desc);

create table public.match_players (
  match_id    uuid not null references public.matches (id) on delete cascade,
  slot        smallint not null,
  player_id   uuid references public.players (id) on delete set null,   -- null for AI rivals
  is_bot      boolean not null default false,
  vehicle     text not null,
  rank        smallint not null,
  mass_kg     double precision not null,
  kills       smallint not null default 0,
  deaths      smallint not null default 0,
  objects     integer not null default 0,
  left_early  boolean not null default false,
  primary key (match_id, slot)
);
create index on public.match_players (player_id);

-- ── Telemetry events (funnel, balance, retention) ───────────────────────────
create table public.events (
  id          bigint generated always as identity primary key,
  ts          timestamptz not null default now(),
  player_id   uuid not null references public.players (id) on delete cascade,
  session_id  uuid references public.sessions (id) on delete cascade,
  name        text not null check (char_length(name) <= 48),
  props       jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 4096)
);
create index on public.events (name, ts desc);
create index on public.events (player_id, ts desc);

-- ── Commerce ─────────────────────────────────────────────────────────────────
create table public.products (
  sku         text primary key,                        -- e.g. skin_neon, horn_trombone, pass_s1
  kind        text not null,                           -- skin | horn | eyes | emote_pack | pass | coins
  title_zh    text not null,
  title_en    text not null,
  price_cents integer not null check (price_cents >= 0),
  currency    text not null default 'USD',
  active      boolean not null default true
);

create table public.purchases (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references public.players (id) on delete cascade,
  sku           text not null references public.products (sku),
  amount_cents  integer not null,
  currency      text not null,
  provider      text not null,                         -- stripe | xsolla | steam | tiktok
  provider_ref  text not null,
  status        text not null default 'pending',       -- pending | paid | refunded
  created_at    timestamptz not null default now(),
  unique (provider, provider_ref)
);
create index on public.purchases (player_id, created_at desc);

-- ── Leaderboard: best mass per city this week ────────────────────────────────
create view public.weekly_leaderboard with (security_invoker = true) as
select m.city, p.display_name, max(mp.mass_kg) as best_mass_kg, count(*) as matches, sum(mp.kills) as kills
from public.match_players mp
join public.matches m on m.id = mp.match_id
join public.players p on p.id = mp.player_id
where not mp.is_bot and m.started_at > now() - interval '7 days'
group by m.city, p.display_name;

-- ── Row level security ───────────────────────────────────────────────────────
alter table public.players       enable row level security;
alter table public.sessions      enable row level security;
alter table public.matches       enable row level security;
alter table public.match_players enable row level security;
alter table public.events        enable row level security;
alter table public.products      enable row level security;
alter table public.purchases     enable row level security;

-- Players: read everyone's public name (leaderboards); create/update only yourself.
-- Coins, unlocks and cosmetics are granted by server code, so the client may only change its name.
create policy players_read   on public.players for select using (true);
create policy players_insert on public.players for insert with check (id = auth.uid() and coins = 0 and cosmetics = '{}'::jsonb);
create policy players_update on public.players for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.players from anon, authenticated;
grant update (display_name, last_seen_at, equipped) on public.players to authenticated;

create policy sessions_own on public.sessions for all using (player_id = auth.uid()) with check (player_id = auth.uid());
create policy events_insert on public.events for insert with check (player_id = auth.uid());
-- Matches are written by the server; anyone may read them (history pages, leaderboards).
create policy matches_read       on public.matches       for select using (true);
create policy match_players_read on public.match_players for select using (true);
create policy products_read  on public.products  for select using (active);
create policy purchases_own  on public.purchases for select using (player_id = auth.uid());

-- Server-only helper used by the submit-match function (service role).
create or replace function public.grant_coins(p_player uuid, p_coins integer) returns void
language sql security definer set search_path = public as $$
  update public.players set coins = coins + greatest(0, p_coins) where id = p_player;
$$;
revoke execute on function public.grant_coins(uuid, integer) from public, anon, authenticated;
