import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, font, radius, space } from '../theme';
import { formatWeight } from '../utils';

// A big −/+ stepper with an editable value in the middle. Built for thumbs:
// large tap targets, no fiddly keyboards unless you want them.
export function Stepper({
  label,
  value,
  step,
  min = 0,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)));
  const inc = () => onChange(+(value + step).toFixed(2));

  const onText = (t: string) => {
    const cleaned = t.replace(/[^0-9.]/g, '');
    if (cleaned === '') {
      onChange(min);
      return;
    }
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n)) onChange(n);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={dec} hitSlop={6}>
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <View style={styles.valueBox}>
          <TextInput
            style={styles.value}
            value={formatWeight(value)}
            onChangeText={onText}
            keyboardType="decimal-pad"
            selectTextOnFocus
            maxLength={6}
          />
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>
        <Pressable style={styles.btn} onPress={inc} hitSlop={6}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  label: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontFamily: fonts.bold,
    marginBottom: space.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 48,
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: colors.text,
    fontSize: 26,
    fontFamily: fonts.semibold,
    marginTop: -2,
  },
  valueBox: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  value: {
    color: colors.text,
    fontSize: 27,
    fontFamily: fonts.black,
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
  },
  suffix: {
    color: colors.textDim,
    fontSize: font.body,
    fontFamily: fonts.bold,
  },
});
