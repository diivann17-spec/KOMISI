import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, KOMISI_COLORS, Spacing, Radius, Shadows, FontSizes, PRIMARY } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDate, getDayName } from '@/utils/storage';
import { JENIS_KEGIATAN } from '@/constants/data';

export default function ScheduleCard({ item, onPress }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const komisiStyle = KOMISI_COLORS[item.komisi] || {
    bg: '#EEF2FF',
    accent: '#4F46E5',
    text: '#312E81',
  };

  const jenisInfo = JENIS_KEGIATAN.find((j) => j.id === item.jenis) || {
    label: item.jenis || 'Kegiatan',
    icon: 'event',
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        Shadows.md,
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Accent Indicator Stripe */}
      <View style={[styles.stripe, { backgroundColor: komisiStyle.accent }]} />

      <View style={styles.content}>
        {/* Top Badges Row */}
        <View style={styles.header}>
          <View style={[styles.badgeKomisi, { backgroundColor: komisiStyle.bg, borderColor: komisiStyle.border }]}>
            <Text style={[styles.badgeKomisiText, { color: komisiStyle.text }]}>{item.komisi}</Text>
          </View>

          <View style={styles.jenisTag}>
            <MaterialIcons name={jenisInfo.icon} size={14} color={PRIMARY.blue} />
            <Text style={[styles.jenisText, { color: PRIMARY.blue }]}>{jenisInfo.label}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.judul, { color: theme.text }]} numberOfLines={2}>
          {item.judul}
        </Text>

        {/* Meta Detail Pills */}
        <View style={styles.details}>
          <View style={styles.detailPill}>
            <MaterialIcons name="event" size={14} color={theme.icon} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {getDayName(item.tanggal)}, {formatDate(item.tanggal)}
            </Text>
          </View>

          <View style={styles.detailPill}>
            <MaterialIcons name="schedule" size={14} color={theme.icon} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {item.waktuMulai} - {item.waktuSelesai || 'Selesai'} WIB
            </Text>
          </View>

          <View style={styles.detailPill}>
            <MaterialIcons name="location-on" size={14} color={theme.icon} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.lokasi}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  stripe: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeKomisi: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeKomisiText: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
  jenisTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  jenisText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  judul: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    lineHeight: 22,
    marginVertical: 2,
  },
  details: {
    marginTop: Spacing.xs,
    gap: 6,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
});
