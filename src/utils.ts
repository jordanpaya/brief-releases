import { SetEntry, Session, Unit } from './types';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateShort(iso: string): string {
  // iso = YYYY-MM-DD
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}`;
}

export function relativeDay(iso: string): string {
  const today = todayISO();
  if (iso === today) return 'Today';
  const a = new Date(iso + 'T00:00:00');
  const b = new Date(today + 'T00:00:00');
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff >= 7 && diff < 14) return 'Last week';
  return formatDateShort(iso);
}

// Epley estimated one-rep max. Capped reps so silly inputs don't explode.
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  const r = Math.min(reps, 20);
  if (r === 1) return weight;
  return weight * (1 + r / 30);
}

// The smallest plate jump that's realistic for the unit.
export function weightStep(unit: Unit, weight: number): number {
  if (unit === 'kg') return 2.5;
  return weight >= 100 ? 5 : 2.5;
}

export function round(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export function formatWeight(n: number): string {
  // Trim trailing .0 but keep .5
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Compare a set against the matching set from last time. This is the core of
// the app: are you progressively overloading vs last week?
export type Dir = 'up' | 'down' | 'same' | 'new';

export function compareSet(
  cur: { weight: number; reps: number },
  prev?: { weight: number; reps: number },
): { dir: Dir; short: string } {
  if (!prev) return { dir: 'new', short: '–' };
  const wd = cur.weight - prev.weight;
  if (Math.abs(wd) >= 0.01) {
    return { dir: wd > 0 ? 'up' : 'down', short: `${wd > 0 ? '↑' : '↓'}${formatWeight(Math.abs(wd))}` };
  }
  const rd = cur.reps - prev.reps;
  if (rd !== 0) return { dir: rd > 0 ? 'up' : 'down', short: `${rd > 0 ? '↑' : '↓'}${Math.abs(rd)}r` };
  return { dir: 'same', short: '=' };
}

// The sets from the most recent day strictly before `excludeDate`, in order.
// This is the "Previous" reference column — what you did last time.
export function getPreviousSession(sets: SetEntry[], excludeDate: string): SetEntry[] {
  const dates = Array.from(new Set(sets.map((s) => s.date))).filter((d) => d < excludeDate).sort();
  if (dates.length === 0) return [];
  const target = dates[dates.length - 1];
  return sets.filter((s) => s.date === target).sort((a, b) => a.createdAt - b.createdAt);
}

// Group an exercise's sets into per-day sessions, sorted oldest -> newest.
export function buildSessions(sets: SetEntry[]): Session[] {
  const byDate = new Map<string, SetEntry[]>();
  for (const s of sets) {
    const arr = byDate.get(s.date);
    if (arr) arr.push(s);
    else byDate.set(s.date, [s]);
  }
  const sessions: Session[] = [];
  for (const [date, daySets] of byDate) {
    let topSet = daySets[0];
    let best1RM = estimate1RM(topSet.weight, topSet.reps);
    let bestWeight = topSet.weight;
    let totalVolume = 0;
    for (const s of daySets) {
      const e = estimate1RM(s.weight, s.reps);
      if (e > best1RM) {
        best1RM = e;
        topSet = s;
      }
      if (s.weight > bestWeight) bestWeight = s.weight;
      totalVolume += s.weight * s.reps;
    }
    sessions.push({ date, sets: daySets, topSet, best1RM, bestWeight, totalVolume });
  }
  sessions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return sessions;
}
