// constants/theme.ts

// ── Color palettes ────────────────────────────────────────────────────────────

export const DARK_COLORS = {
  mode:       'dark' as const,
  
  // Үндсэн дэвсгэр
  bg:         '#0a0a14',
  bgCard:     'rgba(20, 20, 35, 0.6)',
  bgElevate:  'rgba(30, 30, 50, 0.5)',
  
  // Хүрээ
  border:     'rgba(255, 255, 255, 0.08)',
  border2:    'rgba(255, 255, 255, 0.15)',
  
  // Гол өнгө - Teal
  teal:       '#1de9b6',
  tealDim:    'rgba(29, 233, 182, 0.1)',
  tealMuted:  'rgba(29, 233, 182, 0.2)',
  
  // Coral
  coral:      '#e8607a',
  coralDim:   'rgba(232, 96, 122, 0.1)',
  coralMuted: 'rgba(232, 96, 122, 0.2)',
  
  // Текст
  text:       '#e4e6f0',
  textBright: '#ffffff',
  textSub:    '#8b90a6',
  textDim:    '#5e637a',
  
  // Glassmorphism тусгай
  glassBg:         'rgba(20, 20, 35, 0.55)',
  glassBorder:     'rgba(255, 255, 255, 0.1)',
  glassHighlight:  'rgba(255, 255, 255, 0.06)',
  
  // Градиент
  gradientStart: '#0a0a14',
  gradientMid:   '#121225',
  gradientEnd:   '#1a1a35',
  
  // Neon glow
  glowTeal:      'rgba(29, 233, 182, 0.25)',
  glowCoral:     'rgba(232, 96, 122, 0.2)',
  glowGold:      'rgba(245, 200, 66, 0.2)',
  
  // Нэмэлт
  white:      '#ffffff',
  overlay:    'rgba(10, 10, 20, 0.85)',
  gold:       '#f5c842',
  goldDim:    'rgba(245, 200, 66, 0.1)',
  
  // Status
  success:    '#1de9b6',
  error:      '#e8607a',
  warning:    '#f5c842',
  info:       '#60a5fa',
} as const;

export const LIGHT_COLORS = {
  mode:       'light' as const,
  
  // Үндсэн дэвсгэр - зөөлөн цайвар
  bg:         '#f3f4f8',
  bgCard:     'rgba(255, 255, 255, 0.75)',
  bgElevate:  'rgba(255, 255, 255, 0.6)',
  
  // Хүрээ - тунгалаг саарал
  border:     'rgba(0, 0, 0, 0.06)',
  border2:    'rgba(0, 0, 0, 0.12)',
  
  // Гол өнгө - Teal
  teal:       '#0d9488',
  tealDim:    'rgba(13, 148, 136, 0.08)',
  tealMuted:  'rgba(13, 148, 136, 0.15)',
  
  // Coral
  coral:      '#e11d48',
  coralDim:   'rgba(225, 29, 72, 0.08)',
  coralMuted: 'rgba(225, 29, 72, 0.15)',
  
  // Текст
  text:       '#1e293b',
  textBright: '#0f172a',
  textSub:    '#64748b',
  textDim:    '#94a3b8',
  
  // Glassmorphism тусгай
  glassBg:         'rgba(255, 255, 255, 0.7)',
  glassBorder:     'rgba(0, 0, 0, 0.08)',
  glassHighlight:  'rgba(255, 255, 255, 0.5)',
  
  // Градиент
  gradientStart: '#f3f4f8',
  gradientMid:   '#fafbfd',
  gradientEnd:   '#ffffff',
  
  // Neon glow - light mode-д илүү зөөлөн
  glowTeal:      'rgba(13, 148, 136, 0.15)',
  glowCoral:     'rgba(225, 29, 72, 0.12)',
  glowGold:      'rgba(202, 138, 4, 0.15)',
  
  // Нэмэлт
  white:      '#ffffff',
  overlay:    'rgba(243, 244, 248, 0.85)',
  gold:       '#ca8a04',
  goldDim:    'rgba(202, 138, 4, 0.1)',
  
  // Status – ЗАСВАР: success өнгийг харагдахуйц болгов
  success:    '#0d9488',   // Өмнө нь: '#123a37' (хар бараан, уншигдахгүй)
  error:      '#e11d48',
  warning:    '#ca8a04',
  info:       '#3b82f6',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ThemeMode   = 'dark' | 'light';
export type ThemeColors = typeof DARK_COLORS | typeof LIGHT_COLORS;

// ── Default ────────────────────────────────────────────────────────────────────

export const COLORS: ThemeColors = DARK_COLORS;

// ── Spacing scale ─────────────────────────────────────────────────────────────

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

// ── Border radius scale ───────────────────────────────────────────────────────

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const;

// ── Shadow presets ────────────────────────────────────────────────────────────

export const SHADOW = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  }),
} as const;
