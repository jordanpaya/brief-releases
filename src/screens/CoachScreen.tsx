import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSuggestion, Suggestion, SuggestionKind } from '../coach';
import { TabIcon } from '../components/TabIcon';
import { useStore } from '../store';
import { colors, fonts, font, radius, shadow, space } from '../theme';
import { formatWeight } from '../utils';

// Each suggestion kind gets a Cal-AI-style tinted pill (soft bg + bold color).
const TAGS: Record<SuggestionKind, { label: string; color: string; tint: string }> = {
  start: { label: 'GET STARTED', color: colors.textDim, tint: colors.surfaceAlt },
  progress: { label: 'PROGRESS', color: colors.blue, tint: colors.blueTint },
  hold: { label: 'HOLD', color: colors.text, tint: colors.surfaceAlt },
  deload: { label: 'DELOAD', color: colors.orange, tint: colors.orangeTint },
  pr: { label: 'NEW PR', color: colors.green, tint: colors.greenTint },
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
            <TabIcon name="coach" color={colors.textFaint} size={52} />
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
  const tag = TAGS[s.kind];
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.exName}>{name}</Text>
        <View style={[styles.tag, { backgroundColor: tag.tint }]}>
          <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
        </View>
      </View>
      <Text style={styles.headline}>{s.headline}</Text>
      <Text style={styles.detail}>{s.detail}</Text>
      {s.target ? (
        <View style={styles.targetRow}>
          <View style={styles.targetChip}>
            <Text style={styles.targetText}>
              Next: {formatWeight(s.target.weight)} {unit} × {s.target.reps}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.lg },
  title: { color: colors.text, fontSize: font.display, fontFamily: fonts.black, letterSpacing: -0.5 },
  subtitle: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.regular, marginTop: 2 },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl * 2 },
  intro: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introText: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.semibold, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  exName: { color: colors.text, fontSize: font.h2, fontFamily: fonts.bold, flex: 1 },
  tag: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 5 },
  tagText: { fontSize: font.tiny, fontFamily: fonts.black, letterSpacing: 0.5 },
  headline: { color: colors.text, fontSize: font.body, fontFamily: fonts.bold, marginBottom: 6 },
  detail: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.regular, lineHeight: 20 },
  targetRow: { flexDirection: 'row', marginTop: space.md },
  targetChip: { backgroundColor: colors.black, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  targetText: { color: colors.white, fontSize: font.small, fontFamily: fonts.bold },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.lg, gap: space.md },
  emptyTitle: { color: colors.text, fontSize: font.title, fontFamily: fonts.black },
  emptyText: { color: colors.textDim, fontSize: font.body, fontFamily: fonts.regular, textAlign: 'center', lineHeight: 22 },
});
