import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontSizes, KOMISI_COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DocumentCard({ item, onPress, onDelete = undefined }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const styleKomisi = KOMISI_COLORS[item.komisi] || {
    bg: '#EEF2FF',
    accent: '#4F46E5',
    text: '#312E81',
  };

  const handleOpenFile = async () => {
    try {
      if (!item.fileUri) {
        Alert.alert('File Tidak Tersedia', 'Dokumen ini tidak memiliki file yang bisa dibuka.');
        return;
      }

      const info = await FileSystem.getInfoAsync(item.fileUri);
      if (!info.exists) {
        Alert.alert(
          'File Tidak Ditemukan',
          'File dokumen tidak ditemukan di perangkat. Mungkin sudah terhapus atau dipindahkan.',
        );
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Tidak Dapat Dibuka', 'Perangkat tidak mendukung berbagi / membuka file.');
        return;
      }

      await Sharing.shareAsync(item.fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: item.namaDoc || 'Buka Dokumen',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Error', 'Gagal membuka file dokumen.');
      console.error('Error opening file:', error);
    }
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
      <TouchableOpacity style={styles.pdfBadgeBox} onPress={handleOpenFile} activeOpacity={0.7}>
        <MaterialIcons name="picture-as-pdf" size={28} color="#EF4444" />
        <Text style={styles.pdfExt}>BUKA</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.komisiTag, { backgroundColor: styleKomisi.bg }]}>
            <Text style={[styles.komisiText, { color: styleKomisi.text }]}>{item.komisi || 'Umum'}</Text>
          </View>
          <Text style={[styles.jenisLabel, { color: theme.textTertiary }]}>{item.jenisDoc}</Text>
        </View>

        <Text style={[styles.namaDoc, { color: theme.text }]} numberOfLines={2}>
          {item.namaDoc}
        </Text>

        {item.nomorDoc ? (
          <Text style={[styles.nomorDoc, { color: theme.textSecondary }]} numberOfLines={1}>
            No: {item.nomorDoc}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.metaBox}>
            <MaterialIcons name="event" size={13} color={theme.icon} />
            <Text style={[styles.metaText, { color: theme.textTertiary }]}>{item.tanggalDoc || 'Hari ini'}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleOpenFile}
              style={styles.openBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="open-in-new" size={16} color="#2563EB" />
              <Text style={styles.openBtnText}>Buka</Text>
            </TouchableOpacity>

            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(item)}
                style={styles.deleteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  pdfBadgeBox: {
    width: 52,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pdfExt: {
    fontSize: 8,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  komisiTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  komisiText: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
  jenisLabel: {
    fontSize: FontSizes.xs,
    textTransform: 'capitalize',
  },
  namaDoc: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    lineHeight: 20,
  },
  nomorDoc: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSizes.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  deleteBtn: {
    padding: 2,
  },
});
