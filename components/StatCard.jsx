import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Spacing, Radius, Shadows, FontSizes, PRIMARY, STATUS } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function StatCard({ title, value, icon, color, bgColor, subtitle = '', onPress }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const content = (
    <View style={[styles.card, { backgroundColor: theme.surface }, Shadows.md]}>
      <View style={[styles.topRow]}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor || PRIMARY.blueSoft }]}>
          <MaterialIcons name={icon || 'bar-chart'} size={22} color={color || PRIMARY.blue} />
        </View>
        <View style={styles.trendBadge}>
          <MaterialIcons name="trending-up" size={14} color={STATUS.success} />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={[styles.value, { color: theme.text }]}>{value ?? 0}</Text>
        <Text style={[styles.title, { color: theme.textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textTertiary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  touchable: {
    minWidth: 155,
  },
  card: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    minWidth: 155,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    marginTop: Spacing.xs,
  },
  value: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  subtitle: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
});
