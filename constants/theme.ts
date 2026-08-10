/**
 * Design System Modern & Premium untuk SIM Kegiatan Komisi I–V DPRD
 */
import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// === BRAND COLOR PALETTE ===
export const PRIMARY = {
  navy: '#0F172A',         // Deep slate navy header/backgrounds
  navyLight: '#1E293B',    // Card navy / elevated surfaces
  navyDark: '#020617',     // Ultra deep background
  blue: '#2563EB',         // Primary action blue
  blueHover: '#1D4ED8',
  blueLight: '#3B82F6',
  blueSoft: '#EFF6FF',
  gold: '#EAB308',         // Accent gold (DPRD identity)
  goldLight: '#FEF08A',
  goldDark: '#CA8A04',
};

// === KOMISI ACCENT SYSTEM ===
export const KOMISI_COLORS = {
  'Komisi I': {
    bg: '#EEF2FF',
    border: '#C7D2FE',
    accent: '#4F46E5',
    gradient: ['#4F46E5', '#6366F1'],
    text: '#312E81',
    lightText: '#818CF8',
  },
  'Komisi II': {
    bg: '#FEF3C7',
    border: '#FDE68A',
    accent: '#D97706',
    gradient: ['#D97706', '#F59E0B'],
    text: '#78350F',
    lightText: '#FBBF24',
  },
  'Komisi III': {
    bg: '#DCFCE7',
    border: '#BBF7D0',
    accent: '#16A34A',
    gradient: ['#16A34A', '#22C55E'],
    text: '#14532D',
    lightText: '#4ADE80',
  },
  'Komisi IV': {
    bg: '#FCE7F3',
    border: '#FBCFE8',
    accent: '#DB2777',
    gradient: ['#DB2777', '#EC4899'],
    text: '#831843',
    lightText: '#F472B6',
  },
  'Komisi V': {
    bg: '#F3E8FF',
    border: '#E9D5FF',
    accent: '#9333EA',
    gradient: ['#9333EA', '#A855F7'],
    text: '#581C87',
    lightText: '#C084FC',
  },
};

// === STATUS COLORS ===
export const STATUS = {
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
};

// === ATTENDANCE COLORS ===
export const ATTENDANCE = {
  hadir: { color: '#10B981', bg: '#D1FAE5', label: 'Hadir' },
  izin: { color: '#F59E0B', bg: '#FEF3C7', label: 'Izin' },
  sakit: { color: '#F97316', bg: '#FFEDD5', label: 'Sakit' },
  tidakHadir: { color: '#EF4444', bg: '#FEE2E2', label: 'Absen' },
  terlambat: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Terlambat' },
};

// === THEME TOKENS ===
export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    background: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAFC',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    tint: PRIMARY.blue,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: PRIMARY.blue,
    tabBar: '#FFFFFF',
    headerBg: PRIMARY.navy,
    headerText: '#FFFFFF',
    cardShadow: 'rgba(15, 23, 42, 0.06)',
    glass: 'rgba(255, 255, 255, 0.85)',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    background: '#020617',
    surface: '#0F172A',
    surfaceSecondary: '#1E293B',
    border: '#1E293B',
    borderLight: '#0F172A',
    tint: '#60A5FA',
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: '#60A5FA',
    tabBar: '#0F172A',
    headerBg: '#020617',
    headerText: '#F8FAFC',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    glass: 'rgba(15, 23, 42, 0.85)',
  },
};

// === RESPONSIVE SPACING & RADIUS ===
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// === ELEVATION SHADOWS ===
export const Shadows = {
  none: {},
  sm: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
    android: { elevation: 8 },
    default: {},
  }),
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 34,
};

export const Fonts = Platform.select({
  ios: { sans: 'System' },
  default: { sans: 'normal' },
  web: { sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
});
