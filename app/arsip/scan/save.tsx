import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { DAFTAR_KOMISI, JENIS_DOKUMEN } from '../../../constants/data';
import { Colors, FontSizes, PRIMARY, Radius, Shadows, Spacing } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { clearScanTemp, generatePdfFromImages, getFileSize } from '../../../utils/pdf';
import { arsipStorage, notifikasiStorage } from '../../../utils/storage';
import { validateDocumentForm } from '../../../utils/validation';

export default function SaveArsipScreen(): React.JSX.Element {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const router = useRouter();
    const params = useLocalSearchParams();

    const pages: string[] = params.pages && typeof params.pages === 'string' ? JSON.parse(params.pages) : [];

    const todayStr = new Date().toISOString().split('T')[0];

    const [namaDoc, setNamaDoc] = useState('');
    const [nomorDoc, setNomorDoc] = useState('');
    const [tanggalDoc, setTanggalDoc] = useState(todayStr);
    const [jenisDoc, setJenisDoc] = useState(JENIS_DOKUMEN[0].id);
    const [komisi, setKomisi] = useState(DAFTAR_KOMISI[0].nama);
    const [keterangan, setKeterangan] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSave = async () => {
        const validation = validateDocumentForm({ namaDoc, tanggalDoc });
        setErrors(validation.errors);

        if (!validation.isValid) {
            Alert.alert('Peringatan', 'Periksa kembali data dokumen sebelum disimpan.');
            return;
        }

        setSaving(true);
        try {
            const pdfUri = await generatePdfFromImages(pages, namaDoc);
            const fileSize = await getFileSize(pdfUri);

            await arsipStorage.add({
                namaDoc: namaDoc.trim(),
                nomorDoc: nomorDoc.trim(),
                tanggalDoc,
                jenisDoc,
                komisi,
                keterangan: keterangan.trim(),
                fileUri: pdfUri,
                ukuranFile: fileSize,
                pengunggah: 'Sekretariat',
                waktuArsip: new Date().toISOString(),
                jumlahHalaman: pages.length,
            });

            await notifikasiStorage.add({
                judul: 'Dokumen tersimpan',
                pesan: `Dokumen “${namaDoc.trim()}” telah berhasil diarsipkan.`,
                tipe: 'arsip',
                dibaca: false,
                createdAt: new Date().toISOString(),
            });

            await clearScanTemp();

            setSaving(false);
            Alert.alert('Sukses', 'Dokumen PDF berhasil disimpan ke Arsip Digital!', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.dismissAll();
                        router.replace('/(tabs)/arsip' as any);
                    },
                },
            ]);
        } catch (error) {
            setSaving(false);
            Alert.alert('Error', 'Gagal memproses dan menyimpan dokumen PDF. Silakan coba lagi.');
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                {/* SUMMARY HEADER */}
                <View style={[styles.summaryCard, Shadows.sm]}>
                    <MaterialIcons name="picture-as-pdf" size={32} color="#DC2626" />
                    <View style={styles.summaryText}>
                        <Text style={styles.summaryTitle}>Berkas Siap Diarsip</Text>
                        <Text style={styles.summarySub}>{pages.length} Halaman hasil scan foto</Text>
                    </View>
                </View>

                {/* FORM INPUT DOKUMEN */}
                <View style={[styles.formCard, { backgroundColor: theme.surface }, Shadows.sm]}>
                    <Text style={[styles.formSectionTitle, { color: theme.text }]}>Informasi Dokumen</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Nama Dokumen <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: errors.namaDoc ? '#DC2626' : theme.border }]}
                            placeholder="Contoh: Surat Undangan Rapat Paripurna"
                            placeholderTextColor={theme.textTertiary}
                            value={namaDoc}
                            onChangeText={(text) => {
                                setNamaDoc(text);
                                if (errors.namaDoc) {
                                    setErrors((prev) => ({ ...prev, namaDoc: undefined }));
                                }
                            }}
                        />
                        {errors.namaDoc ? <Text style={styles.errorText}>{errors.namaDoc}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Nomor Dokumen</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                            placeholder="Contoh: 005/DPRD/VIII/2026"
                            placeholderTextColor={theme.textTertiary}
                            value={nomorDoc}
                            onChangeText={setNomorDoc}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Tanggal Dokumen (YYYY-MM-DD)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: errors.tanggalDoc ? '#DC2626' : theme.border }]}
                            placeholder="2026-08-10"
                            placeholderTextColor={theme.textTertiary}
                            value={tanggalDoc}
                            onChangeText={(text) => {
                                setTanggalDoc(text);
                                if (errors.tanggalDoc) {
                                    setErrors((prev) => ({ ...prev, tanggalDoc: undefined }));
                                }
                            }}
                        />
                        {errors.tanggalDoc ? <Text style={styles.errorText}>{errors.tanggalDoc}</Text> : null}
                    </View>

                    {/* JENIS DOKUMEN SELECT */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Jenis Dokumen</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                            {JENIS_DOKUMEN.map((item: { id: string; label: string }) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.chip,
                                        jenisDoc === item.id && { backgroundColor: PRIMARY.blue },
                                        jenisDoc !== item.id && { backgroundColor: theme.surfaceSecondary },
                                    ]}
                                    onPress={() => setJenisDoc(item.id)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            { color: jenisDoc === item.id ? '#FFF' : theme.textSecondary },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* KOMISI SELECT */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Komisi Terkait</Text>
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

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Keterangan / Catatan</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                { color: theme.text, borderColor: theme.border },
                            ]}
                            placeholder="Tambahkan keterangan atau ringkasan berkas..."
                            placeholderTextColor={theme.textTertiary}
                            multiline
                            numberOfLines={3}
                            value={keterangan}
                            onChangeText={setKeterangan}
                        />
                    </View>
                </View>

                {/* SUBMIT BUTTON */}
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <MaterialIcons name="save" size={22} color="#FFF" />
                            <Text style={styles.saveBtnText}>Simpan Dokumen ke Arsip</Text>
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
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        padding: Spacing.base,
        borderRadius: Radius.lg,
        gap: Spacing.md,
    },
    summaryText: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: '#991B1B',
    },
    summarySub: {
        fontSize: FontSizes.xs,
        color: '#7F1D1D',
        marginTop: 2,
    },
    formCard: {
        padding: Spacing.base,
        borderRadius: Radius.lg,
        gap: Spacing.md,
    },
    formSectionTitle: {
        fontSize: FontSizes.md,
        fontWeight: '700',
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
        fontWeight: '600',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PRIMARY.blue,
        paddingVertical: Spacing.base,
        borderRadius: Radius.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.xxl,
    },
    saveBtnText: {
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
