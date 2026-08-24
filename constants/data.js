/**
 * Data statis dan mock data untuk aplikasi DPRD Komisi I–V
 */

// === DAFTAR KOMISI ===
export const DAFTAR_KOMISI = [
  {
    id: 'komisi-1',
    nama: 'Komisi I',
    bidang: 'Hukum, Pemerintahan & Keamanan',
    deskripsi: 'Membidangi hukum, pemerintahan, ketertiban, keamanan, dan pertanahan.',
    icon: 'gavel',
  },
  {
    id: 'komisi-2',
    nama: 'Komisi II',
    bidang: 'Ekonomi & Keuangan',
    deskripsi: 'Membidangi ekonomi, keuangan, perindustrian, perdagangan, dan koperasi.',
    icon: 'account-balance',
  },
  {
    id: 'komisi-3',
    nama: 'Komisi III',
    bidang: 'Pembangunan & Infrastruktur',
    deskripsi: 'Membidangi pembangunan, infrastruktur, perhubungan, dan lingkungan hidup.',
    icon: 'construction',
  },
  {
    id: 'komisi-4',
    nama: 'Komisi IV',
    bidang: 'Kesejahteraan Rakyat',
    deskripsi: 'Membidangi pendidikan, kesehatan, sosial, ketenagakerjaan, dan agama.',
    icon: 'people',
  },
];

// === JENIS KEGIATAN ===
export const JENIS_KEGIATAN = [
  { id: 'rapat-komisi', label: 'Rapat Komisi', icon: 'groups' },
  { id: 'rapat-kerja', label: 'Rapat Kerja', icon: 'work' },
  { id: 'rapat-dengar', label: 'Rapat Dengar Pendapat', icon: 'hearing' },
  { id: 'kunjungan-kerja', label: 'Kunjungan Kerja', icon: 'directions-car' },
  { id: 'audiensi', label: 'Audiensi', icon: 'record-voice-over' },
  { id: 'reses', label: 'Reses', icon: 'home-work' },
  { id: 'internal', label: 'Kegiatan Internal', icon: 'meeting-room' },
  { id: 'lainnya', label: 'Kegiatan Lainnya', icon: 'event' },
];

// === JENIS DOKUMEN ===
export const JENIS_DOKUMEN = [
  { id: 'surat-masuk', label: 'Surat Masuk' },
  { id: 'surat-keluar', label: 'Surat Keluar' },
  { id: 'surat-undangan', label: 'Surat Undangan' },
  { id: 'dokumen-rapat', label: 'Dokumen Rapat' },
  { id: 'notulen', label: 'Notulen' },
  { id: 'berita-acara', label: 'Berita Acara' },
  { id: 'dokumen-kegiatan', label: 'Dokumen Kegiatan' },
  { id: 'dokumen-komisi', label: 'Dokumen Komisi' },
  { id: 'dokumentasi', label: 'Dokumentasi Kegiatan' },
  { id: 'lainnya', label: 'Dokumen Lainnya' },
];

// === STATUS KEGIATAN ===
export const STATUS_KEGIATAN = [
  { id: 'terjadwal', label: 'Terjadwal', color: '#2563EB' },
  { id: 'berlangsung', label: 'Berlangsung', color: '#D97706' },
  { id: 'selesai', label: 'Selesai', color: '#16A34A' },
  { id: 'dibatalkan', label: 'Dibatalkan', color: '#DC2626' },
  { id: 'ditunda', label: 'Ditunda', color: '#7C3AED' },
];

// === STATUS KEHADIRAN ===
export const STATUS_KEHADIRAN = [
  { id: 'hadir', label: 'Hadir', color: '#16A34A', icon: 'check-circle' },
  { id: 'izin', label: 'Izin', color: '#D97706', icon: 'info' },
  { id: 'sakit', label: 'Sakit', color: '#EA580C', icon: 'local-hospital' },
  { id: 'tidak-hadir', label: 'Tidak Hadir', color: '#DC2626', icon: 'cancel' },
  { id: 'terlambat', label: 'Terlambat', color: '#7C3AED', icon: 'schedule' },
];

// === ROLE PENGGUNA ===
export const ROLE_PENGGUNA = [
  { id: 'admin', label: 'Admin' },
  { id: 'sekretariat', label: 'Sekretariat' },
  { id: 'anggota', label: 'Anggota' },
  { id: 'pimpinan', label: 'Pimpinan' },
];

