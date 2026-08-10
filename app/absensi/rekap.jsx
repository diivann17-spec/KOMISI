import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, PRIMARY, Spacing, Radius, FontSizes, Shadows, ATTENDANCE } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MOCK_ANGGOTA, DAFTAR_KOMISI } from '@/constants/data';
import { absensiStorage, formatDateTime } from '@/utils/storage';

export default function RekapAbsensiScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [selectedKomisi, setSelectedKomisi] = useState('Semua');
  const [absensiLogs, setAbsensiLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const logs = await absensiStorage.getAll();
      setAbsensiLogs(logs);
    };
    fetchLogs();
  }, []);

  const totalHadir = 18 + absensiLogs.length;
  const totalIzin = 3;
  const totalSakit = 1;
  const totalAbsen = 2;
  const totalSemua = totalHadir + totalIzin + totalSakit + totalAbsen;
  const persentase = Math.round((totalHadir / totalSemua) * 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SUMMARY STATS CARD */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Rekapitulasi Kehadiran Anggota</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Persentase Kehadiran Komisi I–V Hari Ini</Text>

          <View style={styles.percentRow}>
            <Text style={[styles.percentValue, { color: PRIMARY.blue }]}>{persentase}%</Text>
            <View style={styles.percentInfo}>
              <Text style={[styles.percentLabel, { color: theme.text }]}>Tingkat Kehadiran Sangat Baik</Text>
              <Text style={[styles.percentMeta, { color: theme.textSecondary }]}>
                {totalHadir} dari {totalSemua} Anggota Dewan Hadir
              </Text>
            </View>
          </View>

          {/* STATUS BREAKDOWN GRID */}
          <View style={styles.gridStatus}>
            <View style={[styles.statusBox, { backgroundColor: ATTENDANCE.hadir.bg }]}>
              <Text style={[styles.statusNum, { color: ATTENDANCE.hadir.color }]}>{totalHadir}</Text>
              <Text style={[styles.statusLabel, { color: ATTENDANCE.hadir.color }]}>Hadir</Text>
            </View>

            <View style={[styles.statusBox, { backgroundColor: ATTENDANCE.izin.bg }]}>
              <Text style={[styles.statusNum, { color: ATTENDANCE.izin.color }]}>{totalIzin}</Text>
              <Text style={[styles.statusLabel, { color: ATTENDANCE.izin.color }]}>Izin</Text>
            </View>

            <View style={[styles.statusBox, { backgroundColor: ATTENDANCE.sakit.bg }]}>
              <Text style={[styles.statusNum, { color: ATTENDANCE.sakit.color }]}>{totalSakit}</Text>
              <Text style={[styles.statusLabel, { color: ATTENDANCE.sakit.color }]}>Sakit</Text>
            </View>

            <View style={[styles.statusBox, { backgroundColor: ATTENDANCE.tidakHadir.bg }]}>
              <Text style={[styles.statusNum, { color: ATTENDANCE.tidakHadir.color }]}>{totalAbsen}</Text>
              <Text style={[styles.statusLabel, { color: ATTENDANCE.tidakHadir.color }]}>Absen</Text>
            </View>
          </View>
        </View>

        {/* FILTER KOMISI */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Filter Rekap Komisi:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {['Semua', ...DAFTAR_KOMISI.map((k) => k.nama)].map((komisi) => (
              <TouchableOpacity
                key={komisi}
                style={[
                  styles.chip,
                  selectedKomisi === komisi && { backgroundColor: PRIMARY.blue },
                  selectedKomisi !== komisi && { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setSelectedKomisi(komisi)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedKomisi === komisi ? '#FFF' : theme.textSecondary },
                  ]}
                >
                  {komisi}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ANGGOTA ATTENDANCE LIST TABLE */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Rincian Kehadiran Per Anggota</Text>
        <View style={[styles.listCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          {MOCK_ANGGOTA.filter(
            (a) => selectedKomisi === 'Semua' || a.komisi === selectedKomisi
          ).map((anggota, idx) => (
            <View
              key={anggota.id}
              style={[
                styles.rowItem,
                idx > 0 && { borderTopWidth: 1, borderTopColor: theme.borderLight },
              ]}
            >
              <View style={styles.anggotaNameBox}>
                <Text style={[styles.namaText, { color: theme.text }]}>{anggota.nama}</Text>
                <Text style={[styles.komisiText, { color: theme.textSecondary }]}>
                  {anggota.komisi} • {anggota.jabatan}
                </Text>
              </View>

              <View style={[styles.badgeStatus, { backgroundColor: ATTENDANCE.hadir.bg }]}>
                <MaterialIcons name="check-circle" size={14} color={ATTENDANCE.hadir.color} />
                <Text style={[styles.badgeStatusText, { color: ATTENDANCE.hadir.color }]}>Hadir</Text>
              </View>
            </View>
          ))}
        </View>
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
  summaryCard: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: FontSizes.xs,
    marginTop: -4,
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#EFF6FF',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  percentValue: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
  },
  percentInfo: {
    flex: 1,
  },
  percentLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  percentMeta: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  gridStatus: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  statusBox: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  statusNum: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  filterGroup: {
    gap: Spacing.xs,
  },
  filterLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  filterRow: {
    gap: Spacing.xs,
    paddingRight: Spacing.base,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  listCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  anggotaNameBox: {
    flex: 1,
  },
  namaText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  komisiText: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  badgeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeStatusText: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
});
