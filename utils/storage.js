import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection
} from 'firebase/firestore';
import { db } from './firebase';

const KEYS = {
  JADWAL: '@dprd_jadwal',
  ARSIP: '@dprd_arsip',
  ABSENSI: '@dprd_absensi',
  RAPAT: '@dprd_rapat',
  NOTIFIKASI: '@dprd_notifikasi',
  PERUBAHAN_JADWAL: '@dprd_perubahan_jadwal',
  USER: '@dprd_user',
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

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
  const bulan = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}.${d.getMinutes().toString().padStart(2, '0')}`;
};

const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return [];
  }
};

const setData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error writing ${key}:`, e);
    return false;
  }
};

const createStorage = (key, collectionName) => ({
  getAll: async () => {
    return await getData(key);
  },

  getById: async (id) => {
    const data = await getData(key);
    return data.find((item) => item.id === id) || null;
  },

  add: async (item) => {
    const data = await getData(key);
    const newItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    data.unshift(newItem);
    await setData(key, data);

    try {
      if (db) {
        await addDoc(collection(db, collectionName), newItem);
      }
    } catch (err) {
      console.warn(`[Firebase Firestore Sync Warning]:`, err);
    }

    return newItem;
  },

  update: async (id, updates) => {
    const data = await getData(key);
    const index = data.findIndex((item) => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
      await setData(key, data);
      return data[index];
    }
    return null;
  },

  delete: async (id) => {
    const data = await getData(key);
    const filtered = data.filter((item) => item.id !== id);
    await setData(key, filtered);
    return true;
  },

  search: async (queryStr) => {
    const data = await getData(key);
    const q = queryStr.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some(
        (val) => typeof val === 'string' && val.toLowerCase().includes(q)
      )
    );
  },
});

export const jadwalStorage = createStorage(KEYS.JADWAL, 'jadwal');
export const arsipStorage = createStorage(KEYS.ARSIP, 'arsip');
export const absensiStorage = createStorage(KEYS.ABSENSI, 'absensi');
export const rapatStorage = createStorage(KEYS.RAPAT, 'rapat');

// ----------------------------------------------------------
// GPS Helper
// ----------------------------------------------------------
/**
 * Get current geographic position using the browser Geolocation API.
 * Returns a Promise that resolves to an object { latitude, longitude }.
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};

// ----------------------------------------------------------
// Offline Attendance IndexedDB Helper
// ----------------------------------------------------------
const OFFLINE_DB_NAME = 'attendanceDB';
const OFFLINE_STORE_NAME = 'pending';

const openOfflineDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const offlineAttendanceDB = {
  addPending: async (record) => {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const request = store.add({ ...record, createdAt: new Date().toISOString() });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },
  getAllPending: async () => {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, 'readonly');
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  clearPending: async () => {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },
};




export const notifikasiStorage = {
  ...createStorage(KEYS.NOTIFIKASI, 'notifikasi'),
  getUnread: async () => {
    const data = await getData(KEYS.NOTIFIKASI);
    return data.filter((item) => !item.dibaca);
  },
  markAllAsRead: async () => {
    const data = await getData(KEYS.NOTIFIKASI);
    const updated = data.map((item) => ({ ...item, dibaca: true }));
    await setData(KEYS.NOTIFIKASI, updated);
    return true;
  },
  markAsRead: async (id) => {
    const data = await getData(KEYS.NOTIFIKASI);
    const index = data.findIndex((item) => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], dibaca: true, updatedAt: new Date().toISOString() };
      await setData(KEYS.NOTIFIKASI, data);
      return data[index];
    }
    return null;
  },
};

export const userStorage = {
  getCurrentUser: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.USER);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      return null;
    }
  },
  setCurrentUser: async (user) => {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
      return true;
    } catch (e) {
      return false;
    }
  },
  clearCurrentUser: async () => {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
      return true;
    } catch (e) {
      return false;
    }
  },
};

export const seedMockData = async () => {
  const existingUser = await userStorage.getCurrentUser();
  if (!existingUser) {
    await userStorage.setCurrentUser({
      id: 'u-admin-1',
      username: 'admin',
      displayName: 'Admin Sekretariat',
      role: 'sekretariat',
      roleLabel: 'Admin / Sekretariat DPRD',
    });
  }
};
