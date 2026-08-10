import { DAFTAR_KOMISI, JENIS_KEGIATAN, MOCK_ANGGOTA } from '@/constants/data';
import { Colors, FontSizes, PRIMARY, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { jadwalStorage, notifikasiStorage } from '@/utils/storage';
import { validateScheduleForm } from '@/utils/validation';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AddJadwalScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const todayStr = new Date().toISOString().split('T')[0];

  const [judul, setJudul] = useState('');
  const [jenis, setJenis] = useState(JENIS_KEGIATAN[0].id);
  const [komisi, setKomisi] = useState(DAFTAR_KOMISI[0].nama);
  const [tanggal, setTanggal] = useState(todayStr);
  const [waktuMulai, setWaktuMulai] = useState('09:00');
  const [waktuSelesai, setWaktuSelesai] = useState('12:00');
  const [lokasi, setLokasi] = useState('Ruang Rapat Komisi I');
  const [keterangan, setKeterangan] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSave = async () => {
    const validation = validateScheduleForm({ judul, tanggal, waktuMulai, waktuSelesai, lokasi });
    setErrors(validation.errors);

    if (!validation.isValid) {
      Alert.alert('Peringatan', 'Periksa kembali data yang belum lengkap atau tidak valid.');
      return;
    }

    setSaving(true);
    try {
      const defaultPeserta = MOCK_ANGGOTA.filter((a) => a.komisi === komisi).map((a) => a.id);

      const newSchedule = await jadwalStorage.add({
        judul: judul.trim(),
        jenis,
        komisi,
        tanggal,
        waktuMulai,
        waktuSelesai,
        lokasi: lokasi.trim(),
        status: 'terjadwal',
        peserta: defaultPeserta,
        penanggungJawab: defaultPeserta[0] || 'a1',
        keterangan: keterangan.trim(),
      });

      await notifikasiStorage.add({
        judul: 'Jadwal baru ditambahkan',
        pesan: `Agenda “${newSchedule.judul}” telah ditambahkan untuk ${komisi}.`,
        tipe: 'jadwal',
        dibaca: false,
        createdAt: new Date().toISOString(),
      });

      setSaving(false);
      Alert.alert('Sukses', 'Jadwal kegiatan berhasil ditambahkan dan notifikasi tersimpan!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      setSaving(false);
      Alert.alert('Error', 'Gagal menyimpan jadwal kegiatan. Silakan coba lagi.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Form Tambah Kegiatan Komisi</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Judul Kegiatan <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: errors.judul ? '#DC2626' : theme.border }]}
              placeholder="Contoh: Rapat Dengar Pendapat Raperda"
              placeholderTextColor={theme.textTertiary}
              value={judul}
              onChangeText={(text) => {
                setJudul(text);
                if (errors.judul) {
                  setErrors((prev) => ({ ...prev, judul: undefined }));
                }
              }}
            />
            {errors.judul ? <Text style={styles.errorText}>{errors.judul}</Text> : null}
          </View>

          {/* KOMISI SELECT */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Pilih Komisi</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {DAFTAR_KOMISI.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
                    komisi === item.nama && { backgroundColor: PRIMARY.blue },
                    komisi !== item.nama && { backgroundColor: theme.surfaceSecondary },
                  ]}
                  onPress={() => setKomisi(item.nama)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: komisi === item.nama ? '#FFF' : theme.textSecondary },
                    ]}
                  >
                    {item.nama}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* JENIS KEGIATAN SELECT */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Jenis Kegiatan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {JENIS_KEGIATAN.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
                    jenis === item.id && { backgroundColor: PRIMARY.blue },
                    jenis !== item.id && { backgroundColor: theme.surfaceSecondary },
                  ]}
                  onPress={() => setJenis(item.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: jenis === item.id ? '#FFF' : theme.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Tanggal (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: errors.tanggal ? '#DC2626' : theme.border }]}
                value={tanggal}
                onChangeText={(text) => {
                  setTanggal(text);
                  if (errors.tanggal) {
                    setErrors((prev) => ({ ...prev, tanggal: undefined }));
                  }
                }}
              />
              {errors.tanggal ? <Text style={styles.errorText}>{errors.tanggal}</Text> : null}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Waktu Mulai</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: errors.waktuMulai ? '#DC2626' : theme.border }]}
                value={waktuMulai}
                onChangeText={(text) => {
                  setWaktuMulai(text);
                  if (errors.waktuMulai) {
                    setErrors((prev) => ({ ...prev, waktuMulai: undefined }));
                  }
                }}
              />
              {errors.waktuMulai ? <Text style={styles.errorText}>{errors.waktuMulai}</Text> : null}
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Waktu Selesai</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: errors.waktuSelesai ? '#DC2626' : theme.border }]}
                value={waktuSelesai}
                onChangeText={(text) => {
                  setWaktuSelesai(text);
                  if (errors.waktuSelesai) {
                    setErrors((prev) => ({ ...prev, waktuSelesai: undefined }));
                  }
                }}
              />
              {errors.waktuSelesai ? <Text style={styles.errorText}>{errors.waktuSelesai}</Text> : null}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Lokasi Kegiatan</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: errors.lokasi ? '#DC2626' : theme.border }]}
              placeholder="Contoh: Ruang Rapat Paripurna"
              placeholderTextColor={theme.textTertiary}
              value={lokasi}
              onChangeText={(text) => {
                setLokasi(text);
                if (errors.lokasi) {
                  setErrors((prev) => ({ ...prev, lokasi: undefined }));
                }
              }}
            />
            {errors.lokasi ? <Text style={styles.errorText}>{errors.lokasi}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Agenda / Keterangan</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
              placeholder="Tambahkan uraian agenda rapat..."
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={3}
              value={keterangan}
              onChangeText={setKeterangan}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialIcons name="add-task" size={22} color="#FFF" />
              <Text style={styles.submitBtnText}>Simpan Jadwal Kegiatan</Text>
            </>
          )}
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
  formCard: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    marginBottom: Spacing.xs,
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
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  chipRow: {
    gap: Spacing.xs,
    paddingRight: Spacing.base,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  chipText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
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
  errorText: {
    color: '#DC2626',
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
});