// === MOCK DATA: ANGGOTA ===
export const MOCK_ANGGOTA = [
  { id: 'a1', nama: 'Ir. H. Ahmad Sudirman, M.Si', jabatan: 'Ketua', komisi: 'Komisi I' },
  { id: 'a2', nama: 'Dra. Hj. Siti Rahmawati', jabatan: 'Wakil Ketua', komisi: 'Komisi I' },
  { id: 'a3', nama: 'H. Budi Santoso, S.H.', jabatan: 'Sekretaris', komisi: 'Komisi I' },
  { id: 'a4', nama: 'Bambang Purnomo, S.E.', jabatan: 'Anggota', komisi: 'Komisi I' },
  { id: 'a5', nama: 'Dewi Kartika, S.Pd.', jabatan: 'Anggota', komisi: 'Komisi I' },
  { id: 'a6', nama: 'H. Ridwan Kamil, M.M.', jabatan: 'Ketua', komisi: 'Komisi II' },
  { id: 'a7', nama: 'Ir. Hj. Yuni Astuti', jabatan: 'Wakil Ketua', komisi: 'Komisi II' },
  { id: 'a8', nama: 'Andi Wijaya, S.E., M.Ak.', jabatan: 'Sekretaris', komisi: 'Komisi II' },
  { id: 'a9', nama: 'Hendra Saputra, S.T.', jabatan: 'Anggota', komisi: 'Komisi II' },
  { id: 'a10', nama: 'Ratna Sari, S.H., M.H.', jabatan: 'Anggota', komisi: 'Komisi II' },
  { id: 'a11', nama: 'Ir. Agus Prabowo, M.T.', jabatan: 'Ketua', komisi: 'Komisi III' },
  { id: 'a12', nama: 'H. Sugeng Riyadi, S.T.', jabatan: 'Wakil Ketua', komisi: 'Komisi III' },
  { id: 'a13', nama: 'Drs. Wahyu Hidayat', jabatan: 'Sekretaris', komisi: 'Komisi III' },
  { id: 'a14', nama: 'Nurul Hasanah, S.T., M.Si.', jabatan: 'Anggota', komisi: 'Komisi III' },
  { id: 'a15', nama: 'Fajar Kurniawan, S.T.', jabatan: 'Anggota', komisi: 'Komisi III' },
  { id: 'a16', nama: 'Dr. Hj. Maya Indrawati, M.Kes.', jabatan: 'Ketua', komisi: 'Komisi IV' },
  { id: 'a17', nama: 'H. Surya Darma, S.Pd., M.Pd.', jabatan: 'Wakil Ketua', komisi: 'Komisi IV' },
  { id: 'a18', nama: 'Rina Oktaviani, S.Sos.', jabatan: 'Sekretaris', komisi: 'Komisi IV' },
  { id: 'a19', nama: 'Dr. Arif Rahman, M.Si.', jabatan: 'Anggota', komisi: 'Komisi IV' },
  { id: 'a20', nama: 'Hj. Lestari Ningrum, S.Kep.', jabatan: 'Anggota', komisi: 'Komisi IV' },
];

