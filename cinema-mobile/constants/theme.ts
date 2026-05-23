export const DARK_COLORS = {
  mode: 'dark',
  bg: '#0a0a0f',
  bgCard: '#13131a',
  bgElevate: '#1c1c28',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.14)',
  teal: '#1de9b6',
  tealDim: 'rgba(29,233,182,0.15)',
  coral: '#e8607a',
  coralDim: 'rgba(232,96,122,0.15)',
  text: '#e8eaf0',
  textSub: '#6b7080',
  textDim: '#9498ae',
  white: '#ffffff',
  overlay: 'rgba(0,0,0,0.75)',
  gold: '#f5c842',
};

export const LIGHT_COLORS = {
  mode: 'light',
  bg: '#f6f7fb',
  bgCard: '#ffffff',
  bgElevate: '#edf1f7',
  border: 'rgba(20,26,40,0.09)',
  border2: 'rgba(20,26,40,0.16)',
  teal: '#0f9f8f',
  tealDim: 'rgba(15,159,143,0.12)',
  coral: '#d94f68',
  coralDim: 'rgba(217,79,104,0.12)',
  text: '#171923',
  textSub: '#6f7482',
  textDim: '#4f5666',
  white: '#171923',
  overlay: 'rgba(255,255,255,0.82)',
  gold: '#b88900',
};

export type ThemeMode = 'dark' | 'light';
export type ThemeColors = typeof DARK_COLORS;

export const COLORS = DARK_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
