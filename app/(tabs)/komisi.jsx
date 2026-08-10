import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, PRIMARY, Spacing, Radius, FontSizes, Shadows, KOMISI_COLORS } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import KomisiCard from '@/components/KomisiCard';
import { DAFTAR_KOMISI, getAnggotaByKomisi } from '@/constants/data';

export default function KomisiScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [selectedKomisi, setSelectedKomisi] = useState(DAFTAR_KOMISI[0].nama);
  const currentAnggotaList = getAnggotaByKomisi(selectedKomisi);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY.navy} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: PRIMARY.navy }]}>
        <Text style={styles.headerTitle}>Komisi I – V DPRD</Text>
        <Text style={styles.headerSub}>Direktori Komisi, Bidang Tugas & Anggota Dewan</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* DIRECTORY SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Struktur Komisi</Text>
        {DAFTAR_KOMISI.map((item) => (
          <KomisiCard
            key={item.id}
            item={item}
            totalAnggota={getAnggotaByKomisi(item.nama).length}
            totalJadwal={3}
            onPress={() => setSelectedKomisi(item.nama)}
          />
        ))}

        {/* ANGGOTA SECTION */}
        <View style={styles.anggotaHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Daftar Anggota — {selectedKomisi}
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
            {currentAnggotaList.length} Anggota Dewan Terdaftar
          </Text>
        </View>

        <View style={[styles.anggotaCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          {currentAnggotaList.map((anggota, idx) => {
            const isKetua = anggota.jabatan === 'Ketua';
            const isWakil = anggota.jabatan === 'Wakil Ketua';
            const isSekretaris = anggota.jabatan === 'Sekretaris';

            let badgeColor = theme.textSecondary;
            let badgeBg = theme.surfaceSecondary;

            if (isKetua) {
              badgeColor = '#D97706';
              badgeBg = '#FEF3C7';
            } else if (isWakil || isSekretaris) {
              badgeColor = PRIMARY.blue;
              badgeBg = '#DBEAFE';
            }

            return (
              <View
                key={anggota.id}
                style={[
                  styles.anggotaRow,
                  idx < currentAnggotaList.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.borderLight,
                  },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: PRIMARY.navy }]}>
                  <Text style={styles.avatarText}>{anggota.nama.charAt(0)}</Text>
                </View>
                <View style={styles.anggotaInfo}>
                  <Text style={[styles.anggotaNama, { color: theme.text }]}>{anggota.nama}</Text>
                  <View style={[styles.jabatanBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.jabatanText, { color: badgeColor }]}>
                      {anggota.jabatan}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
    marginTop: 2,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: FontSizes.xs,
    marginTop: 1,
  },
  anggotaHeader: {
    marginTop: Spacing.md,
  },
  anggotaCard: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
  },
  anggotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: FontSizes.base,
  },
  anggotaInfo: {
    flex: 1,
    gap: 4,
  },
  anggotaNama: {
    fontSize: FontSizes.base,
    fontWeight: '700',
  },
  jabatanBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  jabatanText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
});
