-- First paid catalog (docs/business/paid-catalog.md, batch 1). Cosmetic only, never stats.
-- Prices in USD cents; activate / deactivate with `active` instead of deleting rows.
insert into public.products (sku, kind, title_zh, title_en, price_cents) values
  ('pack_founder',   'pack',  '创始者礼包',   'Founder Pack',          499),
  ('coins_600',      'coins', '600 金币',     '600 Coins',             99),
  ('coins_3500',     'coins', '3500 金币',    '3,500 Coins',           499),
  ('coins_8000',     'coins', '8000 金币',    '8,000 Coins',           999),
  ('pack_shanghai',  'pack',  '上海主题包',   'Shanghai Theme Pack',   199),
  ('pack_newyork',   'pack',  '纽约主题包',   'New York Theme Pack',   199),
  ('pack_paris',     'pack',  '巴黎主题包',   'Paris Theme Pack',      199)
on conflict (sku) do update set title_zh = excluded.title_zh, title_en = excluded.title_en, price_cents = excluded.price_cents;
