import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Minimal line icons for the bottom tabs — stroke style, single color.
export function TabIcon({
  name,
  color,
  size = 25,
}: {
  name: 'log' | 'progress' | 'coach';
  color: string;
  size?: number;
}) {
  if (name === 'log') {
    // dumbbell
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="2.5" y="8.5" width="3.2" height="7" rx="1.2" fill={color} />
        <Rect x="18.3" y="8.5" width="3.2" height="7" rx="1.2" fill={color} />
        <Rect x="5.5" y="10.6" width="13" height="2.8" rx="1.4" fill={color} />
      </Svg>
    );
  }
  if (name === 'progress') {
    // upward trend line
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M3 16.5 L9 10.5 L13 13.5 L21 5.5"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path d="M16 5.5 L21 5.5 L21 10.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    );
  }
  // coach — lightbulb
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 17.5 h6 M9.5 20 h5"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="9.5" r="6" stroke={color} strokeWidth={2.2} fill="none" />
    </Svg>
  );
}
