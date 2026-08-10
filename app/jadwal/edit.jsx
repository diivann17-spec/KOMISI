import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, PRIMARY, Spacing, Radius, FontSizes, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { perubahanJadwalStorage, jadwalStorage } from '@/utils/storage';

export default function EditJadwalScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const params = useLocalSearchParams();

  const jadwalId = params.id;
  const oldJudul = params.judul || 'Rapat Kerja Komisi II';
  const oldTanggal = params.tanggal || '2026-08-10';
  const oldWaktu = params.waktuMulai || '09:00';
  const oldLokasi = params.lokasi || 'Ruang Rapat Komisi II';

  const [newTanggal, setNewTanggal] = useState(oldTanggal);
  const [newWaktu, setNewWaktu] = useState('10:30');
  const [newLokasi, setNewLokasi] = useState(oldLokasi);
  const [alasanPerubahan, setAlasanPerubahan] = useState('');
  const [saving, setSaving] = useState(false);

  const handleReschedule = async () => {
    if (!alasanPerubahan.trim()) {
      Alert.alert('Peringatan', 'Silakan isi Alasan Perubahan / Reschedule.');
      return;
    }

    setSaving(true);
    try {
      // 1. Record reschedule log history
      await perubahanJadwalStorage.add({
        jadwalId: jadwalId || 'j1',
        jadwalSebelumnya: `${oldTanggal} (${oldWaktu})`,
        jadwalBaru: `${newTanggal} (${newWaktu})`,
        lokasiSebelumnya: oldLokasi,
        lokasiBaru: newLokasi,
        alasanPerubahan,
        pengguna: 'Sekretariat DPRD',
        waktuPerubahan: new Date().toISOString(),
        statusPerubahan: 'Disetujui',
      });

      // 2. Update actual schedule item if id provided
      if (jadwalId) {
        await jadwalStorage.update(jadwalId, {
          tanggal: newTanggal,
          waktuMulai: newWaktu,
          lokasi: newLokasi,
        });
      }

      setSaving(false);
      Alert.alert('Sukses', 'Perubahan jadwal berhasil disimpan dan notifikasi telah dikirim!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      setSaving(false);
      Alert.alert('Error', 'Gagal memproses perubahan jadwal.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* OLD SCHEDULE BRIEF */}
        <View style={[styles.oldCard, Shadows.sm]}>
          <Text style={styles.oldCardTag}>JADWAL SAAT INI</Text>
          <Text style={styles.oldJudul}>{oldJudul}</Text>
          <Text style={styles.oldMeta}>
            {oldTanggal} • Pkl {oldWaktu} WIB • {oldLokasi}
          </Text>
        </View>

        {/* RESCHEDULE FORM */}
        <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Form Reschedule / Perubahan</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Tanggal Baru (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              value={newTanggal}
              onChangeText={setNewTanggal}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Waktu Mulai Baru (WIB)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              value={newWaktu}
              onChangeText={setNewWaktu}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Lokasi Baru</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              value={newLokasi}
              onChangeText={setNewLokasi}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Alasan Perubahan Jadwal <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
              placeholder="Contoh: Penyesuaian dengan agenda Paripurna mendadak..."
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={3}
              value={alasanPerubahan}
              onChangeText={setAlasanPerubahan}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleReschedule} disabled={saving} activeOpacity={0.8}>
          <MaterialIcons name="published-with-changes" size={22} color="#FFF" />
          <Text style={styles.submitBtnText}>Simpan & Kirim Notifikasi</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  oldCard: {
    backgroundColor: '#FEF3C7',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  oldCardTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  oldJudul: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: '#78350F',
  },
  oldMeta: {
    fontSize: FontSizes.xs,
    color: '#92400E',
  },
  formCard: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  required: {
    color: '#DC2626',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY.goldDark,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: FontSizes.base,
    fontWeight: '700',
  },
});
