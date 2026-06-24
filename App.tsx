import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CoachScreen } from './src/screens/CoachScreen';
import { LogScreen } from './src/screens/LogScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { StoreProvider, useStore } from './src/store';
import { colors, font, space } from './src/theme';

type TabKey = 'log' | 'progress' | 'coach';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'log', label: 'Log', icon: '🏋️' },
  { key: 'progress', label: 'Progress', icon: '📈' },
  { key: 'coach', label: 'Coach', icon: '🧠' },
];

function Shell() {
  const { ready } = useStore();
  const [tab, setTab] = useState<TabKey>('log');

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        {tab === 'log' ? <LogScreen /> : tab === 'progress' ? <ProgressScreen /> : <CoachScreen />}
      </View>
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)} hitSlop={6}>
              <Text style={[styles.tabIcon, !active && styles.tabInactive]}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <Shell />
      </SafeAreaView>
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIcon: { fontSize: 22 },
  tabInactive: { opacity: 0.45 },
  tabLabel: { color: colors.textFaint, fontSize: font.tiny, fontWeight: '700' },
  tabLabelActive: { color: colors.accent },
});
