import {
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
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
import { TabIcon } from './src/components/TabIcon';
import { CoachScreen } from './src/screens/CoachScreen';
import { LogScreen } from './src/screens/LogScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { StoreProvider, useStore } from './src/store';
import { colors, fonts, font, space } from './src/theme';

type TabKey = 'log' | 'progress' | 'coach';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'log', label: 'Log' },
  { key: 'progress', label: 'Progress' },
  { key: 'coach', label: 'Coach' },
];

function Shell() {
  const { ready } = useStore();
  const [tab, setTab] = useState<TabKey>('log');

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.black} />
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
              <TabIcon name={t.key} color={active ? colors.black : colors.textFaint} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {fontsLoaded ? (
        <StoreProvider>
          <Shell />
        </StoreProvider>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.black} />
        </View>
      )}
    </SafeAreaView>
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
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabLabel: { color: colors.textFaint, fontSize: font.tiny, fontFamily: fonts.bold },
  tabLabelActive: { color: colors.black },
});
