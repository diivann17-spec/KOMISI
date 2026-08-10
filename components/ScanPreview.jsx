import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PRIMARY, Spacing, Radius, FontSizes, Shadows } from '@/constants/theme';

/**
 * Preview halaman yang telah di-scan (multi-page)
 * @param {string[]} pages - Array URI halaman gambar
 * @param {function} onAddPage - Callback tambah halaman baru
 * @param {function} onDeletePage - Callback hapus halaman (index)
 * @param {function} onMovePage - Callback tukar urutan halaman (fromIndex, toIndex)
 * @param {function} onGeneratePdf - Callback buat PDF dan lanjut ke form
 */
export default function ScanPreview({
  pages = [],
  onAddPage,
  onDeletePage,
  onMovePage,
  onGeneratePdf,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Preview Berkas ({pages.length} Halaman)</Text>
        <Text style={styles.subtitle}>Atur urutan atau tambah halaman sebelum dikonversi ke PDF</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {pages.map((uri, index) => (
          <View key={`${uri}-${index}`} style={[styles.pageCard, Shadows.md]}>
            <View style={styles.pageBadge}>
              <Text style={styles.pageBadgeText}>{index + 1}</Text>
            </View>

            <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />

            <View style={styles.pageActions}>
              {index > 0 && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => onMovePage(index, index - 1)}
                >
                  <MaterialIcons name="arrow-upward" size={18} color="#64748B" />
                </TouchableOpacity>
              )}
              {index < pages.length - 1 && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => onMovePage(index, index + 1)}
                >
                  <MaterialIcons name="arrow-downward" size={18} color="#64748B" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.iconBtn, styles.deleteBtn]}
                onPress={() => onDeletePage(index)}
              >
                <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addCard} onPress={onAddPage} activeOpacity={0.7}>
          <MaterialIcons name="add-photo-alternate" size={36} color={PRIMARY.blue} />
          <Text style={styles.addCardText}>+ Tambah Halaman</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={onGeneratePdf}
          activeOpacity={0.8}
          disabled={pages.length === 0}
        >
          <MaterialIcons name="picture-as-pdf" size={22} color="#FFF" />
          <Text style={styles.submitBtnText}>Buat File PDF & Simpan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: Spacing.base,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: FontSizes.xs,
    color: '#64748B',
    marginTop: 2,
  },
  scrollList: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  pageCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.md,
  },
  pageBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: PRIMARY.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBadgeText: {
    color: '#FFF',
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  thumbnail: {
    width: 60,
    height: 80,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
  },
  pageActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  addCard: {
    height: 100,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: '#EFF6FF',
  },
  addCardText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: PRIMARY.blue,
  },
  footer: {
    padding: Spacing.base,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY.blue,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: FontSizes.base,
    fontWeight: '700',
  },
});
