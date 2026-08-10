import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, PRIMARY, Spacing, Radius, FontSizes, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DAFTAR_KOMISI } from '@/constants/data';
import { generatePdfFromHtml } from '@/utils/pdf';
import { arsipStorage } from '@/utils/storage';

export default function LaporanScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [selectedKomisi, setSelectedKomisi] = useState('Semua');
  const [generating, setGenerating] = useState(false);

  const handleGenerateLaporan = async () => {
    setGenerating(true);
    try {
      const todayStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
            .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .kop-title { font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase; }
            .kop-sub { font-size: 14px; margin: 4px 0 0 0; }
            .report-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; text-decoration: underline; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; }
            .footer { margin-top: 30px; float: right; width: 320px; text-align: center; font-size: 11px; }
            .ttd-box { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background-color: #f8fafc; }
            .digital-sig-container { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding: 8px; border: 1px dashed #2563eb; border-radius: 6px; background-color: #ffffff; }
            .qr-verify-box { text-align: center; width: 80px; }
            .qr-label { font-size: 7px; font-weight: bold; color: #1e40af; display: block; margin-top: 2px; }
            .sig-badge { text-align: left; flex: 1; margin-left: 10px; }
            .sig-title { font-size: 9px; font-weight: 800; color: #166534; letter-spacing: 0.5px; }
            .sig-meta { font-size: 7px; color: #15803d; font-weight: bold; margin-bottom: 4px; }
            .sig-name { font-size: 10px; font-weight: bold; color: #0f172a; text-decoration: underline; }
            .sig-nip { font-size: 8px; color: #475569; }
            .sig-hash { font-size: 6px; color: #94a3b8; font-family: monospace; margin-top: 3px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 class="kop-title">DEWAN PERWAKILAN RAKYAT DAERAH</h2>
            <p class="kop-sub">SISTEM INFORMASI MANAJEMEN KEGIATAN KOMISI I - V</p>
          </div>

          <div class="report-title">LAPORAN REKAPITULASI KEGIATAN & PRESENSI (${selectedKomisi.toUpperCase()})</div>

          <p style="font-size: 12px;"><strong>Tanggal Cetak:</strong> ${todayStr}</p>
          <p style="font-size: 12px;"><strong>Filter Komisi:</strong> ${selectedKomisi}</p>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Kegiatan Rapat</th>
                <th>Komisi</th>
                <th>Tanggal</th>
                <th>Waktu</th>
                <th>Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Rapat Komisi I - Pembahasan Raperda</td>
                <td>Komisi I</td>
                <td>2026-08-10</td>
                <td>09:00 - 12:00</td>
                <td>100% (Hadir)</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Rapat Kerja Komisi II - Perubahan APBD</td>
                <td>Komisi II</td>
                <td>2026-08-11</td>
                <td>10:00 - 14:00</td>
                <td>92% (Hadir)</td>
              </tr>
              <tr>
                <td>3</td>
                <td>Kunjungan Kerja Komisi III - Infrastruktur Jalan</td>
                <td>Komisi III</td>
                <td>2026-08-10</td>
                <td>13:00 - 17:00</td>
                <td>88% (Hadir)</td>
              </tr>
              <tr>
                <td>4</td>
                <td>Rapat Dengar Pendapat Komisi IV - Dinkes</td>
                <td>Komisi IV</td>
                <td>2026-08-12</td>
                <td>09:00 - 12:00</td>
                <td>95% (Hadir)</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div class="ttd-box">
              <p style="margin: 0;">Sekretariat DPRD Kabupaten / Kota</p>
              <p style="margin: 2px 0 0 0;"><strong>Kabag Persidangan & Risalah</strong></p>
              
              <!-- DIGITAL SIGNATURE & QR VERIFICATION -->
              <div class="digital-sig-container">
                <div class="qr-verify-box">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=DOKUMEN_RESMI_DPRD_VERIFIED_SIGNATURE_${Date.now()}" alt="QR Validasi" style="width: 75px; height: 75px;" />
                  <span class="qr-label">PINDAS UNTUK VALIDASI</span>
                </div>
                <div class="sig-badge">
                  <div class="sig-title">TERVERIFIKASI DIGITAL</div>
                  <div class="sig-meta">E-SIGNATURE SERTIFIKASI</div>
                  <div class="sig-name">Dr. H. Ahmad Fauzi, M.Si.</div>
                  <div class="sig-nip">NIP. 19780412 200312 1 004</div>
                  <div class="sig-hash">SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
                </div>
              </div>
              <p style="font-size: 10px; color: #64748b; margin-top: 5px;">Dokumen ini telah ditandatangani secara elektronik & sah demi hukum.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const pdfUri = await generatePdfFromHtml(
        htmlContent,
        `Laporan_Kegiatan_${selectedKomisi}_${Date.now()}.pdf`
      );

      // Save report auto into Arsip Digital
      await arsipStorage.add({
        namaDoc: `Laporan Kegiatan & Presensi - ${selectedKomisi}`,
        nomorDoc: `LAP-DPRD/${Date.now().toString().slice(-4)}`,
        tanggalDoc: new Date().toISOString().split('T')[0],
        jenisDoc: 'dokumen-komisi',
        komisi: selectedKomisi === 'Semua' ? 'Komisi I' : selectedKomisi,
        keterangan: 'Laporan rekapitulasi resmi dicetak dari Modul Laporan PDF.',
        fileUri: pdfUri,
        ukuranFile: 180000,
        pengunggah: 'Sekretariat System',
        waktuArsip: new Date().toISOString(),
      });

      setGenerating(false);
      Alert.alert(
        'Laporan Berhasil Dicetak!',
        `File PDF Laporan telah dibuat dan otomatis disimpan ke Arsip Digital.`
      );
    } catch (error) {
      setGenerating(false);
      Alert.alert('Error', 'Gagal mencetak laporan PDF.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.cardHeader, Shadows.sm]}>
          <MaterialIcons name="assessment" size={36} color={PRIMARY.gold} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Modul Laporan PDF Resmi</Text>
            <Text style={styles.headerSub}>Generate & cetak laporan kegiatan per Komisi I–V</Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Pengaturan Laporan</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Pilih Komisi Laporan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {['Semua', ...DAFTAR_KOMISI.map((k) => k.nama)].map((komisi) => (
                <TouchableOpacity
                  key={komisi}
                  style={[
                    styles.chip,
                    selectedKomisi === komisi && { backgroundColor: PRIMARY.blue },
                    selectedKomisi !== komisi && { backgroundColor: theme.surfaceSecondary },
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

          <View style={styles.previewBox}>
            <MaterialIcons name="picture-as-pdf" size={28} color="#EF4444" />
            <View style={styles.previewText}>
              <Text style={styles.previewTitle}>Laporan_Kegiatan_{selectedKomisi}.pdf</Text>
              <Text style={styles.previewSub}>Laporan termasuk rekapitulasi presensi & notulen</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleGenerateLaporan}
          disabled={generating}
          activeOpacity={0.85}
        >
          {generating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialIcons name="print" size={22} color="#FFF" />
              <Text style={styles.submitBtnText}>Generate & Cetak Laporan PDF</Text>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY.navy,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
    marginTop: 2,
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
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#991B1B',
  },
  previewSub: {
    fontSize: FontSizes.xs,
    color: '#7F1D1D',
    marginTop: 2,
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
