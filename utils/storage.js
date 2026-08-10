/**
 * AsyncStorage wrapper untuk CRUD operasi data
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// === STORAGE KEYS ===
const KEYS = {
  JADWAL: '@dprd_jadwal',
  ARSIP: '@dprd_arsip',
  ABSENSI: '@dprd_absensi',
  RAPAT: '@dprd_rapat',
  NOTIFIKASI: '@dprd_notifikasi',
  PERUBAHAN_JADWAL: '@dprd_perubahan_jadwal',
  USER: '@dprd_user',
};

// === ID GENERATOR ===
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// === DATE FORMATTING ===
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const bulan = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  return `${d.getDate()} ${bulan[d.getMonth()]}`;
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return timeStr;
};

export const formatDateTime = (isoStr) => {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return `${formatDate(isoStr)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// === FILE SIZE FORMATTING ===
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
};

// === DAY NAMES ===
export const getDayName = (dateStr) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const d = new Date(dateStr);
  return days[d.getDay()];
};

// === GENERIC CRUD ===
const getData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return [];
  }
};

const saveData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return false;
  }
};

const addItem = async (key, item) => {
  const data = await getData(key);
  const newItem = { ...item, id: item.id || generateId(), createdAt: new Date().toISOString() };
  data.unshift(newItem);
  await saveData(key, data);
  return newItem;
};

const updateItem = async (key, id, updates) => {
  const data = await getData(key);
  const index = data.findIndex((item) => item.id === id);
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
  await saveData(key, data);
  return data[index];
};

const deleteItem = async (key, id) => {
  const data = await getData(key);
  const filtered = data.filter((item) => item.id !== id);
  await saveData(key, filtered);
  return true;
};

const getItemById = async (key, id) => {
  const data = await getData(key);
  return data.find((item) => item.id === id) || null;
};

// === JADWAL ===
export const jadwalStorage = {
  getAll: () => getData(KEYS.JADWAL),
  getById: (id) => getItemById(KEYS.JADWAL, id),
  add: (jadwal) => addItem(KEYS.JADWAL, jadwal),
  update: (id, updates) => updateItem(KEYS.JADWAL, id, updates),
  delete: (id) => deleteItem(KEYS.JADWAL, id),
  getByKomisi: async (komisi) => {
    const data = await getData(KEYS.JADWAL);
    return data.filter((j) => j.komisi === komisi);
  },
  getByTanggal: async (tanggal) => {
    const data = await getData(KEYS.JADWAL);
    return data.filter((j) => j.tanggal === tanggal);
  },
};

// === ARSIP ===
export const arsipStorage = {
  getAll: () => getData(KEYS.ARSIP),
  getById: (id) => getItemById(KEYS.ARSIP, id),
  add: (arsip) => addItem(KEYS.ARSIP, arsip),
  update: (id, updates) => updateItem(KEYS.ARSIP, id, updates),
  delete: (id) => deleteItem(KEYS.ARSIP, id),
  getByKomisi: async (komisi) => {
    const data = await getData(KEYS.ARSIP);
    return data.filter((a) => a.komisi === komisi);
  },
  getByJenis: async (jenis) => {
    const data = await getData(KEYS.ARSIP);
    return data.filter((a) => a.jenisDoc === jenis);
  },
  search: async (query) => {
    const data = await getData(KEYS.ARSIP);
    const q = query.toLowerCase();
    return data.filter(
      (a) =>
        a.namaDoc?.toLowerCase().includes(q) ||
        a.nomorDoc?.toLowerCase().includes(q) ||
        a.keterangan?.toLowerCase().includes(q)
    );
  },
};

// === ABSENSI ===
export const absensiStorage = {
  getAll: () => getData(KEYS.ABSENSI),
  getById: (id) => getItemById(KEYS.ABSENSI, id),
  add: (absensi) => addItem(KEYS.ABSENSI, absensi),
  update: (id, updates) => updateItem(KEYS.ABSENSI, id, updates),
  delete: (id) => deleteItem(KEYS.ABSENSI, id),
  getByKegiatan: async (kegiatanId) => {
    const data = await getData(KEYS.ABSENSI);
    return data.filter((a) => a.kegiatanId === kegiatanId);
  },
};

// === RAPAT ===
export const rapatStorage = {
  getAll: () => getData(KEYS.RAPAT),
  getById: (id) => getItemById(KEYS.RAPAT, id),
  add: (rapat) => addItem(KEYS.RAPAT, rapat),
  update: (id, updates) => updateItem(KEYS.RAPAT, id, updates),
  delete: (id) => deleteItem(KEYS.RAPAT, id),
};

// === PERUBAHAN JADWAL ===
export const perubahanJadwalStorage = {
  getAll: () => getData(KEYS.PERUBAHAN_JADWAL),
  add: (perubahan) => addItem(KEYS.PERUBAHAN_JADWAL, perubahan),
  getByJadwal: async (jadwalId) => {
    const data = await getData(KEYS.PERUBAHAN_JADWAL);
    return data.filter((p) => p.jadwalId === jadwalId);
  },
};

// === NOTIFIKASI ===
export const notifikasiStorage = {
  getAll: () => getData(KEYS.NOTIFIKASI),
  add: (notif) => addItem(KEYS.NOTIFIKASI, notif),
  markAsRead: (id) => updateItem(KEYS.NOTIFIKASI, id, { dibaca: true }),
  markAllAsRead: async () => {
    const data = await getData(KEYS.NOTIFIKASI);
    const updated = data.map((item) => ({ ...item, dibaca: true }));
    await saveData(KEYS.NOTIFIKASI, updated);
    return true;
  },
  getUnread: async () => {
    const data = await getData(KEYS.NOTIFIKASI);
    return data.filter((n) => !n.dibaca);
  },
};

// === SEED DATA ===
export const seedMockData = async () => {
  const { MOCK_JADWAL, MOCK_ARSIP } = require('@/constants/data');
  
  const existingJadwal = await getData(KEYS.JADWAL);
  if (existingJadwal.length === 0) {
    await saveData(KEYS.JADWAL, MOCK_JADWAL);
  }

  const existingArsip = await getData(KEYS.ARSIP);
  if (existingArsip.length === 0) {
    await saveData(KEYS.ARSIP, MOCK_ARSIP);
  }
};

// === USER AUTH ===
export const userStorage = {
  getCurrentUser: async () => {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  saveCurrentUser: async (user) => {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Error saving current user:', error);
      return false;
    }
  },
  clearCurrentUser: async () => {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
      return true;
    } catch (error) {
      console.error('Error clearing current user:', error);
      return false;
    }
  },
};

// === CLEAR ALL ===
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

export const syncAppData = async () => {
  try {
    const [jadwal, arsip, absensi, rapat, notifikasi] = await Promise.all([
      getData(KEYS.JADWAL),
      getData(KEYS.ARSIP),
      getData(KEYS.ABSENSI),
      getData(KEYS.RAPAT),
      getData(KEYS.NOTIFIKASI),
    ]);

    const payload = {
      jadwal,
      arsip,
      absensi,
      rapat,
      notifikasi,
      syncedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem('@dprd_sync_payload', JSON.stringify(payload));
    return payload;
  } catch (error) {
    console.error('Error syncing data:', error);
    throw error;
  }
};
