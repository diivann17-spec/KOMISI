import {
    addDoc,
    collection,
    onSnapshot,
    query,
    orderBy,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

const KEYS = {
  JADWAL: 'jadwal',
  ARSIP: 'arsip',
  ABSENSI: 'absensi',
  RAPAT: 'rapat',
  NOTIFIKASI: 'notifikasi',
  USER: 'user',
  PENGINGAT: 'pengingat',
  PESAN: 'pesan',
  VOTING: 'voting',
  LEGISLASI: 'legislasi',
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
['absensi', 'jadwal', 'notifikasi', 'arsip', 'rapat', 'pengingat', 'pesan', 'voting', 'legislasi'].forEach(initFirestoreListener);

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
export const pengingatStorage = makeFirestoreStorage(KEYS.PENGINGAT);
export const pesanStorage     = makeFirestoreStorage(KEYS.PESAN);
export const votingStorage    = makeFirestoreStorage(KEYS.VOTING);
export const legislasiStorage = makeFirestoreStorage(KEYS.LEGISLASI);

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

    localStorage.setItem('sim_seeded', 'true');
  }
};
