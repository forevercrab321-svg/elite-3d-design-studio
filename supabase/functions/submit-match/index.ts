// Supabase Edge Function: the match host posts the final standings; the server records the
// match and grants coins. Runs with the service role, so the browser never writes results or
// currency directly. Deploy: `supabase functions deploy submit-match`.
import { createClient } from 'npm:@supabase/supabase-js@2';

const COINS_BY_RANK = [100, 60, 35, 20];
const COINS_PER_KILL = 15;
const CITIES = new Set(['shanghai', 'newyork', 'paris', 'scrap']);

interface Row {
  slot: number;
  playerId: string | null; // auth uid, null for AI
  vehicle: string;
  rank: number;
  mass: number;
  kills: number;
  deaths: number;
  objects: number;
  leftEarly?: boolean;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method', { status: 405 });
  const auth = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: who } = await asCaller.auth.getUser();
  if (!who.user) return new Response('unauthenticated', { status: 401 });

  const body = (await req.json().catch(() => null)) as { room?: string; city?: string; startedAt?: string; durationS?: number; endReason?: string; build?: string; rows?: Row[] } | null;
  const rows = Array.isArray(body?.rows) ? body!.rows.slice(0, 4) : [];
  if (!body || !CITIES.has(String(body.city)) || !rows.length) return new Response('bad request', { status: 400 });
  // The caller must be one of the human players in the match it reports.
  if (!rows.some((r) => r.playerId === who.user!.id)) return new Response('not in match', { status: 403 });
  const dur = Math.max(0, Math.min(900, Number(body.durationS) || 0));

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: match, error } = await admin
    .from('matches')
    .insert({ room: String(body.room ?? '').slice(0, 64), city: body.city, started_at: body.startedAt ?? new Date(Date.now() - dur * 1000).toISOString(), ended_at: new Date().toISOString(), duration_s: dur, end_reason: String(body.endReason ?? '').slice(0, 24), humans: rows.filter((r) => r.playerId).length, bots: rows.filter((r) => !r.playerId).length, build: String(body.build ?? '').slice(0, 32) })
    .select('id')
    .single();
  if (error || !match) return new Response('db', { status: 500 });

  await admin.from('match_players').insert(
    rows.map((r) => ({ match_id: match.id, slot: r.slot, player_id: r.playerId, is_bot: !r.playerId, vehicle: String(r.vehicle).slice(0, 16), rank: r.rank, mass_kg: Math.max(0, Number(r.mass) || 0), kills: Math.max(0, r.kills | 0), deaths: Math.max(0, r.deaths | 0), objects: Math.max(0, r.objects | 0), left_early: !!r.leftEarly })),
  );
  // Coins for human players (server-side so they cannot be forged by a client).
  for (const r of rows) {
    if (!r.playerId) continue;
    const coins = (COINS_BY_RANK[r.rank - 1] ?? 10) + Math.min(20, r.kills | 0) * COINS_PER_KILL;
    await admin.rpc('grant_coins', { p_player: r.playerId, p_coins: coins });
  }
  return Response.json({ matchId: match.id });
});
