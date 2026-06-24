import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from '../components/LineChart';
import { getGrowth } from '../coach';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { formatDateShort, formatWeight } from '../utils';

export function ProgressScreen() {
  const { data, setsFor } = useStore();
  const { exercises, unit } = data;

  const cards = useMemo(
    () =>
      exercises
        .map((ex) => ({ ex, growth: getGrowth(setsFor(ex.id)) }))
        .filter((c) => c.growth.sessions > 0)
        .sort((a, b) => b.growth.current1RM - a.growth.current1RM),
    [exercises, setsFor],
  );

  const chartWidth = Dimensions.get('window').width - space.lg * 2 - space.lg * 2;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Your strength over time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyTitle}>Nothing to chart yet</Text>
            <Text style={styles.emptyText}>
              Log a few sessions on the Log tab and your growth shows up here automatically.
            </Text>
          </View>
        ) : (
          cards.map(({ ex, growth }) => {
            const up = growth.changePct >= 0;
            return (
              <View key={ex.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <View style={[styles.deltaPill, { backgroundColor: up ? colors.accentDim : '#4A1F1F' }]}>
                    <Text style={[styles.deltaText, { color: up ? colors.accent : colors.danger }]}>
                      {up ? '▲' : '▼'} {Math.abs(growth.changePct).toFixed(0)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <Stat label="Est. 1RM" value={`${formatWeight(Math.round(growth.current1RM))} ${unit}`} />
                  <Stat label="Best set" value={growth.prSet ? `${formatWeight(growth.prWeight)} × ${growth.prSet.reps}` : '—'} />
                  <Stat label="Sessions" value={String(growth.sessions)} />
                </View>

                <LineChart data={growth.series} width={chartWidth} />

                <View style={styles.axis}>
                  <Text style={styles.axisText}>{formatDateShort(growth.series[0].date)}</Text>
                  <Text style={styles.axisText}>
                    {formatDateShort(growth.series[growth.series.length - 1].date)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: space.lg, paddingBottom: space.md },
  title: { color: colors.text, fontSize: font.display, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl * 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exName: { color: colors.text, fontSize: font.h2, fontWeight: '700', flex: 1 },
  deltaPill: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 5 },
  deltaText: { fontSize: font.small, fontWeight: '800' },
  statsRow: { flexDirection: 'row', marginTop: space.md, marginBottom: space.md },
  stat: { flex: 1 },
  statValue: { color: colors.text, fontSize: font.h2, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: font.tiny, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  axisText: { color: colors.textFaint, fontSize: font.tiny },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.lg },
  emptyEmoji: { fontSize: 44, marginBottom: space.md },
  emptyTitle: { color: colors.text, fontSize: font.title, fontWeight: '800', marginBottom: space.sm },
  emptyText: { color: colors.textDim, fontSize: font.body, textAlign: 'center', lineHeight: 22 },
});
