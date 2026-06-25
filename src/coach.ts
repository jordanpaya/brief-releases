import { SetEntry, Session, Unit } from './types';
import { buildSessions, estimate1RM, formatWeight, round, weightStep } from './utils';

export type SuggestionKind = 'start' | 'progress' | 'hold' | 'deload' | 'pr';

export type Suggestion = {
  kind: SuggestionKind;
  headline: string;
  detail: string;
  target?: { weight: number; reps: number };
};

// Rep target window for double-progression. Hit the top of the range, then add
// weight and reset toward the bottom.
const REP_LOW = 5;
const REP_HIGH = 8;

export function getSuggestion(sets: SetEntry[], unit: Unit): Suggestion {
  const sessions = buildSessions(sets);

  if (sessions.length === 0) {
    return {
      kind: 'start',
      headline: 'Log your first set',
      detail: 'Once you log a couple of sessions, your coach will tell you exactly what to do next.',
    };
  }

  const last = sessions[sessions.length - 1];
  const top = last.topSet;
  const step = weightStep(unit, top.weight);

  if (sessions.length === 1) {
    const target = { weight: top.weight, reps: Math.min(top.reps + 1, REP_HIGH) };
    return {
      kind: 'progress',
      headline: `Next time: ${formatWeight(top.weight)} ${unit} × ${target.reps}`,
      detail: `You opened with ${formatWeight(top.weight)} ${unit} × ${top.reps}. Add one rep next session — that's progressive overload.`,
      target,
    };
  }

  // Has the best estimated-1RM improved over the recent window?
  const window = sessions.slice(-3);
  const stalled = isStalled(window);

  // New all-time best this session?
  const priorBest = Math.max(...sessions.slice(0, -1).map((s) => s.best1RM));
  if (last.best1RM > priorBest * 1.001) {
    const next = nextTarget(top.weight, top.reps, step, unit);
    return {
      kind: 'pr',
      headline: `New best — push to ${describeTarget(next, unit)}`,
      detail: `${formatWeight(top.weight)} ${unit} × ${top.reps} is your strongest set yet on this lift. Keep the train rolling.`,
      target: next,
    };
  }

  if (stalled) {
    const deloadWeight = round(top.weight * 0.9, step);
    return {
      kind: 'deload',
      headline: `Deload to ${formatWeight(deloadWeight)} ${unit} × ${REP_LOW}`,
      detail: `You've been stuck around ${formatWeight(top.weight)} ${unit} for 3 sessions. Drop ~10%, rebuild with clean reps, then break through.`,
      target: { weight: deloadWeight, reps: REP_LOW },
    };
  }

  const next = nextTarget(top.weight, top.reps, step, unit);
  if (next.weight > top.weight) {
    return {
      kind: 'progress',
      headline: `Add weight — ${describeTarget(next, unit)}`,
      detail: `You hit ${top.reps} reps at ${formatWeight(top.weight)} ${unit}. Bump the bar up and start the rep climb again.`,
      target: next,
    };
  }

  return {
    kind: 'progress',
    headline: `One more rep — ${describeTarget(next, unit)}`,
    detail: `Stay at ${formatWeight(top.weight)} ${unit} and chase ${next.reps} reps. When you reach ${REP_HIGH}, you earn more weight.`,
    target: next,
  };
}

function nextTarget(
  weight: number,
  reps: number,
  step: number,
  _unit: Unit,
): { weight: number; reps: number } {
  if (reps >= REP_HIGH) {
    return { weight: weight + step, reps: REP_LOW };
  }
  return { weight, reps: reps + 1 };
}

function describeTarget(t: { weight: number; reps: number }, unit: Unit): string {
  return `${formatWeight(t.weight)} ${unit} × ${t.reps}`;
}

function isStalled(window: Session[]): boolean {
  if (window.length < 3) return false;
  const first = window[0].best1RM;
  // No meaningful improvement across the window.
  for (const s of window) {
    if (s.best1RM > first * 1.01) return false;
  }
  return true;
}

// ---- Progress / growth metrics ---------------------------------------------

export type Growth = {
  sessions: number;
  start1RM: number;
  current1RM: number;
  changePct: number; // can be negative
  prWeight: number;
  prSet: SetEntry | null;
  series: { date: string; value: number }[]; // estimated 1RM over time
};

export function getGrowth(sets: SetEntry[]): Growth {
  const sessions = buildSessions(sets);
  if (sessions.length === 0) {
    return {
      sessions: 0,
      start1RM: 0,
      current1RM: 0,
      changePct: 0,
      prWeight: 0,
      prSet: null,
      series: [],
    };
  }
  const start1RM = sessions[0].best1RM;
  const current1RM = sessions[sessions.length - 1].best1RM;
  const changePct = start1RM > 0 ? ((current1RM - start1RM) / start1RM) * 100 : 0;

  let prSet: SetEntry | null = null;
  let prWeight = 0;
  for (const s of sets) {
    if (s.weight > prWeight) {
      prWeight = s.weight;
      prSet = s;
    }
  }

  return {
    sessions: sessions.length,
    start1RM,
    current1RM,
    changePct,
    prWeight,
    prSet,
    series: sessions.map((s) => ({ date: s.date, value: Math.round(s.best1RM) })),
  };
}

export { estimate1RM };
