import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query
} from 'firebase/firestore';
import { db } from './firebase';

const KEYS = {
  JADWAL: 'jadwal',
  ARSIP: 'arsip',
  ABSENSI: 'absensi',
  RAPAT: 'rapat',
  SURAT: 'surat',
  NOTIFIKASI: 'notifikasi',
  USER: 'user',
  PENGINGAT: 'pengingat',
  PESAN: 'pesan',
  VOTING: 'voting',
  LEGISLASI: 'legislasi',
  LOKUS_KUNJUNGAN: 'lokus_kunjungan',
};

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung pada peramban ini'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }),
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );
    }
  });
};

export const offlineAttendanceDB = {
  getAllPending: async () => getLocal('pending_absensi'),
  addPending: async (record) => {
    const list = getLocal('pending_absensi');
    list.push(record);
    setLocal('pending_absensi', list);
    return true;
  },
  clearPending: async () => {
    setLocal('pending_absensi', []);
    return true;
  },
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d.getDate()} ${bulan[d.getMonth()]}`;
};

export const formatDateTime = (isoStr) => {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return `${d.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2,'0')}.${d.getMinutes().toString().padStart(2,'0')}`;
};

const getLocal = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const setLocal = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

const notifyStorageChange = (key) => {
  try {
    window.dispatchEvent(new CustomEvent('kegiatan-data-changed', { detail: { key } }));
    window.dispatchEvent(new StorageEvent('storage', { key }));
  } catch {}
};

const notifyNewNotification = (item) => {
  try {
    window.dispatchEvent(new CustomEvent('new-notification', { detail: item }));
  } catch {}
};

// Real-time Firestore sync setup
const firestoreListeners = {};

const initFirestoreListener = (collName) => {
  if (firestoreListeners[collName]) return;
  try {
    const q = collection(db, collName);
    firestoreListeners[collName] = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const cloudItems = [];
        snapshot.forEach((docSnap) => {
          cloudItems.push({ ...docSnap.data(), _firestoreId: docSnap.id });
        });
        
        // Merge cloud items dengan local items unik
        const localItems = getLocal(collName);
        const map = new Map();
        
        // Tambahkan cloud items duluan
        cloudItems.forEach(item => {
          if (item.id) map.set(item.id, item);
        });
        
        // Tambahkan local items yang belum ada di cloud
        localItems.forEach(item => {
          if (item.id && !map.has(item.id)) map.set(item.id, item);
        });

        const merged = Array.from(map.values()).sort((a, b) => {
          const tA = new Date(a.createdAt || a.waktuPresensi || 0);
          const tB = new Date(b.createdAt || b.waktuPresensi || 0);
          return tB - tA;
        });

        setLocal(collName, merged);
        notifyStorageChange(collName);
      }
    }, (err) => {
      console.warn(`[Firestore Realtime] Listener for ${collName} inactive:`, err.message);
    });
  } catch (err) {
    console.warn(`[Firestore Setup] Failed to bind realtime listener for ${collName}:`, err);
  }
};

// Aktifkan realtime sync untuk koleksi utama
['absensi', 'jadwal', 'notifikasi', 'arsip', 'rapat', 'surat', 'pengingat', 'pesan', 'voting', 'legislasi'].forEach(initFirestoreListener);

const makeFirestoreStorage = (collName) => ({
  getAll: () => getLocal(collName),
  add: async (item) => {
    const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    const list = getLocal(collName);
    list.unshift(newItem);
    setLocal(collName, list);
    notifyStorageChange(collName);
    if (collName === KEYS.NOTIFIKASI) notifyNewNotification(newItem);

    try {
      await addDoc(collection(db, collName), newItem);
    } catch (e) {
      console.warn(`[Firebase] Fallback to local storage for ${collName}:`, e);
    }
    return newItem;
  },
  update: async (id, updates) => {
    const list = getLocal(collName);
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setLocal(collName, list);
      notifyStorageChange(collName);
    }
    return true;
  },
  delete: async (id) => {
    const list = getLocal(collName);
    const itemToDelete = list.find(i => i.id === id);
    const filtered = list.filter(i => i.id !== id);
    setLocal(collName, filtered);
    notifyStorageChange(collName);

    // Hapus juga dari Firestore database jika terkoneksi
    try {
      if (itemToDelete && itemToDelete._firestoreId) {
        await deleteDoc(doc(db, collName, itemToDelete._firestoreId));
      } else if (id) {
        // Coba cari doc yang id (properti) sesuai jika _firestoreId tidak tersimpan
        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);
        snapshot.forEach(async (dSnap) => {
          if (dSnap.data().id === id) {
            await deleteDoc(doc(db, collName, dSnap.id));
          }
        });
      }
    } catch (e) {
      console.warn(`[Firebase] Delete fallback for ${collName}:`, e);
    }

    return true;
  },
});

export const jadwalStorage    = makeFirestoreStorage(KEYS.JADWAL);
export const arsipStorage     = makeFirestoreStorage(KEYS.ARSIP);
export const absensiStorage   = makeFirestoreStorage(KEYS.ABSENSI);
export const rapatStorage     = makeFirestoreStorage(KEYS.RAPAT);
export const suratStorage     = makeFirestoreStorage(KEYS.SURAT);
export const pengingatStorage = makeFirestoreStorage(KEYS.PENGINGAT);
export const pesanStorage     = makeFirestoreStorage(KEYS.PESAN);
export const votingStorage    = makeFirestoreStorage(KEYS.VOTING);
export const legislasiStorage = makeFirestoreStorage(KEYS.LEGISLASI);
export const lokusKunjunganStorage = makeFirestoreStorage(KEYS.LOKUS_KUNJUNGAN);

export const notifikasiStorage = {
  ...makeFirestoreStorage(KEYS.NOTIFIKASI),
  getUnread: () => getLocal(KEYS.NOTIFIKASI).filter(n => !n.dibaca),
  markAllRead: () => {
    const list = getLocal(KEYS.NOTIFIKASI).map(n => ({ ...n, dibaca: true }));
    setLocal(KEYS.NOTIFIKASI, list);
  },
};

export const userStorage = {
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem(KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  setCurrentUser: (user) => {
    try { localStorage.setItem(KEYS.USER, JSON.stringify(user)); } catch {}
  },
  clearCurrentUser: () => { localStorage.removeItem(KEYS.USER); },
};

export const clearAllData = () => {
  localStorage.clear();
};

export const seedMockData = () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!localStorage.getItem(KEYS.USER)) {
    localStorage.setItem(KEYS.USER, JSON.stringify({ id: 'u1', displayName: 'Admin Sekretariat', username: 'admin', role: 'sekretariat', roleLabel: 'Admin / Sekretariat DPRD' }));
  }

  // Cek apakah sistem pernah di-seed agar data dummy tidak dibuat ulang saat dihapus
  const isSeeded = localStorage.getItem('sim_seeded');
  if (!isSeeded) {
    if (!getLocal(KEYS.JADWAL).length) {
      setLocal(KEYS.JADWAL, [
        { id: 'j1', judul: 'Rapat Komisi I - Pembahasan APBD', tanggal: today, waktuMulai: '09:00', waktuSelesai: '12:00', lokasi: 'Ruang Rapat Utama Lt. 3', komisi: 'Komisi I', jenisKegiatan: 'Rapat Komisi', status: 'aktif', keterangan: 'Agenda utama: pembahasan anggaran perubahan', createdAt: now.toISOString() },
        { id: 'j2', judul: 'Kunjungan Kerja Komisi II', tanggal: today, waktuMulai: '13:00', waktuSelesai: '17:00', lokasi: 'Dinas Perindustrian', komisi: 'Komisi II', jenisKegiatan: 'Kunjungan Kerja', status: 'aktif', keterangan: '', createdAt: now.toISOString() },
        { id: 'j3', judul: 'Rapat Dengar Pendapat Komisi III', tanggal: today, waktuMulai: '10:00', waktuSelesai: '14:00', lokasi: 'Ruang Komisi III', komisi: 'Komisi III', jenisKegiatan: 'Rapat Dengar Pendapat', status: 'aktif', keterangan: '', createdAt: now.toISOString() },
      ]);
    }

    if (!getLocal(KEYS.ABSENSI).length) {
      setLocal(KEYS.ABSENSI, [
        { id: 'a1', jadwalId: 'j1', jadwalJudul: 'Rapat Komisi I - Pembahasan APBD', namaAnggota: 'H. Ahmad Fauzi, S.E.', komisi: 'Komisi I', status: 'Hadir', waktuPresensi: now.toISOString() },
        { id: 'a2', jadwalId: 'j1', jadwalJudul: 'Rapat Komisi I - Pembahasan APBD', namaAnggota: 'Drs. Supriyadi, M.Si', komisi: 'Komisi I', status: 'Hadir', waktuPresensi: now.toISOString() },
        { id: 'a3', jadwalId: 'j2', jadwalJudul: 'Kunjungan Kerja Komisi II', namaAnggota: 'Hj. Siti Rahmah, S.Pd', komisi: 'Komisi II', status: 'Izin', waktuPresensi: now.toISOString() },
      ]);
    }

    if (!getLocal(KEYS.LOKUS_KUNJUNGAN).length) {
      setLocal(KEYS.LOKUS_KUNJUNGAN, [
        {
          id: 'lok-1',
          topik: 'Studi Komparasi Optimalisasi Pelayanan Publik Digital & Smart City',
          komisi: 'Komisi I',
          masaSesi: 'Masa Persidangan III Tahun 2026',
          jenisPerjalanan: 'Studi Komparasi',
          tanggalBerangkat: '2026-09-01',
          tanggalMulai: '2026-09-02',
          tanggalSelesai: '2026-09-05',
          durasiHari: 4,
          provinsi: 'Jawa Barat',
          kabKota: 'Kota Bandung',
          instansiTujuan: 'Diskominfo Kota Bandung & DPRD Kota Bandung',
          alamatLokus: 'Jl. Wastu Kencana No. 2, Babakan Ciamis, Sumur Bandung, Kota Bandung',
          bidangKajian: 'Pengelolaan SPBE, Layanan Publik Digital & Kecerdasan Buatan',
          maksudTujuan: 'Koordinasi penerapan Perda Pelayanan Publik Terpadu dan SPBE berbasis AI',
          rombongan: 'H. Ahmad Fauzi (Ketua), Drs. Supriyadi (Wakil), 6 Anggota Komisi I & 2 Pendamping',
          koordinator: 'H. Ahmad Fauzi, S.E.',
          estimasiBiaya: 48500000,
          noSuratTugas: '090/ST-K.I/DPRD/2026',
          noSPPD: '094/SPPD-K.I/IX/2026',
          keterangan: 'Akomodasi dan transportasi jalur darat kereta cepat',
          status: 'Disetujui',
          catatanVerifikasi: 'Memenuhi kuorum dan dokumen Kerangka Acuan Kerja (KAK) lengkap.',
          createdAt: now.toISOString()
        },
        {
          id: 'lok-2',
          topik: 'Kunjungan Kerja Evaluasi Retribusi Daerah & Inkubasi UMKM',
          komisi: 'Komisi II',
          masaSesi: 'Masa Persidangan III Tahun 2026',
          jenisPerjalanan: 'Kunjungan Kerja',
          tanggalBerangkat: '2026-09-09',
          tanggalMulai: '2026-09-10',
          tanggalSelesai: '2026-09-13',
          durasiHari: 4,
          provinsi: 'Jawa Timur',
          kabKota: 'Kota Surabaya',
          instansiTujuan: 'Dinas Koperasi & UKM Kota Surabaya & Bapenda',
          alamatLokus: 'Jl. Ngagel Timur No. 56, Pucang Sewu, Gubeng, Kota Surabaya',
          bidangKajian: 'Pajak Daerah & Pemberdayaan Ekonomi Kreatif',
          maksudTujuan: 'Studi komparasi regulasi insentif pajak daerah dan ekosistem inkubasi bisnis UMKM digital',
          rombongan: 'Hj. Siti Rahmah (Ketua), Bambang H. (Sekretaris), 7 Anggota Komisi II',
          koordinator: 'Hj. Siti Rahmah, S.Pd',
          estimasiBiaya: 52000000,
          noSuratTugas: '090/ST-K.II/DPRD/2026',
          noSPPD: '094/SPPD-K.II/IX/2026',
          keterangan: 'Perlu koordinasi lanjutan dengan instansi teknis',
          status: 'Diajukan',
          catatanVerifikasi: 'Menunggu proses verifikasi pimpinan DPRD dan Sekretariat.',
          createdAt: now.toISOString()
        },
        {
          id: 'lok-3',
          topik: 'Konsultasi Teknis Penataan Drainase Kota & Mitigasi Banjir',
          komisi: 'Komisi III',
          masaSesi: 'Masa Persidangan II Tahun 2026',
          jenisPerjalanan: 'Konsultasi Kementerian',
          tanggalBerangkat: '2026-08-17',
          tanggalMulai: '2026-08-18',
          tanggalSelesai: '2026-08-20',
          durasiHari: 3,
          provinsi: 'DKI Jakarta',
          kabKota: 'Kota Jakarta Selatan',
          instansiTujuan: 'Kementerian PUPR RI & BWS Ciliwung Cisadane',
          alamatLokus: 'Jl. Pattimura No. 20, Kebayoran Baru, Jakarta Selatan',
          bidangKajian: 'Infrastruktur Pengendali Banjir & Drainase',
          maksudTujuan: 'Pengajuan bantuan hibah infrastruktur pengendali banjir dan jalan provinsi',
          rombongan: 'Ir. Hendra Wijaya (Ketua), 5 Anggota Komisi III & 1 Tim Ahli',
          koordinator: 'Ir. Hendra Wijaya',
          estimasiBiaya: 41200000,
          noSuratTugas: '090/ST-K.III/DPRD/2026',
          noSPPD: '094/SPPD-K.III/VIII/2026',
          keterangan: 'Surat permohonan audiensi telah diterima Sekretariat Jenderal PUPR',
          status: 'Disetujui',
          catatanVerifikasi: 'Disetujui pimpinan DPRD tanggal 15 Agustus 2026.',
          createdAt: now.toISOString()
        },
        {
          id: 'lok-4',
          topik: 'Studi Komparasi Pengelolaan RSUD & Integrasi BPJS Kesehatan',
          komisi: 'Komisi IV',
          masaSesi: 'Masa Persidangan III Tahun 2026',
          jenisPerjalanan: 'Studi Komparasi',
          tanggalBerangkat: '2026-09-14',
          tanggalMulai: '2026-09-15',
          tanggalSelesai: '2026-09-18',
          durasiHari: 4,
          provinsi: 'DI Yogyakarta',
          kabKota: 'Kabupaten Sleman',
          instansiTujuan: 'DPRD Kab. Sleman & RSUD Murangan',
          alamatLokus: 'Jl. Magelang KM 12.5, Triharjo, Sleman',
          bidangKajian: 'Pelayanan Kesehatan Gratis & Alokasi UHC',
          maksudTujuan: 'Peningkatan mutu layanan kesehatan gratis serta alokasi UHC untuk warga miskin',
          rombongan: 'Dr. Rina Novita (Ketua), 8 Anggota Komisi IV & 2 Staf Sekretariat',
          koordinator: 'Dr. Rina Novita',
          estimasiBiaya: 46800000,
          noSuratTugas: '090/ST-K.IV/DPRD/2026',
          noSPPD: '094/SPPD-K.IV/IX/2026',
          keterangan: 'Studi lapangan ke fasilitas kesehatan UHC',
          status: 'Disetujui',
          catatanVerifikasi: 'Verifikasi anggaran SPPD selesai.',
          createdAt: now.toISOString()
        },
        {
          id: 'lok-5',
          topik: 'Koordinasi Sistem Pengelolaan Sampah Modern & Pengolahan Waste-to-Energy',
          komisi: 'Komisi III',
          masaSesi: 'Masa Persidangan III Tahun 2026',
          jenisPerjalanan: 'Kunjungan Kerja',
          tanggalBerangkat: '2026-09-01',
          tanggalMulai: '2026-09-02',
          tanggalSelesai: '2026-09-05',
          durasiHari: 4,
          provinsi: 'Jawa Barat',
          kabKota: 'Kota Bandung',
          instansiTujuan: 'Diskominfo Kota Bandung & DPRD Kota Bandung',
          alamatLokus: 'Jl. Wastu Kencana No. 2, Kota Bandung',
          bidangKajian: 'Pengolahan Sampah & Lingkungan Hidup',
          maksudTujuan: 'Studi pengelolaan tempat pengolahan sampah terpadu skala perkotaan',
          rombongan: 'Ketua Komisi III & Rombongan',
          koordinator: 'Ir. Hendra Wijaya',
          estimasiBiaya: 49000000,
          noSuratTugas: '090/ST-K.III/DPRD/2026',
          noSPPD: '094/SPPD-K.III/IX/2026',
          keterangan: 'Menguji bentrok instansi & jadwal dengan Komisi I',
          status: 'Diajukan',
          catatanVerifikasi: 'Perlu pemeriksaan bentrok jadwal instansi.',
          createdAt: now.toISOString()
        }
      ]);
    }

    localStorage.setItem('sim_seeded', 'true');
  }

  if (!getLocal(KEYS.LOKUS_KUNJUNGAN).some(item => item.status === 'Draft')) {
    const list = getLocal(KEYS.LOKUS_KUNJUNGAN);
    list.unshift({
      id: 'lok-draft-demo-1',
      topik: 'Studi Komparasi Pengelolaan Layanan Kesehatan Gratis UHC',
      komisi: 'Komisi IV',
      masaSesi: 'Masa Persidangan III Tahun 2026',
      jenisPerjalanan: 'Studi Komparasi',
      tanggalBerangkat: '2026-09-21',
      tanggalMulai: '2026-09-22',
      tanggalSelesai: '2026-09-24',
      durasiHari: 3,
      provinsi: 'Jawa Tengah',
      kabKota: 'Kota Semarang',
      instansiTujuan: 'Dinas Kesehatan Kota Semarang & RSUD KMRT Wongsonegoro',
      alamatLokus: 'Jl. Fatmawati No. 1, Kedungmundu, Tembalang, Kota Semarang',
      bidangKajian: 'Integrasi Jamkesda & Evaluasi Mutu RSUD',
      maksudTujuan: 'Kajian pembanding sistem rujukan kesehatan masyarakat miskin',
      keterangan: 'Draft rencana komisi IV (Siap diajukan ke pimpinan).',
      rombongan: 'Ketua Komisi IV & 6 Anggota Dewan',
      koordinator: 'Dr. Rina Novita',
      estimasiBiaya: 38000000,
      noSuratTugas: '',
      noSPPD: '',
      status: 'Draft',
      catatanVerifikasi: 'Belum diajukan.',
      createdAt: now.toISOString(),
    },
    {
      id: 'lok-draft-demo-2',
      topik: 'Rencana Kunjungan Kerja Pengawasan Pendapatan Retribusi Daerah',
      komisi: 'Komisi II',
      masaSesi: 'Masa Persidangan III Tahun 2026',
      jenisPerjalanan: 'Kunjungan Kerja',
      tanggalBerangkat: '2026-09-28',
      tanggalMulai: '2026-09-29',
      tanggalSelesai: '2026-10-01',
      durasiHari: 3,
      provinsi: 'Jawa Barat',
      kabKota: 'Kota Bogor',
      instansiTujuan: 'Bapenda Kota Bogor',
      alamatLokus: 'Jl. Pemuda No. 31, Tanah Sareal, Kota Bogor',
      bidangKajian: 'Digitalisasi Pajak & Retribusi Parkir',
      maksudTujuan: 'Studi komparasi penerimaan Pajak Barang dan Jasa Tertentu (PBJT)',
      keterangan: 'Draft rencana komisi II.',
      rombongan: 'Hj. Siti Rahmah & Tim Komisi II',
      koordinator: 'Hj. Siti Rahmah, S.Pd',
      estimasiBiaya: 42000000,
      noSuratTugas: '',
      noSPPD: '',
      status: 'Draft',
      catatanVerifikasi: 'Draft dalam penyusunan.',
      createdAt: now.toISOString(),
    });
    setLocal(KEYS.LOKUS_KUNJUNGAN, list);
  }
};
