import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TabIcon } from '../components/TabIcon';
import { useStore } from '../store';
import { colors, fonts, font, radius, shadow, space } from '../theme';
import { Exercise, SetEntry } from '../types';
import { compareSet, Dir, estimate1RM, formatWeight, getPreviousSession, relativeDay, todayISO } from '../utils';

// ---- one editable number cell (commits on blur) ----------------------------
function Cell({
  initial,
  onCommit,
  kind,
  placeholder,
}: {
  initial: string;
  onCommit: (raw: string) => void;
  kind: 'weight' | 'reps';
  placeholder?: string;
}) {
  const [t, setT] = useState(initial);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setT(initial);
  }, [initial, focused]);

  return (
    <TextInput
      style={[styles.cell, focused && styles.cellFocus]}
      value={t}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      onChangeText={setT}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onCommit(t);
      }}
      keyboardType={kind === 'reps' ? 'number-pad' : 'decimal-pad'}
      selectTextOnFocus
      returnKeyType="done"
      maxLength={kind === 'reps' ? 3 : 6}
    />
  );
}

// vs-last-week delta pill — the heart of the screen.
const DELTA_STYLE: Record<Dir, { bg: string; fg: string }> = {
  up: { bg: colors.greenTint, fg: colors.green },
  down: { bg: colors.redTint, fg: colors.red },
  same: { bg: colors.surfaceAlt, fg: colors.textDim },
  new: { bg: colors.surfaceAlt, fg: colors.textFaint },
};

function Delta({ dir, short }: { dir: Dir; short: string }) {
  const c = DELTA_STYLE[dir];
  return (
    <View style={[styles.delta, { backgroundColor: c.bg }]}>
      <Text style={[styles.deltaText, { color: c.fg }]}>{short}</Text>
    </View>
  );
}

type Entry = { weight: string; reps: string };

