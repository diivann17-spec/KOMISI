import DocumentCard from '@/components/DocumentCard';
import EmptyState from '@/components/EmptyState';
import { DAFTAR_KOMISI } from '@/constants/data';
import { Colors, FontSizes, PRIMARY, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { generatePdfFromHtml } from '@/utils/pdf';
import { arsipStorage, notifikasiStorage, syncAppData } from '@/utils/storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';


export default function ArsipScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKomisi, setSelectedKomisi] = useState('Semua');
  const [documents, setDocuments] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let docs = [];
      if (searchQuery.trim() !== '') {
        docs = await arsipStorage.search(searchQuery);
      } else {
        docs = await arsipStorage.getAll();
      }

      if (selectedKomisi !== 'Semua') {
        docs = docs.filter((d) => d.komisi === selectedKomisi);
      }

      setDocuments(docs);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    const unread = await notifikasiStorage.getUnread();
    setUnreadCount(unread.length);
  };

  useEffect(() => {
    loadDocuments();
    loadNotifications();
  }, [searchQuery, selectedKomisi]);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const openFile = async (fileUri) => {
    try {
      if (!fileUri) {
        Alert.alert('File Tidak Tersedia', 'Dokumen ini tidak memiliki file yang bisa dibuka.');
        return;
      }
      const info = await FileSystem.getInfoAsync(fileUri);
      if (!info.exists) {
        Alert.alert('File Tidak Ditemukan', 'File tidak ada di perangkat. Mungkin sudah dihapus.');
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Tidak Didukung', 'Perangkat tidak mendukung pembukaan file.');
        return;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Buka Dokumen PDF',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Error', 'Gagal membuka file dokumen.');
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Hapus Dokumen',
      `Apakah Anda yakin ingin menghapus "${item.namaDoc}" dari Arsip Digital?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await arsipStorage.delete(item.id);
            await loadDocuments();
            await loadNotifications();
          },
        },
      ]
    );
  };

  const handleViewNotifications = () => {
    router.push('/notifikasi');
  };

  const handleUploadDocument = async () => {
    try {
      setBusyAction('upload');
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const uploadDir = `${FileSystem.documentDirectory}uploads/`;
      await FileSystem.makeDirectoryAsync(uploadDir, { intermediates: true });
      const destUri = `${uploadDir}${asset.name || `upload_${Date.now()}`}`;
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });

      await arsipStorage.add({
        namaDoc: asset.name || 'Dokumen Terunggah',
        nomorDoc: '-',
        tanggalDoc: new Date().toISOString().split('T')[0],
        jenisDoc: 'lainnya',
        komisi: selectedKomisi === 'Semua' ? 'Komisi I' : selectedKomisi,
        keterangan: 'Dokumen diunggah dari perangkat',
        fileUri: destUri,
        ukuranFile: asset.size || 0,
        pengunggah: 'Pengguna',
        waktuArsip: new Date().toISOString(),
        sumber: 'upload',
      });

      await notifikasiStorage.add({
        judul: 'Dokumen berhasil diunggah',
        pesan: 'Berkas baru telah ditambahkan ke arsip digital.',
        tipe: 'arsip',
        dibaca: false,
        createdAt: new Date().toISOString(),
      });

      await loadDocuments();
      await loadNotifications();
      Alert.alert('Sukses', 'Dokumen berhasil ditambahkan ke arsip.');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengunggah dokumen.');
    } finally {
      setBusyAction('');
    }
  };

  const handleExportPdf = async () => {
    try {
      setBusyAction('export');
      const html = `
        <html>
          <head><meta charset="utf-8" /><title>Laporan Arsip</title></head>
          <body style="font-family: Arial; padding: 24px;">
            <h1>Daftar Arsip Digital</h1>
            <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
            <ul>${documents
          .map((doc) => `<li><strong>${doc.namaDoc || '-'}</strong> — ${doc.komisi || '-'} — ${doc.tanggalDoc || '-'}</li>`)
          .join('')}</ul>
          </body>
        </html>`;
      const pdfUri = await generatePdfFromHtml(html, `laporan_arsip_${Date.now()}.pdf`);
      await notifikasiStorage.add({
        judul: 'Laporan PDF selesai',
        pesan: `File PDF laporan arsip berhasil dibuat di ${pdfUri}.`,
        tipe: 'laporan',
        dibaca: false,
        createdAt: new Date().toISOString(),
      });
      await loadNotifications();
      Alert.alert('Sukses', 'Laporan PDF berhasil dibuat.');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengekspor PDF.');
    } finally {
      setBusyAction('');
    }
  };

  const handleSyncData = async () => {
    try {
      setBusyAction('sync');
      await syncAppData();
      await notifikasiStorage.add({
        judul: 'Sinkronisasi selesai',
        pesan: 'Data aplikasi berhasil disinkronkan secara lokal.',
        tipe: 'sync',
        dibaca: false,
        createdAt: new Date().toISOString(),
      });
      await loadNotifications();
      Alert.alert('Sukses', 'Data berhasil disinkronkan.');
    } catch (error) {
      Alert.alert('Error', 'Gagal melakukan sinkronisasi.');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY.navy} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: PRIMARY.navy }]}>
        <View>
          <Text style={styles.headerTitle}>Arsip Digital Komisi</Text>
          <Text style={styles.headerSub}>Repositori Dokumen Fisik & PDF Digital</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleViewNotifications}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <MaterialIcons name="notifications" size={18} color="#FFF" />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleSyncData}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {busyAction === 'sync' ? (
              <ActivityIndicator color={PRIMARY.navy} />
            ) : (
              <MaterialIcons name="sync" size={16} color={PRIMARY.navy} />
            )}
            <Text style={styles.headerActionText}>Sinkronkan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* SEARCH BAR */}
        <View style={[styles.searchCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <MaterialIcons name="search" size={22} color={PRIMARY.blue} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cari dokumen, nomor surat, kata kunci..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* SCAN ACTION PROMO BANNER */}
        <TouchableOpacity
          style={[styles.scanBanner, Shadows.lg]}
          onPress={() => router.push('/arsip/scan')}
          activeOpacity={0.88}
        >
          <View style={styles.scanBannerIcon}>
            <MaterialIcons name="document-scanner" size={32} color={PRIMARY.gold} />
          </View>
          <View style={styles.scanBannerTextContainer}>
            <Text style={styles.scanBannerTitle}>Scan Berkas Fisik → PDF</Text>
            <Text style={styles.scanBannerSub}>
              Ambil foto multi-halaman dan ubah menjadi dokumen PDF digital.
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionPrimary]}
            onPress={handleUploadDocument}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            {busyAction === 'upload' ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <MaterialIcons name="cloud-upload" size={18} color="#FFF" />
            )}
            <Text style={styles.quickActionText}>Unggah Dokumen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionSuccess]}
            onPress={handleExportPdf}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            {busyAction === 'export' ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <MaterialIcons name="picture-as-pdf" size={18} color="#FFF" />
            )}
            <Text style={styles.quickActionText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        {/* FILTER KOMISI */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Filter Komisi:</Text>
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

        {/* DOKUMEN LIST */}
        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Daftar Berkas Digital ({documents.length})
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="large" color={PRIMARY.blue} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Memuat dokumen...</Text>
          </View>
        ) : documents.length === 0 ? (
          <EmptyState
            icon="folder-open"
            title="Tidak Ada Dokumen"
            message="Gunakan tombol 'Scan Berkas' atau 'Unggah Dokumen' untuk menambahkan berkas."
          />
        ) : (
          documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              item={doc}
              onPress={() =>
                Alert.alert(
                  doc.namaDoc,
                  `Nomor: ${doc.nomorDoc || '-'}\nKomisi: ${doc.komisi}\nTanggal: ${doc.tanggalDoc}\nKeterangan: ${doc.keterangan || '-'}\n\nTekan tombol "Buka" untuk membuka file PDF.`,
                  [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Buka', onPress: () => openFile(doc.fileUri) }
                  ]
                )
              }
              onDelete={handleDelete}
            // The DocumentCard component handles its own internal open logic via the pdfBadgeBox
            />
          ))
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    minHeight: 44,
  },
  headerActionText: {
    color: PRIMARY.navy,
    fontWeight: '800',
    fontSize: FontSizes.xs,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 50,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY.navy,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  scanBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBannerTextContainer: {
    flex: 1,
  },
  scanBannerTitle: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: '#FFF',
  },
  scanBannerSub: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    minHeight: 46,
  },
  quickActionPrimary: {
    backgroundColor: PRIMARY.blue,
  },
  quickActionSuccess: {
    backgroundColor: '#10B981',
  },
  quickActionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: FontSizes.xs,
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
  listHeader: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  loadingRow: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.sm,
  },
});
