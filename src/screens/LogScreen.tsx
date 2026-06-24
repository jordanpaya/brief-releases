import React, { useMemo, useState } from 'react';
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
import { Stepper } from '../components/Stepper';
import { TabIcon } from '../components/TabIcon';
import { useStore } from '../store';
import { colors, fonts, font, radius, shadow, space } from '../theme';
import { Exercise } from '../types';
import { formatWeight, relativeDay, weightStep } from '../utils';

type Draft = { weight: number; reps: number };

export function LogScreen() {
  const { data, addExercise, removeExercise, renameExercise, addSet, removeSet, setUnit, lastSet, todaysSets } =
    useStore();
  const { exercises, unit } = data;

  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const defaultDraft = useMemo<Draft>(() => ({ weight: unit === 'kg' ? 20 : 45, reps: 5 }), [unit]);

  const draftFor = (id: string): Draft => drafts[id] ?? seedDraft(id);

  function seedDraft(id: string): Draft {
    const last = lastSet(id);
    return last ? { weight: last.weight, reps: last.reps } : defaultDraft;
  }

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [id]: { ...draftFor(id), ...patch } }));
  }

  function toggle(id: string) {
    setExpanded((cur) => {
      const next = cur === id ? null : id;
      if (next && !drafts[id]) setDrafts((d) => ({ ...d, [id]: seedDraft(id) }));
      return next;
    });
  }

  function onAddSet(id: string) {
    const d = draftFor(id);
    if (d.reps <= 0) return;
    addSet(id, d.weight, d.reps);
  }

  function onCreateExercise() {
    const created = addExercise(newName);
    setNewName('');
    setShowAdd(false);
    if (created) {
      setExpanded(created.id);
      setDrafts((d) => ({ ...d, [created.id]: defaultDraft }));
    }
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.title}>Lift Log</Text>
          <Text style={styles.subtitle}>Tap a lift, bang in your sets</Text>
        </View>
        <Pressable
          style={styles.unitToggle}
          onPress={() => setUnit(unit === 'lb' ? 'kg' : 'lb')}
          hitSlop={8}
        >
          <Text style={[styles.unitText, unit === 'lb' && styles.unitActive]}>lb</Text>
          <Text style={styles.unitSlash}>/</Text>
          <Text style={[styles.unitText, unit === 'kg' && styles.unitActive]}>kg</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
            const d = draftFor(ex.id);
            return (
              <View key={ex.id} style={styles.card}>
                <Pressable onPress={() => toggle(ex.id)} onLongPress={() => onLongPress(ex)}>
                  <View style={styles.cardHeader}>
                    <View style={styles.flex}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      <Text style={styles.exSub}>
                        {last
                          ? `Last: ${formatWeight(last.weight)} ${unit} × ${last.reps} · ${relativeDay(last.date)}`
                          : 'No sets logged yet'}
                      </Text>
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
                    <View style={styles.steppers}>
                      <Stepper
                        label="Weight"
                        value={d.weight}
                        step={weightStep(unit, d.weight)}
                        onChange={(v) => setDraft(ex.id, { weight: v })}
                        suffix={unit}
                      />
                      <View style={{ width: space.md }} />
                      <Stepper
                        label="Reps"
                        value={d.reps}
                        step={1}
                        min={1}
                        onChange={(v) => setDraft(ex.id, { reps: Math.round(v) })}
                      />
                    </View>

                    <Pressable style={styles.addBtn} onPress={() => onAddSet(ex.id)}>
                      <Text style={styles.addBtnText}>+ Add set</Text>
                    </Pressable>

                    {today.length > 0 ? (
                      <View style={styles.chips}>
                        {today.map((s) => (
                          <Pressable key={s.id} style={styles.chip} onPress={() => removeSet(s.id)}>
                            <Text style={styles.chipText}>
                              {formatWeight(s.weight)} × {s.reps}
                            </Text>
                            <Text style={styles.chipX}>✕</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.hint}>No sets today — log your first one above.</Text>
                    )}
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
              <Pressable
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => {
                  setShowAdd(false);
                  setNewName('');
                }}
              >
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
  steppers: { flexDirection: 'row', marginBottom: space.md },
  addBtn: {
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  addBtnText: { color: colors.white, fontSize: font.body, fontFamily: fonts.bold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.md, gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: space.md,
    gap: 8,
  },
  chipText: { color: colors.text, fontSize: font.small, fontFamily: fonts.bold },
  chipX: { color: colors.textFaint, fontSize: font.tiny, fontFamily: fonts.regular },
  hint: { color: colors.textFaint, fontSize: font.small, fontFamily: fonts.regular, marginTop: space.md },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
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
