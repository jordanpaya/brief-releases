// Central design tokens. Dark, minimal, high-contrast — built for fast logging
// at the gym with one thumb.

export const colors = {
  bg: '#0B0B0F',
  surface: '#16161D',
  surfaceAlt: '#1F1F29',
  border: '#2A2A36',
  text: '#F5F5F7',
  textDim: '#9A9AA8',
  textFaint: '#5E5E6E',
  accent: '#3DDC97', // growth green
  accentDim: '#1E5C46',
  blue: '#5B8DEF',
  warn: '#F5A524',
  danger: '#F25555',
  white: '#FFFFFF',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const font = {
  // Sizes only — RN uses the platform system font by default, which keeps the
  // bundle tiny and the look native.
  display: 34,
  title: 24,
  h2: 19,
  body: 16,
  small: 13,
  tiny: 11,
};
