import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSuggestion, Suggestion, SuggestionKind } from '../coach';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { formatWeight } from '../utils';

const ACCENT: Record<SuggestionKind, string> = {
  start: colors.textDim,
  progress: colors.accent,
  hold: colors.blue,
  deload: colors.warn,
  pr: colors.accent,
};

const TAG: Record<SuggestionKind, string> = {
  start: 'GET STARTED',
  progress: 'PROGRESS',
  hold: 'HOLD',
  deload: 'DELOAD',
  pr: 'NEW PR 🎉',
};

export function CoachScreen() {
  const { data, setsFor } = useStore();
  const { exercises, unit } = data;

  const items = useMemo(
    () => exercises.map((ex) => ({ ex, s: getSuggestion(setsFor(ex.id), unit) })),
    [exercises, setsFor, unit],
  );

  const hasAny = exercises.length > 0;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Coach</Text>
        <Text style={styles.subtitle}>Exactly what to lift next session</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!hasAny ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧠</Text>
            <Text style={styles.emptyTitle}>Your coach is warming up</Text>
            <Text style={styles.emptyText}>
              Add exercises and log your sets. Your coach reads your history and hands you the next
              target — add weight, chase reps, or deload when you stall.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.intro}>
              <Text style={styles.introText}>
                Progressive overload, made simple: do a little more than last time. Here's your plan.
              </Text>
            </View>
            {items.map(({ ex, s }) => (
              <SuggestionCard key={ex.id} name={ex.name} s={s} unit={unit} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SuggestionCard({ name, s, unit }: { name: string; s: Suggestion; unit: string }) {
  const accent = ACCENT[s.kind];
  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <View style={styles.cardTop}>
        <Text style={styles.exName}>{name}</Text>
        <Text style={[styles.tag, { color: accent }]}>{TAG[s.kind]}</Text>
      </View>
      <Text style={styles.headline}>{s.headline}</Text>
      <Text style={styles.detail}>{s.detail}</Text>
      {s.target ? (
        <View style={styles.targetRow}>
          <View style={[styles.targetChip, { backgroundColor: accent }]}>
            <Text style={styles.targetText}>
              🎯 {formatWeight(s.target.weight)} {unit} × {s.target.reps}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: space.lg, paddingBottom: space.md },
  title: { color: colors.text, fontSize: font.display, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl * 2 },
  intro: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.md,
  },
  introText: { color: colors.textDim, fontSize: font.small, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: space.lg,
    marginBottom: space.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  exName: { color: colors.text, fontSize: font.h2, fontWeight: '700', flex: 1 },
  tag: { fontSize: font.tiny, fontWeight: '800', letterSpacing: 0.5 },
  headline: { color: colors.text, fontSize: font.body, fontWeight: '700', marginBottom: 6 },
  detail: { color: colors.textDim, fontSize: font.small, lineHeight: 20 },
  targetRow: { flexDirection: 'row', marginTop: space.md },
  targetChip: { borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  targetText: { color: colors.bg, fontSize: font.small, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.lg },
  emptyEmoji: { fontSize: 44, marginBottom: space.md },
  emptyTitle: { color: colors.text, fontSize: font.title, fontWeight: '800', marginBottom: space.sm },
  emptyText: { color: colors.textDim, fontSize: font.body, textAlign: 'center', lineHeight: 22 },
});