// === MOCK DATA: JADWAL ===
const today = new Date();
const formatDate = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const MOCK_JADWAL = [
  {
    id: 'j1',
    judul: 'Rapat Komisi I - Pembahasan Raperda',
    jenis: 'rapat-komisi',
    komisi: 'Komisi I',
    tanggal: formatDate(today),
    waktuMulai: '09:00',
    waktuSelesai: '12:00',
    lokasi: 'Ruang Rapat Komisi I',
    status: 'terjadwal',
    peserta: ['a1', 'a2', 'a3', 'a4', 'a5'],
    penanggungJawab: 'a1',
    keterangan: 'Pembahasan Rancangan Peraturan Daerah tentang Ketertiban Umum',
  },
  {
    id: 'j2',
    judul: 'Kunjungan Kerja Komisi III - Proyek Jalan',
    jenis: 'kunjungan-kerja',
    komisi: 'Komisi III',
    tanggal: formatDate(today),
    waktuMulai: '13:00',
    waktuSelesai: '17:00',
    lokasi: 'Jl. Raya Utama Kecamatan Selatan',
    status: 'terjadwal',
    peserta: ['a11', 'a12', 'a13', 'a14', 'a15'],
    penanggungJawab: 'a11',
    keterangan: 'Peninjauan proyek pembangunan jalan kabupaten',
  },
  {
    id: 'j3',
    judul: 'Rapat Kerja Komisi II - APBD',
    jenis: 'rapat-kerja',
    komisi: 'Komisi II',
    tanggal: formatDate(addDays(today, 1)),
    waktuMulai: '10:00',
    waktuSelesai: '14:00',
    lokasi: 'Ruang Rapat Paripurna',
    status: 'terjadwal',
    peserta: ['a6', 'a7', 'a8', 'a9', 'a10'],
    penanggungJawab: 'a6',
    keterangan: 'Pembahasan perubahan APBD tahun anggaran berjalan',
  },
  {
    id: 'j4',
    judul: 'Rapat Dengar Pendapat Komisi IV',
    jenis: 'rapat-dengar',
    komisi: 'Komisi IV',
    tanggal: formatDate(addDays(today, 2)),
    waktuMulai: '09:00',
    waktuSelesai: '12:00',
    lokasi: 'Ruang Rapat Komisi IV',
    status: 'terjadwal',
    peserta: ['a16', 'a17', 'a18', 'a19', 'a20'],
    penanggungJawab: 'a16',
    keterangan: 'Dengar pendapat dengan Dinas Kesehatan',
  },
  {
    id: 'j6',
    judul: 'Rapat Internal - Evaluasi Kinerja',
    jenis: 'internal',
    komisi: 'Komisi I',
    tanggal: formatDate(addDays(today, 5)),
    waktuMulai: '09:00',
    waktuSelesai: '11:00',
    lokasi: 'Ruang Rapat Komisi I',
    status: 'terjadwal',
    peserta: ['a1', 'a2', 'a3', 'a4', 'a5'],
    penanggungJawab: 'a2',
    keterangan: 'Evaluasi kinerja triwulan III',
  },
];

// === MOCK DATA: ARSIP ===
export const MOCK_ARSIP = [
  {
    id: 'doc1',
    namaDoc: 'Surat Undangan Rapat Paripurna',
    nomorDoc: 'SU-001/DPRD/VIII/2026',
    tanggalDoc: formatDate(addDays(today, -2)),
    jenisDoc: 'surat-undangan',
    komisi: 'Komisi I',
    keterangan: 'Undangan rapat paripurna pembahasan Raperda',
    fileUri: null,
    pengunggah: 'Sekretariat',
    waktuArsip: addDays(today, -2).toISOString(),
    ukuranFile: 245000,
  },
  {
    id: 'doc2',
    namaDoc: 'Notulen Rapat Kerja Komisi II',
    nomorDoc: 'NOT-015/KOM-II/VII/2026',
    tanggalDoc: formatDate(addDays(today, -5)),
    jenisDoc: 'notulen',
    komisi: 'Komisi II',
    keterangan: 'Hasil rapat kerja pembahasan anggaran',
    fileUri: null,
    pengunggah: 'Sekretariat',
    waktuArsip: addDays(today, -5).toISOString(),
    ukuranFile: 520000,
  },
  {
    id: 'doc3',
    namaDoc: 'Berita Acara Kunjungan Kerja',
    nomorDoc: 'BA-008/KOM-III/VII/2026',
    tanggalDoc: formatDate(addDays(today, -7)),
    jenisDoc: 'berita-acara',
    komisi: 'Komisi III',
    keterangan: 'Berita acara kunjungan kerja proyek infrastruktur',
    fileUri: null,
    pengunggah: 'Sekretariat',
    waktuArsip: addDays(today, -7).toISOString(),
    ukuranFile: 380000,
  },
  {
    id: 'doc4',
    namaDoc: 'Surat Masuk - Dinas Pendidikan',
    nomorDoc: 'SM-042/DPRD/VII/2026',
    tanggalDoc: formatDate(addDays(today, -3)),
    jenisDoc: 'surat-masuk',
    komisi: 'Komisi IV',
    keterangan: 'Laporan pelaksanaan program pendidikan gratis',
    fileUri: null,
    pengunggah: 'Admin',
    waktuArsip: addDays(today, -3).toISOString(),
    ukuranFile: 190000,
  },
];

// === HELPER: Get anggota by komisi ===
export const getAnggotaByKomisi = (namaKomisi) =>
  MOCK_ANGGOTA.filter((a) => a.komisi === namaKomisi);

// === HELPER: Get jadwal hari ini ===
export const getJadwalHariIni = () => {
  const todayStr = formatDate(new Date());
  return MOCK_JADWAL.filter((j) => j.tanggal === todayStr);
};

