import type { RealtimeChannel } from '@supabase/supabase-js';
import { currentUser, supabase } from '../backend/supabase';
import type { Json, Net, NetMessage, NetPeer } from './Net';

/**
 * Public online rooms over Supabase Realtime (for the stand-alone web / portal builds, where
 * the claude.ai room is not available). One channel per room code (`?room=ABCD`); share the
 * page URL to invite friends.
 *
 * Same semantics as the other transports: presence = "my current state", emit = a moment to
 * everyone including me. Realtime presence is meant for low-rate state, so fields that change
 * every frame (`s`, `b`, `ep`: the machine state) travel as a throttled broadcast instead and are
 * merged back into that peer's presence object here — the session never sees the difference.
 */
const FAST_KEYS = new Set(['s', 'b', 'ep']);

export class SupabaseNet implements Net {
  readonly kind = 'online' as const;
  private readonly id = 'p-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  private readonly channel: RealtimeChannel;
  private slow: Record<string, Json> = {};
  private fast: Record<string, Json> = {};
  private readonly others = new Map<string, { slow: Record<string, Json>; fast: Record<string, Json> }>();
  private readonly handlers = new Map<string, ((m: NetMessage) => void)[]>();
  private readonly peerFns: ((p: readonly NetPeer[]) => void)[] = [];
  private snapshot: readonly NetPeer[] = [];
  private live = false;
  private slowDirty = false;
  private fastDirty = false;
  private uid: string | null = null;

  private constructor(
    readonly room: string,
    nickname: string,
  ) {
    const sb = supabase()!;
    this.slow = { nk: nickname };
    this.channel = sb.channel(`arena:${room}`, { config: { presence: { key: this.id }, broadcast: { self: true, ack: false } } });
    this.channel
      .on('presence', { event: 'sync' }, () => this.syncPresence())
      .on('broadcast', { event: 'msg' }, ({ payload }) => {
        const m = payload as { topic?: string; from?: string; data?: Json };
        if (typeof m?.topic !== 'string' || typeof m.from !== 'string') return;
        for (const fn of this.handlers.get(m.topic) ?? []) fn({ from: m.from, isMe: m.from === this.id, data: m.data });
      })
      .on('broadcast', { event: 'st' }, ({ payload }) => {
        const m = payload as { from?: string; st?: Record<string, Json> };
        if (typeof m?.from !== 'string' || m.from === this.id || !m.st || typeof m.st !== 'object') return;
        const o = this.others.get(m.from) ?? { slow: {}, fast: {} };
        o.fast = { ...o.fast, ...m.st };
        this.others.set(m.from, o);
        this.refresh();
      })
      .subscribe((status) => {
        this.live = status === 'SUBSCRIBED';
        if (this.live) this.slowDirty = true;
      });
    setInterval(() => this.pump(), 66); // ~15 Hz state, presence changes debounced into the same tick
    this.refresh();
  }

  /** Join (or create) room `code`; null when no backend is configured. */
  static async connect(code: string, nickname: string): Promise<SupabaseNet | null> {
    if (!supabase()) return null;
    const user = await currentUser(nickname);
    const net = new SupabaseNet(code, nickname);
    net.uid = user?.id ?? null;
    net.slow.uid = net.uid;
    return net;
  }

  selfId(): string {
    return this.id;
  }
  peers(): readonly NetPeer[] {
    return this.snapshot;
  }
  onPeers(fn: (p: readonly NetPeer[]) => void): void {
    this.peerFns.push(fn);
    queueMicrotask(() => fn(this.snapshot));
  }
  setPresence(patch: Record<string, Json | null>): void {
    for (const [k, v] of Object.entries(patch)) {
      const bag = FAST_KEYS.has(k) ? this.fast : this.slow;
      if (v === null) delete bag[k];
      else bag[k] = v;
      if (FAST_KEYS.has(k)) this.fastDirty = true;
      else this.slowDirty = true;
    }
    this.refresh();
  }
  emit(topic: string, data: Json): void {
    if (!this.live) return; // like the room: dropped while disconnected, no echo
    void this.channel.send({ type: 'broadcast', event: 'msg', payload: { topic, from: this.id, data } });
  }
  on(topic: string, fn: (m: NetMessage) => void): void {
    const list = this.handlers.get(topic) ?? [];
    list.push(fn);
    this.handlers.set(topic, list);
  }
  connected(): boolean {
    return this.live;
  }
  nameOf(peer: NetPeer): string {
    return (typeof peer.presence.nk === 'string' && peer.presence.nk) || 'Player';
  }

  private pump(): void {
    if (!this.live) return;
    if (this.slowDirty) {
      this.slowDirty = false;
      void this.channel.track({ ...this.slow });
    }
    if (this.fastDirty) {
      this.fastDirty = false;
      void this.channel.send({ type: 'broadcast', event: 'st', payload: { from: this.id, st: this.fast } });
    }
  }

  private syncPresence(): void {
    const state = this.channel.presenceState() as Record<string, Record<string, Json>[]>;
    const seen = new Set<string>();
    for (const [key, metas] of Object.entries(state)) {
      if (key === this.id) continue;
      seen.add(key);
      const meta = { ...(metas[metas.length - 1] ?? {}) };
      delete meta.presence_ref;
      const o = this.others.get(key) ?? { slow: {}, fast: {} };
      o.slow = meta;
      this.others.set(key, o);
    }
    for (const id of [...this.others.keys()]) if (!seen.has(id)) this.others.delete(id);
    this.refresh();
  }

  private refresh(): void {
    const me: NetPeer = { id: this.id, isMe: true, by: this.uid, guest: false, presence: { ...this.slow, ...this.fast } };
    const list: NetPeer[] = [me];
    for (const [id, o] of this.others) list.push({ id, isMe: false, by: typeof o.slow.uid === 'string' ? o.slow.uid : null, guest: false, presence: { ...o.slow, ...o.fast } });
    list.sort((a, b) => (a.id < b.id ? -1 : 1));
    this.snapshot = Object.freeze(list);
    for (const fn of this.peerFns) fn(this.snapshot);
  }
}