export function LogScreen() {
  const { data, addExercise, removeExercise, renameExercise, addSet, updateSet, removeSet, setUnit, lastSet, todaysSets, setsFor } =
    useStore();
  const { exercises, unit } = data;

  const [expanded, setExpanded] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const defaultEntry = useMemo<Entry>(
    () => ({ weight: String(unit === 'kg' ? 20 : 45), reps: '5' }),
    [unit],
  );

  function seedEntry(id: string): Entry {
    const last = lastSet(id);
    return last ? { weight: formatWeight(last.weight), reps: String(last.reps) } : defaultEntry;
  }

  const entryFor = (id: string): Entry => entries[id] ?? seedEntry(id);

  function setEntry(id: string, patch: Partial<Entry>) {
    setEntries((e) => ({ ...e, [id]: { ...entryFor(id), ...patch } }));
  }

  function toggle(id: string) {
    setExpanded((cur) => {
      const next = cur === id ? null : id;
      if (next && !entries[id]) setEntries((e) => ({ ...e, [id]: seedEntry(id) }));
      return next;
    });
  }

  function commitEntry(id: string) {
    const e = entryFor(id);
    const w = parseFloat(e.weight);
    const r = parseInt(e.reps, 10);
    if (Number.isNaN(w) || w < 0 || Number.isNaN(r) || r <= 0) return;
    addSet(id, w, r);
  }

  function onCreateExercise() {
    const created = addExercise(newName);
    setNewName('');
    setShowAdd(false);
    if (created) {
      setExpanded(created.id);
      setEntries((e) => ({ ...e, [created.id]: defaultEntry }));
    }
  }

  function confirmRemoveSet(s: SetEntry) {
    Alert.alert('Remove set?', `${formatWeight(s.weight)} ${unit} × ${s.reps}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeSet(s.id) },
    ]);
  }

  function onLongPress(ex: Exercise) {
    Alert.alert(ex.name, undefined, [
      {
        text: 'Rename',
        onPress: () =>
          Alert.prompt?.('Rename exercise', undefined, (t) => t && renameExercise(ex.id, t), 'plain-text', ex.name),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete exercise?', `"${ex.name}" and all its sets will be removed.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => removeExercise(ex.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  // "Beating / matching / down vs last week" read for an expanded card.
  function weekSummary(today: SetEntry[], prev: SetEntry[]): { text: string; color: string } | null {
    if (today.length === 0 || prev.length === 0) return null;
    const t = Math.max(...today.map((s) => estimate1RM(s.weight, s.reps)));
    const p = Math.max(...prev.map((s) => estimate1RM(s.weight, s.reps)));
    if (t > p * 1.001) return { text: '↑ Beating last week', color: colors.green };
    if (t < p * 0.999) return { text: '↓ Down vs last week', color: colors.red };
    return { text: '= Matching last week', color: colors.textDim };
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.title}>Lift Log</Text>
          <Text style={styles.subtitle}>Beat last week, set by set</Text>
        </View>
        <Pressable style={styles.unitToggle} onPress={() => setUnit(unit === 'lb' ? 'kg' : 'lb')} hitSlop={8}>
          <Text style={[styles.unitText, unit === 'lb' && styles.unitActive]}>lb</Text>
          <Text style={styles.unitSlash}>/</Text>
          <Text style={[styles.unitText, unit === 'kg' && styles.unitActive]}>kg</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.empty}>
            <TabIcon name="log" color={colors.textFaint} size={52} />
            <Text style={styles.emptyTitle}>No lifts yet</Text>
            <Text style={styles.emptyText}>
              Add your first exercise — bench, squat, whatever you train — and start logging.
            </Text>
          </View>
        ) : (
          exercises.map((ex) => {
            const open = expanded === ex.id;
            const last = lastSet(ex.id);
            const today = todaysSets(ex.id);
            const prev = open ? getPreviousSession(setsFor(ex.id), todayISO()) : [];
            const entry = entryFor(ex.id);
            const summary = open ? weekSummary(today, prev) : null;
            const prevText = (i: number) => {
              const p = prev[i];
              return p ? `${formatWeight(p.weight)} × ${p.reps}` : '—';
            };
            return (
              <View key={ex.id} style={styles.card}>
                <Pressable onPress={() => toggle(ex.id)} onLongPress={() => onLongPress(ex)}>
                  <View style={styles.cardHeader}>
                    <View style={styles.flex}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      {summary ? (
                        <Text style={[styles.exSub, { color: summary.color, fontFamily: fonts.bold }]}>
                          {summary.text}
                        </Text>
                      ) : (
                        <Text style={styles.exSub}>
                          {last
                            ? `Last: ${formatWeight(last.weight)} ${unit} × ${last.reps} · ${relativeDay(last.date)}`
                            : 'No sets logged yet'}
                        </Text>
                      )}
                    </View>
                    {today.length > 0 ? (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>{today.length}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.chev}>{open ? '▾' : '›'}</Text>
                  </View>
                </Pressable>

                {open ? (
                  <View style={styles.body}>
                    <View style={styles.row}>
                      <Text style={[styles.hSet, styles.colHead]}>SET</Text>
                      <Text style={[styles.hPrev, styles.colHead]}>LAST WEEK</Text>
                      <Text style={[styles.hCell, styles.colHead]}>{unit.toUpperCase()}</Text>
                      <Text style={[styles.hCell, styles.colHead]}>REPS</Text>
                      <Text style={[styles.hDelta, styles.colHead]}>VS</Text>
                    </View>

                    {today.map((s: SetEntry, i: number) => {
                      const cmp = compareSet(s, prev[i]);
                      return (
                        <Pressable
                          key={s.id}
                          style={[styles.row, styles.rowDivider]}
                          onLongPress={() => confirmRemoveSet(s)}
                        >
                          <View style={styles.setBadgeWrap}>
                            <View style={styles.setBadge}>
                              <Text style={styles.setBadgeText}>{i + 1}</Text>
                            </View>
                          </View>
                          <Text style={styles.prev} numberOfLines={1}>{prevText(i)}</Text>
                          <Cell
                            initial={formatWeight(s.weight)}
                            kind="weight"
                            onCommit={(raw) => {
                              const n = parseFloat(raw);
                              if (!Number.isNaN(n) && n >= 0) updateSet(s.id, n, s.reps);
                            }}
                          />
                          <Cell
                            initial={String(s.reps)}
                            kind="reps"
                            onCommit={(raw) => {
                              const n = parseInt(raw, 10);
                              if (!Number.isNaN(n) && n > 0) updateSet(s.id, s.weight, n);
                            }}
                          />
                          <Delta dir={cmp.dir} short={cmp.short} />
                        </Pressable>
                      );
                    })}

                    {/* active entry row */}
                    <View style={[styles.row, styles.rowDivider]}>
                      <View style={styles.setBadgeWrap}>
                        <View style={[styles.setBadge, styles.setBadgeNext]}>
                          <Text style={styles.setBadgeNextText}>{today.length + 1}</Text>
                        </View>
                      </View>
                      <Text style={[styles.prev, styles.prevFaint]} numberOfLines={1}>{prevText(today.length)}</Text>
                      <Cell initial={entry.weight} kind="weight" placeholder="0" onCommit={(raw) => setEntry(ex.id, { weight: raw })} />
                      <Cell initial={entry.reps} kind="reps" placeholder="0" onCommit={(raw) => setEntry(ex.id, { reps: raw })} />
                      <Pressable style={[styles.delta, styles.logBtn]} onPress={() => commitEntry(ex.id)} hitSlop={6}>
                        <Text style={styles.logBtnText}>✓</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.hint}>
                      Enter this week's set and tap ✓. The VS column shows if you beat last week. Long-press a set to remove.
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        <Pressable style={styles.newBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.newBtnText}>+ New exercise</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAdd(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>New exercise</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bench Press"
              placeholderTextColor={colors.textFaint}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onCreateExercise}
            />
            <View style={styles.modalRow}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => { setShowAdd(false); setNewName(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={onCreateExercise}>
                <Text style={styles.modalSaveText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const CELL_W = 54;
const DELTA_W = 56;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  title: { color: colors.text, fontSize: font.display, fontFamily: fonts.black, letterSpacing: -0.5 },
  subtitle: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.regular, marginTop: 2 },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginTop: space.sm,
  },
  unitText: { color: colors.textFaint, fontSize: font.body, fontFamily: fonts.bold },
  unitActive: { color: colors.black },
  unitSlash: { color: colors.textFaint, marginHorizontal: 3, fontFamily: fonts.regular },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl * 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: space.lg },
  exName: { color: colors.text, fontSize: font.h2, fontFamily: fonts.bold },
  exSub: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.regular, marginTop: 3 },
  todayBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: space.sm,
  },
  todayBadgeText: { color: colors.white, fontSize: font.small, fontFamily: fonts.bold },
  chev: { color: colors.textFaint, fontSize: 22, width: 18, textAlign: 'center', fontFamily: fonts.regular },
  body: { paddingHorizontal: space.lg, paddingBottom: space.lg },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm, gap: 6 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  colHead: { color: colors.textFaint, fontSize: font.tiny, fontFamily: fonts.bold, letterSpacing: 0.6 },
  hSet: { width: 28 },
  hPrev: { flex: 1, paddingLeft: 2 },
  hCell: { width: CELL_W, textAlign: 'center' },
  hDelta: { width: DELTA_W, textAlign: 'center' },

  setBadgeWrap: { width: 28 },
  setBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBadgeText: { color: colors.text, fontSize: font.small, fontFamily: fonts.black },
  setBadgeNext: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.borderStrong },
  setBadgeNextText: { color: colors.textFaint, fontSize: font.small, fontFamily: fonts.black },
  prev: { flex: 1, color: colors.textDim, fontSize: font.small, fontFamily: fonts.semibold, paddingLeft: 2 },
  prevFaint: { color: colors.textFaint },

  cell: {
    width: CELL_W,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
    textAlign: 'center',
    color: colors.text,
    fontSize: font.body,
    fontFamily: fonts.black,
    padding: 0,
  },
  cellFocus: { backgroundColor: colors.bg, borderColor: colors.black },

  delta: {
    width: DELTA_W,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaText: { fontSize: font.small, fontFamily: fonts.black },
  logBtn: { backgroundColor: colors.black },
  logBtnText: { color: colors.white, fontSize: 17, fontFamily: fonts.black, marginTop: -1 },

  hint: { color: colors.textFaint, fontSize: font.tiny, fontFamily: fonts.regular, marginTop: space.md, lineHeight: 16 },

  newBtn: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    alignItems: 'center',
    marginTop: space.xs,
  },
  newBtnText: { color: colors.text, fontSize: font.body, fontFamily: fonts.bold },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.lg, gap: space.md },
  emptyTitle: { color: colors.text, fontSize: font.title, fontFamily: fonts.black },
  emptyText: { color: colors.textDim, fontSize: font.body, fontFamily: fonts.regular, textAlign: 'center', lineHeight: 22 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: space.xl },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.xl, ...shadow },
  modalTitle: { color: colors.text, fontSize: font.h2, fontFamily: fonts.black, marginBottom: space.md },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    color: colors.text,
    fontSize: font.body,
    fontFamily: fonts.semibold,
    marginBottom: space.lg,
  },
  modalRow: { flexDirection: 'row', gap: space.md },
  modalBtn: { flex: 1, paddingVertical: space.md, borderRadius: radius.pill, alignItems: 'center' },
  modalCancel: { backgroundColor: colors.surfaceAlt },
  modalCancelText: { color: colors.textDim, fontSize: font.body, fontFamily: fonts.bold },
  modalSave: { backgroundColor: colors.black },
  modalSaveText: { color: colors.white, fontSize: font.body, fontFamily: fonts.bold },
});