// === HELPER: Get jadwal mendatang ===
export const getJadwalMendatang = () => {
  const todayStr = formatDate(new Date());
  return MOCK_JADWAL.filter((j) => j.tanggal > todayStr).sort(
    (a, b) => new Date(a.tanggal) - new Date(b.tanggal)
  );
};

// === HELPER: Get nama anggota by id ===
export const getNamaAnggota = (id) => {
  const anggota = MOCK_ANGGOTA.find((a) => a.id === id);
  return anggota ? anggota.nama : 'Unknown';
};

// === MOCK DATA: LOKUS KUNJUNGAN PERJALANAN DINAS LUAR KOTA ===
export const MOCK_LOKUS_KUNJUNGAN = [
  {
    id: 'lok-1',
    topik: 'Studi Banding Optimalisasi Pelayanan Publik Digital & Smart City',
    komisi: 'Komisi I',
    lokusKota: 'Kota Bandung, Jawa Barat',
    instansiTujuan: 'DPRD Kota Bandung & Diskominfo',
    maksudTujuan: 'Koordinasi penerapan Perda Pelayanan Publik Terpadu dan SPBE berbasis AI',
    tanggalMulai: '2026-09-02',
    tanggalSelesai: '2026-09-05',
    durasiHari: 4,
    rombongan: 'Ketua, Wakil, 6 Anggota Komisi I & 2 Pendamping',
    koordinator: 'Ir. H. Ahmad Sudirman, M.Si',
    estimasiBiaya: 48500000,
    noSuratTugas: '090/ST-K.I/DPRD/2026',
    status: 'Disetujui',
  },
  {
    id: 'lok-2',
    topik: 'Kunjungan Kerja Evaluasi Retribusi Daerah & Pemberdayaan UMKM Modern',
    komisi: 'Komisi II',
    lokusKota: 'Kota Surabaya, Jawa Timur',
    instansiTujuan: 'DPRD Kota Surabaya & Dinas Koperasi & UKM',
    maksudTujuan: 'Studi komparasi regulasi insentif pajak daerah dan ekosistem inkubasi bisnis UMKM digital',
    tanggalMulai: '2026-09-10',
    tanggalSelesai: '2026-09-13',
    durasiHari: 4,
    rombongan: 'Ketua, Sekretaris, 7 Anggota Komisi II',
    koordinator: 'H. Ridwan Kamil, M.M.',
    estimasiBiaya: 52000000,
    noSuratTugas: '090/ST-K.II/DPRD/2026',
    status: 'Diusulkan',
  },
  {
    id: 'lok-3',
    topik: 'Konsultasi Teknis Penataan Drainase Kota & Mitigasi Banjir',
    komisi: 'Komisi III',
    lokusKota: 'DKI Jakarta',
    instansiTujuan: 'Kementerian PUPR RI & BWS Ciliwung Cisadane',
    maksudTujuan: 'Pengajuan bantuan hibah infrastruktur pengendali banjir dan jalan provinsi',
    tanggalMulai: '2026-08-18',
    tanggalSelesai: '2026-08-20',
    durasiHari: 3,
    rombongan: 'Ketua, 5 Anggota Komisi III & 1 Tim Ahli Drainase',
    koordinator: 'Ir. Hendra Wijaya',
    estimasiBiaya: 41200000,
    noSuratTugas: '090/ST-K.III/DPRD/2026',
    status: 'Selesai',
  },
  {
    id: 'lok-4',
    topik: 'Studi Komparasi Pengelolaan Rumah Sakit Daerah & Integrasi BPJS Kesehatan',
    komisi: 'Komisi IV',
    lokusKota: 'Kabupaten Sleman, DI Yogyakarta',
    instansiTujuan: 'DPRD Kab. Sleman & RSUD Murangan',
    maksudTujuan: 'Peningkatan mutu layanan kesehatan gratis serta alokasi UHC untuk warga miskin',
    tanggalMulai: '2026-09-15',
    tanggalSelesai: '2026-09-18',
    durasiHari: 4,
    rombongan: 'Ketua, 8 Anggota Komisi IV & 2 Staf Sekretariat',
    koordinator: 'Dr. Rina Novita',
    estimasiBiaya: 46800000,
    noSuratTugas: '090/ST-K.IV/DPRD/2026',
    status: 'Berlangsung',
  },
];
