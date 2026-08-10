import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, KOMISI_COLORS, Spacing, Radius, Shadows, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Card untuk komisi (Komisi I - V)
 * @param {object} item - Object data komisi
 * @param {number} totalAnggota - Jumlah anggota
 * @param {number} totalJadwal - Jumlah jadwal kegiatan
 * @param {function} onPress - Action callback
 */
export default function KomisiCard({ item, totalAnggota = 0, totalJadwal = 0, onPress }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const styleKomisi = KOMISI_COLORS[item.nama] || {
    bg: '#EEF2FF',
    accent: '#4F46E5',
    text: '#312E81',
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface }, Shadows.md]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.headerBg, { backgroundColor: styleKomisi.bg }]}>
        <View style={[styles.iconBox, { backgroundColor: styleKomisi.accent }]}>
          <MaterialIcons name={item.icon || 'groups'} size={24} color="#FFF" />
        </View>
        <View style={styles.headerTitle}>
          <Text style={[styles.nama, { color: styleKomisi.text }]}>{item.nama}</Text>
          <Text style={[styles.bidang, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.bidang}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.deskripsi, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.deskripsi}
        </Text>

        <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

        <View style={styles.footer}>
          <View style={styles.statItem}>
            <MaterialIcons name="people" size={16} color={styleKomisi.accent} />
            <Text style={[styles.statText, { color: theme.text }]}>
              <Text style={styles.boldNum}>{totalAnggota}</Text> Anggota
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="event-note" size={16} color={styleKomisi.accent} />
            <Text style={[styles.statText, { color: theme.text }]}>
              <Text style={styles.boldNum}>{totalJadwal}</Text> Agenda
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  headerBg: {
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  nama: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  bidang: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  body: {
    padding: Spacing.base,
  },
  deskripsi: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: FontSizes.xs,
  },
  boldNum: {
    fontWeight: '700',
  },
});
