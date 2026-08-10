import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PRIMARY, Spacing, Radius, FontSizes } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';

/**
 * Component peluncur Kamera untuk mengambil foto berkas fisik
 * @param {function} onCapture - Callback ketika foto berhasil diambil (URI)
 * @param {function} onClose - Callback untuk menutup modal / kamera
 */
export default function ScanCamera({ onCapture, onClose }) {
  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Izin kamera diperlukan untuk melakukan scan berkas.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onCapture(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Izin galeri diperlukan untuk memilih berkas.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      result.assets.forEach((asset) => {
        onCapture(asset.uri);
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Berkas Fisik</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationBox}>
          <MaterialIcons name="document-scanner" size={80} color={PRIMARY.gold} />
          <Text style={styles.title}>Ambil Foto Halaman Berkas</Text>
          <Text style={styles.subtitle}>
            Posisikan dokumen dalam bidang datar dan pastikan pencahayaan cukup agar teks terbaca jelas.
          </Text>
        </View>

        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.primaryBtn} onPress={takePicture} activeOpacity={0.8}>
            <MaterialIcons name="photo-camera" size={24} color="#FFF" />
            <Text style={styles.primaryBtnText}>Buka Kamera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromGallery} activeOpacity={0.8}>
            <MaterialIcons name="photo-library" size={22} color="#FFF" />
            <Text style={styles.secondaryBtnText}>Pilih dari Galeri</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY.navy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#FFF',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  illustrationBox: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionGroup: {
    gap: Spacing.md,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY.blue,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  primaryBtnText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  secondaryBtnText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#FFF',
  },
});
