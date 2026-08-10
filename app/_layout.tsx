import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="arsip/scan/index" options={{ title: 'Scan Berkas Fisik', presentation: 'modal' }} />
        <Stack.Screen name="arsip/scan/save" options={{ title: 'Simpan ke Arsip', headerBackTitle: 'Kembali' }} />
        
        {/* FITUR BARU */}
        <Stack.Screen name="jadwal/add" options={{ title: 'Tambah Jadwal Kegiatan', presentation: 'modal' }} />
        <Stack.Screen name="jadwal/edit" options={{ title: 'Edit / Reschedule Jadwal' }} />
        <Stack.Screen name="absensi/qr" options={{ title: 'QR Code Absensi', presentation: 'modal' }} />
        <Stack.Screen name="absensi/rekap" options={{ title: 'Rekapitulasi Kehadiran' }} />
        <Stack.Screen name="rapat/notulen" options={{ title: 'Input Notulen Rapat' }} />
        <Stack.Screen name="laporan/index" options={{ title: 'Cetak Laporan Kegiatan' }} />
        
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
