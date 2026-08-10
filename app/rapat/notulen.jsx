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
import { rapatStorage } from '@/utils/storage';

export default function NotulenScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const params = useLocalSearchParams();

  const judulRapat = params.judul || 'Rapat Dengar Pendapat Raperda';
  const komisi = params.komisi || 'Komisi I';

  const [agendaPembahasan, setAgendaPembahasan] = useState('');
  const [hasilPembahasan, setHasilPembahasan] = useState('');
  const [keputusan, setKeputusan] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveNotulen = async () => {
    if (!hasilPembahasan.trim()) {
      Alert.alert('Peringatan', 'Silakan isi Hasil Pembahasan Notulen.');
      return;
    }

    setSaving(true);
    try {
      await rapatStorage.add({
        judulRapat,
        komisi,
        tanggal: new Date().toISOString().split('T')[0],
        agendaPembahasan,
        hasilPembahasan,
        keputusan,
        tindakLanjut,
        petugasNotulen: 'Sekretariat Komisi',
        waktuSimpan: new Date().toISOString(),
      });

      setSaving(false);
      Alert.alert('Sukses', 'Notulen rapat berhasil disimpan ke database!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      setSaving(false);
      Alert.alert('Error', 'Gagal menyimpan notulen rapat.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* HEADER BRIEF */}
        <View style={[styles.cardHeader, Shadows.sm]}>
          <Text style={styles.badgeTag}>{komisi}</Text>
          <Text style={styles.headerTitle}>{judulRapat}</Text>
          <Text style={styles.headerSub}>Input Risalah / Notulen Hasil Pembahasan Rapat</Text>
        </View>

        {/* FORM NOTULEN */}
        <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Risalah Notulen Rapat</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Agenda Pembahasan</Text>
            <TextInput
              style={[styles.input, styles.textAreaShort, { color: theme.text, borderColor: theme.border }]}
              placeholder="Contoh: Pembahasan Pasal 5 dan Pasal 12 Raperda Ketertiban..."
              placeholderTextColor={theme.textTertiary}
              multiline
              value={agendaPembahasan}
              onChangeText={setAgendaPembahasan}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Hasil Pembahasan & Catatan Fraksi <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
              placeholder="Tuliskan uraian hasil tanggapan, usulan fraksi-fraksi..."
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={4}
              value={hasilPembahasan}
              onChangeText={setHasilPembahasan}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Keputusan Rapat</Text>
            <TextInput
              style={[styles.input, styles.textAreaShort, { color: theme.text, borderColor: theme.border }]}
              placeholder="Keputusan resmi yang disepakati bersama..."
              placeholderTextColor={theme.textTertiary}
              multiline
              value={keputusan}
              onChangeText={setKeputusan}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Rencana Tindak Lanjut</Text>
            <TextInput
              style={[styles.input, styles.textAreaShort, { color: theme.text, borderColor: theme.border }]}
              placeholder="Penugasan tim perumus atau jadwal RDP berikutnya..."
              placeholderTextColor={theme.textTertiary}
              multiline
              value={tindakLanjut}
              onChangeText={setTindakLanjut}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSaveNotulen} disabled={saving} activeOpacity={0.8}>
          <MaterialIcons name="save" size={22} color="#FFF" />
          <Text style={styles.submitBtnText}>Simpan Risalah Notulen Rapat</Text>
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
  cardHeader: {
    backgroundColor: PRIMARY.navy,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: 4,
  },
  badgeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: PRIMARY.gold,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
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
  textAreaShort: {
    height: 60,
    textAlignVertical: 'top',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY.blue,
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
