import { DAFTAR_KOMISI, MOCK_ANGGOTA } from '@/constants/data';
import { Colors, FontSizes, PRIMARY, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { absensiStorage, formatDateTime } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function QRAbsensiScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const params = useLocalSearchParams();

  const kegiatanTitle = params.judul || 'Rapat Komisi I - Pembahasan Raperda';
  const komisi = params.komisi || 'Komisi I';

  const [selectedAnggota, setSelectedAnggota] = useState(MOCK_ANGGOTA[0]);
  const [selectedStatus, setSelectedStatus] = useState('hadir');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchLogs = async () => {
    const logs = await absensiStorage.getAll();
    setRecentScans(logs || []);
  };

  useEffect(() => {
    fetchLogs();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateScan = async () => {
    setIsProcessing(true);
    try {
      const nowIso = new Date().toISOString();
      await absensiStorage.add({
        kegiatanId: params.id || 'j1',
        anggotaId: selectedAnggota.id,
        namaAnggota: selectedAnggota.nama,
        komisi: selectedAnggota.komisi,
        status: selectedStatus,
        waktuScan: nowIso,
        lokasiGps: 'Ruang Paripurna / Ruang Komisi (GPS Verified -7.2504, 112.7521)',
        perangkat: 'Scanner QR Terminal Komisi v2.4',
      });

      await fetchLogs();
      setIsProcessing(false);
      Alert.alert(
        'Presensi Berhasil Dicatat!',
        `Anggota: ${selectedAnggota.nama}\nStatus: ${selectedStatus.toUpperCase()}\nWaktu: ${currentTime.toLocaleTimeString('id-ID')} WIB\nLokasi: Terverifikasi di Gedung DPRD.`
      );
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Gagal mencatat presensi.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HEADER BRIEF */}
        <View style={[styles.cardHeader, Shadows.sm]}>
          <View style={styles.headerRow}>
            <Text style={styles.badgeKomisi}>{komisi}</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>SCANNER AKTIF</Text>
            </View>
          </View>
          <Text style={styles.title}>{kegiatanTitle}</Text>
          <Text style={styles.sub}>
            Waktu Server: {currentTime.toLocaleTimeString('id-ID')} WIB • {currentTime.toLocaleDateString('id-ID')}
          </Text>
        </View>

        {/* QR CODE BOX DISPLAY */}
        <View style={[styles.qrCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.lg]}>
          <View style={styles.qrVisualContainer}>
            <View style={styles.qrGrid}>
              <View style={[styles.qrCorner, styles.topL]} />
              <View style={[styles.qrCorner, styles.topR]} />
              <View style={[styles.qrCorner, styles.botL]} />
              <MaterialIcons name="qr-code-2" size={160} color={PRIMARY.navy} />
            </View>
          </View>
          <View style={styles.qrMetaBox}>
            <MaterialIcons name="verified-user" size={18} color="#10B981" />
            <Text style={[styles.qrInfo, { color: theme.text }]}>
              QR Code Terenkripsi & Terverifikasi Geolocation Gedung DPRD
            </Text>
          </View>
        </View>

        {/* PRESENSI SIMULATOR INTERAKTIF */}
        <View style={[styles.simCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <Text style={[styles.simTitle, { color: theme.text }]}>Terminal Presensi Digital (Realtime)</Text>
          <Text style={[styles.simSub, { color: theme.textSecondary }]}>Pilih Anggota Dewan & Status Kehadiran:</Text>

          {/* PILIH ANGGOTA DEWAN */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.anggotaScroll}>
            {MOCK_ANGGOTA.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.anggotaChip,
                  selectedAnggota.id === a.id && { backgroundColor: PRIMARY.blue },
                  selectedAnggota.id !== a.id && { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                ]}
                onPress={() => setSelectedAnggota(a)}
              >
                <Text
                  style={[
                    styles.anggotaChipText,
                    { color: selectedAnggota.id === a.id ? '#FFF' : theme.text },
                  ]}
                >
                  {a.nama.split(' ')[0]} ({a.komisi})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* PILIH STATUS KEHADIRAN */}
          <View style={styles.statusRowBtn}>
            {[
              { id: 'hadir', label: 'Hadir', color: '#10B981', bg: '#D1FAE5' },
              { id: 'izin', label: 'Izin', color: '#F59E0B', bg: '#FEF3C7' },
              { id: 'sakit', label: 'Sakit', color: '#9333EA', bg: '#F3E8FF' },
              { id: 'tidakHadir', label: 'Absen', color: '#EF4444', bg: '#FEE2E2' },
            ].map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.statusChipBtn,
                  { backgroundColor: selectedStatus === s.id ? s.color : s.bg },
                ]}
                onPress={() => setSelectedStatus(s.id)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: selectedStatus === s.id ? '#FFF' : s.color },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.scanBtn} onPress={handleSimulateScan} disabled={isProcessing} activeOpacity={0.85}>
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialIcons name="fingerprint" size={22} color="#FFF" />
                <Text style={styles.scanBtnText}>Scan QR / Simpan Presensi Resmi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* LOG PRESENSI TERKINI */}
        {recentScans.length > 0 && (
          <View style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.logTitle, { color: theme.text }]}>Log Presensi Rapat Terbaru ({recentScans.length})</Text>
            {recentScans.slice(0, 4).map((log, index) => (
              <View key={log.id || index} style={styles.logRow}>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <View style={styles.logInfo}>
                  <Text style={[styles.logNama, { color: theme.text }]}>{log.namaAnggota}</Text>
                  <Text style={[styles.logMeta, { color: theme.textSecondary }]}>
                    {log.komisi} • {formatDateTime(log.waktuScan)}
                  </Text>
                </View>
                <View style={styles.badgeHadir}>
                  <Text style={styles.badgeHadirText}>{(log.status || 'hadir').toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.rekapLinkBtn} onPress={() => router.push('/absensi/rekap')}>
          <MaterialIcons name="assessment" size={20} color={PRIMARY.blue} />
          <Text style={styles.rekapLinkText}>Lihat Rekapitulasi Presensi Lengkap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  cardHeader: {
    backgroundColor: PRIMARY.navy,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeKomisi: {
    fontSize: 10,
    fontWeight: '800',
    color: PRIMARY.gold,
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
  },
  title: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: '#FFF',
  },
  sub: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
  },
  qrCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
  },
  qrVisualContainer: {
    padding: Spacing.base,
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: PRIMARY.blue,
  },
  qrGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: PRIMARY.navy,
  },
  topL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  botL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  qrMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrInfo: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  simCard: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  simTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
  },
  simSub: {
    fontSize: FontSizes.xs,
  },
  anggotaScroll: {
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  anggotaChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  anggotaChipText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  statusRowBtn: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  statusChipBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY.blue,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  scanBtnText: {
    color: '#FFF',
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  logCard: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  logTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  logInfo: {
    flex: 1,
  },
  logNama: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  logMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  badgeHadir: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeHadirText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  rekapLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.base,
  },
  rekapLinkText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: PRIMARY.blue,
  },
});

