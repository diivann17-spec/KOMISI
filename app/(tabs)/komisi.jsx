import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, PRIMARY, Spacing, Radius, FontSizes, Shadows, KOMISI_COLORS } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import KomisiCard from '@/components/KomisiCard';
import { DAFTAR_KOMISI, MOCK_ANGGOTA, MOCK_LOKUS_KUNJUNGAN } from '@/constants/data';

export default function KomisiScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [selectedKomisi, setSelectedKomisi] = useState(DAFTAR_KOMISI[0].nama);
  const [anggotaList, setAnggotaList] = useState(MOCK_ANGGOTA);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newJabatan, setNewJabatan] = useState('Anggota');
  const [newKomisi, setNewKomisi] = useState('Komisi I');

  const currentAnggotaList = anggotaList.filter(a => a.komisi === selectedKomisi);

  const handleAddAnggota = () => {
    if (!newNama.trim()) {
      Alert.alert('Peringatan', 'Nama anggota tidak boleh kosong.');
      return;
    }
    const newEntry = {
      id: `a-${Date.now()}`,
      nama: newNama.trim(),
      jabatan: newJabatan,
      komisi: newKomisi,
    };
    setAnggotaList([newEntry, ...anggotaList]);
    setSelectedKomisi(newKomisi);
    setShowModal(false);
    setNewNama('');
    setNewJabatan('Anggota');
    Alert.alert('Berhasil', `Anggota baru berhasil ditambahkan ke ${newKomisi}.`);
  };

  const handleDeleteAnggota = (anggota) => {
    Alert.alert(
      'Hapus Anggota',
      `Apakah Anda yakin ingin menghapus ${anggota.nama} dari ${anggota.komisi}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setAnggotaList(anggotaList.filter(a => a.id !== anggota.id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY.navy} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: PRIMARY.navy }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Komisi I – IV DPRD</Text>
            <Text style={styles.headerSub}>Direktori Komisi, Bidang Tugas & Anggota Dewan</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setNewKomisi(selectedKomisi);
              setShowModal(true);
            }}
          >
            <MaterialIcons name="person-add" size={18} color="#0F172A" />
            <Text style={styles.addBtnText}>+ Tambah</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* DIRECTORY SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Struktur Komisi</Text>
        {DAFTAR_KOMISI.map((item) => (
          <KomisiCard
            key={item.id}
            item={item}
            totalAnggota={anggotaList.filter(a => a.komisi === item.nama).length}
            totalJadwal={3}
            onPress={() => setSelectedKomisi(item.nama)}
          />
        ))}

        {/* ANGGOTA SECTION */}
        <View style={styles.anggotaHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Daftar Anggota — {selectedKomisi}
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
            {currentAnggotaList.length} Anggota Dewan Terdaftar
          </Text>
        </View>

        <View style={[styles.anggotaCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          {currentAnggotaList.length === 0 ? (
            <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: Spacing.md }}>
              Belum ada anggota terdaftar untuk {selectedKomisi}.
            </Text>
          ) : (
            currentAnggotaList.map((anggota, idx) => {
              const isKetua = anggota.jabatan === 'Ketua';
              const isWakil = anggota.jabatan === 'Wakil Ketua';
              const isSekretaris = anggota.jabatan === 'Sekretaris';

              let badgeColor = theme.textSecondary;
              let badgeBg = theme.surfaceSecondary;

              if (isKetua) {
                badgeColor = '#D97706';
                badgeBg = '#FEF3C7';
              } else if (isWakil || isSekretaris) {
                badgeColor = PRIMARY.blue;
                badgeBg = '#DBEAFE';
              }

              return (
                <View
                  key={anggota.id}
                  style={[
                    styles.anggotaRow,
                    idx < currentAnggotaList.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderLight,
                    },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: PRIMARY.navy }]}>
                    <Text style={styles.avatarText}>{anggota.nama.charAt(0)}</Text>
                  </View>
                  <View style={styles.anggotaInfo}>
                    <Text style={[styles.anggotaNama, { color: theme.text }]}>{anggota.nama}</Text>
                    <View style={[styles.jabatanBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.jabatanText, { color: badgeColor }]}>
                        {anggota.jabatan}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{ padding: 4 }}
                    onPress={() => handleDeleteAnggota(anggota)}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* LOKUS PERJALANAN DINAS SECTION */}
        <View style={[styles.anggotaHeader, { marginTop: Spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📍 Lokus Perjalanan Dinas Luar Kota — {selectedKomisi}
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
            Agenda penetapan instansi & lokasi kunjungan kerja luar kota
          </Text>
        </View>

        <View style={[styles.anggotaCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: Spacing.md }, Shadows.md]}>
          {(() => {
            const lokusKomisi = MOCK_LOKUS_KUNJUNGAN.filter(l => l.komisi === selectedKomisi);
            if (lokusKomisi.length === 0) {
              return (
                <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: Spacing.md }}>
                  Belum ada penentuan lokus kunjungan dinas untuk {selectedKomisi}.
                </Text>
              );
            }
            return lokusKomisi.map(lok => (
              <View key={lok.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: PRIMARY.blue, flex: 1 }}>{lok.topik}</Text>
                  <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: PRIMARY.blue }}>{lok.status}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginTop: 2 }}>📍 {lok.lokusKota} — {lok.instansiTujuan}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>📅 {lok.tanggalMulai} s/d {lok.tanggalSelesai} ({lok.durasiHari} Hari)</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>👥 Rombongan: {lok.rombongan}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981', marginTop: 4 }}>💰 Estimasi Biaya: Rp {lok.estimasiBiaya.toLocaleString('id-ID')}</Text>
              </View>
            ));
          })()}
        </View>
      </ScrollView>

      {/* MODAL TAMBAH ANGGOTA KOMISI */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>👤 Tambah User Anggota Komisi</Text>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Nama Lengkap & Gelar</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Contoh: Dr. H. Ahmad Sudirman, S.H."
              placeholderTextColor="#94A3B8"
              value={newNama}
              onChangeText={setNewNama}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Pilih Komisi (1 - 4)</Text>
            <View style={styles.komisiPills}>
              {['Komisi I', 'Komisi II', 'Komisi III', 'Komisi IV'].map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[
                    styles.komisiPill,
                    newKomisi === k ? { backgroundColor: PRIMARY.blue } : { backgroundColor: theme.surfaceSecondary },
                  ]}
                  onPress={() => setNewKomisi(k)}
                >
                  <Text
                    style={[
                      styles.komisiPillText,
                      newKomisi === k ? { color: '#FFF', fontWeight: '800' } : { color: theme.text },
                    ]}
                  >
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Jabatan dalam Komisi</Text>
            <View style={styles.komisiPills}>
              {['Ketua', 'Wakil Ketua', 'Sekretaris', 'Anggota'].map((j) => (
                <TouchableOpacity
                  key={j}
                  style={[
                    styles.komisiPill,
                    newJabatan === j ? { backgroundColor: PRIMARY.gold } : { backgroundColor: theme.surfaceSecondary },
                  ]}
                  onPress={() => setNewJabatan(j)}
                >
                  <Text
                    style={[
                      styles.komisiPillText,
                      newJabatan === j ? { color: '#0F172A', fontWeight: '800' } : { color: theme.text },
                    ]}
                  >
                    {j}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btnCancel, { borderColor: theme.border }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={{ color: theme.text, fontWeight: '700' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSubmit} onPress={handleAddAnggota}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Simpan Anggota</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  addBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: FontSizes.xs,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: FontSizes.xs,
    marginTop: 1,
  },
  anggotaHeader: {
    marginTop: Spacing.md,
  },
  anggotaCard: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
  },
  anggotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: FontSizes.base,
  },
  anggotaInfo: {
    flex: 1,
    gap: 4,
  },
  anggotaNama: {
    fontSize: FontSizes.base,
    fontWeight: '700',
  },
  jabatanBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  jabatanText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.base,
  },
  komisiPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  komisiPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  komisiPillText: {
    fontSize: FontSizes.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  btnCancel: {
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  btnSubmit: {
    backgroundColor: PRIMARY.blue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
});
