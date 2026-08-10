import React, { useState } from 'react';
import { View, StyleSheet, Modal, Alert, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import ScanCamera from '@/components/ScanCamera';
import ScanPreview from '@/components/ScanPreview';
import { saveScanImage, clearScanTemp } from '@/utils/pdf';

export default function ScanScreen() {
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [showCamera, setShowCamera] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCapture = async (uri) => {
    try {
      const savedUri = await saveScanImage(uri);
      setPages((prev) => [...prev, savedUri]);
      setShowCamera(false);
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan gambar scan.');
    }
  };

  const handleAddPage = () => {
    setShowCamera(true);
  };

  const handleDeletePage = (index) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
    if (pages.length === 1) {
      setShowCamera(true);
    }
  };

  const handleMovePage = (fromIndex, toIndex) => {
    const updated = [...pages];
    const item = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, item);
    setPages(updated);
  };

  const handleGeneratePdf = () => {
    if (pages.length === 0) {
      Alert.alert('Peringatan', 'Silakan ambil foto minimal 1 halaman berkas.');
      return;
    }
    // Navigate to save screen with pages passed
    router.push({
      pathname: '/arsip/scan/save',
      params: { pages: JSON.stringify(pages) },
    });
  };

  const handleClose = () => {
    clearScanTemp();
    router.back();
  };

  return (
    <View style={styles.container}>
      {showCamera ? (
        <ScanCamera
          onCapture={handleCapture}
          onClose={pages.length > 0 ? () => setShowCamera(false) : handleClose}
        />
      ) : (
        <ScanPreview
          pages={pages}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
          onGeneratePdf={handleGeneratePdf}
        />
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Memproses Konversi PDF...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
