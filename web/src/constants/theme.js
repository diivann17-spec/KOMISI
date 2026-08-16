// Design tokens — sama dengan theme.ts Expo (tanpa React Native imports)

export const PRIMARY = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  navyDark: '#020617',
  blue: '#2563EB',
  blueHover: '#1D4ED8',
  blueLight: '#3B82F6',
  blueSoft: '#EFF6FF',
  gold: '#EAB308',
  goldLight: '#FEF08A',
  goldDark: '#CA8A04',
};

export const KOMISI_COLORS = {
  'Komisi I':   { bg: '#EEF2FF', border: '#C7D2FE', accent: '#4F46E5', text: '#312E81', light: '#818CF8' },
  'Komisi II':  { bg: '#FEF3C7', border: '#FDE68A', accent: '#D97706', text: '#78350F', light: '#FBBF24' },
  'Komisi III': { bg: '#DCFCE7', border: '#BBF7D0', accent: '#16A34A', text: '#14532D', light: '#4ADE80' },
  'Komisi IV':  { bg: '#FCE7F3', border: '#FBCFE8', accent: '#DB2777', text: '#831843', light: '#F472B6' },
};

export const STATUS = {
  success: '#10B981', successBg: '#D1FAE5',
  warning: '#F59E0B', warningBg: '#FEF3C7',
  danger: '#EF4444',  dangerBg: '#FEE2E2',
  info: '#3B82F6',    infoBg: '#DBEAFE',
};

export const DAFTAR_KOMISI = [
  { id: 'komisi-1', nama: 'Komisi I',   bidang: 'Hukum, Pemerintahan & Keamanan' },
  { id: 'komisi-2', nama: 'Komisi II',  bidang: 'Ekonomi & Keuangan' },
  { id: 'komisi-3', nama: 'Komisi III', bidang: 'Pembangunan & Infrastruktur' },
  { id: 'komisi-4', nama: 'Komisi IV',  bidang: 'Kesejahteraan Rakyat' },
];

export const JENIS_DOKUMEN = [
  'Surat Masuk', 'Surat Keluar', 'Surat Undangan', 'Notulen Rapat',
  'Berita Acara', 'Laporan Kegiatan', 'Peraturan Daerah', 'Lainnya',
];
