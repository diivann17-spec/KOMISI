import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generatePdfFromHtml } from '@/utils/pdf';
import { arsipStorage, notifikasiStorage } from '@/utils/storage';
import { PRIMARY, Spacing, FontSizes, Radius, Shadows } from '@/constants/theme';

export default function ScanPage() {
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        base64: false,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        setImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal mengambil foto');
    }
  };

  const generatePdf = async () => {
    if (images.length === 0) {
      Alert.alert('Tidak ada foto', 'Silakan ambil gambar terlebih dahulu');
      return;
    }
    setBusy(true);
    try {
      const imgTags = images.map(uri => `<img src="${uri}" style="width:100%;margin-bottom:16px;"/>`).join('');
      const html = `<html><head><meta charset="utf-8"/></head><body>${imgTags}</body></html>`;
      const pdfUri = await generatePdfFromHtml(html, `scan_${Date.now()}.pdf`);
      await arsipStorage.add({
        namaDoc: 'Hasil Scan',
        nomorDoc: '-',
        tanggalDoc: new Date().toISOString().split('T')[0],
        jenisDoc: 'scan',
        komisi: 'Komisi I',
        keterangan: 'Hasil pemindaian dokumen',
        fileUri: pdfUri,
        ukuranFile: 0,
        pengunggah: 'Pengguna',
        waktuArsip: new Date().toISOString(),
        sumber: 'scan',
      });
      await notifikasiStorage.add({
        judul: 'Scan selesai',
        pesan: `PDF hasil scan telah disimpan di ${pdfUri}`,
        tipe: 'scan',
        dibaca: false,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Sukses', 'PDF berhasil dibuat dan disimpan ke arsip');
      setImages([]);
    } catch (e) {
      Alert.alert('Error', 'Gagal membuat PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: PRIMARY.navy }] }>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Dokumen</Text>
        <Text style={styles.sub}>Ambil foto multi-halaman lalu buat PDF</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={[styles.button, busy && styles.disabled]} onPress={pickImage} disabled={busy}>
          <Text style={styles.buttonText}>Ambil Foto</Text>
        </TouchableOpacity>
        {images.length > 0 && (
          <View style={styles.previewContainer}>
            {images.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.image} />
            ))}
          </View>
        )}
        <TouchableOpacity style={[styles.button, busy && styles.disabled]} onPress={generatePdf} disabled={busy}>
          {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Buat PDF</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.lg, backgroundColor: PRIMARY.navy },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: '#FFF' },
  sub: { fontSize: FontSizes.sm, color: '#D1D5DB' },
  content: { padding: Spacing.base, gap: Spacing.md },
  button: {
    backgroundColor: PRIMARY.blue,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    ...Shadows.md,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: FontSizes.base },
  previewContainer: { marginVertical: Spacing.md },
  image: { width: '100%', height: 200, borderRadius: Radius.sm, marginBottom: Spacing.sm },
});
