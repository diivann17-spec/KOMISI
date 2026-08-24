import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DarkModeToggle from './components/DarkModeToggle';
import AbsensiPage from './pages/Absensi';
import ArsipPage from './pages/Arsip';
import Dashboard from './pages/Dashboard';
import JadwalPage from './pages/Jadwal';
import LoginPage from './pages/Login';
import MenuPage from './pages/Menu';
import NotifikasiPage from './pages/Notifikasi';
import PresensiPublicPage from './pages/PresensiPublic';
import VerifikasiTtdPublicPage from './pages/VerifikasiTtdPublic';
import RapatPage from './pages/Rapat';
import SuratPage from './pages/Surat';
import FasilitasPage from './pages/Fasilitas';
import TamuPage from './pages/Tamu';
import AnggaranPage from './pages/Anggaran';
import LaporanPage from './pages/Laporan';
import PengingatPage from './pages/Pengingat';
import PesanPage from './pages/Pesan';
import VotingPage from './pages/Voting';
import LegislasiPage from './pages/Legislasi';
import { notifikasiStorage, pengingatStorage, jadwalStorage, seedMockData, userStorage } from './utils/storage';

function ProtectedLayout() {
  let user = userStorage.getCurrentUser();
  if (!user) {
    seedMockData();
    user = userStorage.getCurrentUser();
  }

  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshUnread = () => setUnreadCount(notifikasiStorage.getUnread().length);

  useEffect(() => {
    seedMockData();
    refreshUnread();
    // Tutup sidebar saat navigasi di mobile
    setSidebarOpen(false);
  }, [location]);

  // Background alarm checker — runs every 60 seconds
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const fired = JSON.parse(localStorage.getItem('sim_fired_alarms') || '[]');

      // Cek pengingat manual
      const reminders = pengingatStorage.getAll();
      reminders.forEach(item => {
        if (item.selesai || fired.includes(item.id)) return;
        const due = new Date(`${item.tanggal}T${item.waktu}`);
        const diff = due - now;
        if (diff >= 0 && diff <= 60000) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`⏰ ${item.judul}`, { body: item.catatan || 'Pengingat jadwal DPRD', tag: item.id });
          }
          window.dispatchEvent(new CustomEvent('new-notification', {
            detail: { id: item.id, judul: `⏰ ${item.judul}`, pesan: item.catatan || 'Pengingat telah tiba.' },
          }));
          localStorage.setItem('sim_fired_alarms', JSON.stringify([...fired, item.id]));
        }
      });

      // Cek jadwal H-0 (30 menit sebelum mulai)
      const jadwalFired = JSON.parse(localStorage.getItem('sim_fired_jadwal') || '[]');
      const jadwals = jadwalStorage.getAll();
      jadwals.forEach(j => {
        if (!j.tanggal || !j.waktuMulai) return;
        const alarmKey = `jadwal_${j.id}`;
        if (jadwalFired.includes(alarmKey)) return;
        const due = new Date(`${j.tanggal}T${j.waktuMulai}`);
        const diff = due - now;
        if (diff >= 0 && diff <= 1800000) { // 30 menit
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`📅 Segera Dimulai: ${j.judul}`, { body: `${j.lokasi} — ${j.waktuMulai} WIB`, tag: alarmKey });
          }
          window.dispatchEvent(new CustomEvent('new-notification', {
            detail: { id: alarmKey, judul: `📅 Segera Dimulai: ${j.judul}`, pesan: `${j.lokasi} — ${j.waktuMulai} WIB` },
          }));
          localStorage.setItem('sim_fired_jadwal', JSON.stringify([...jadwalFired, alarmKey]));
        }
      });
    };

    checkAlarms();
    const interval = setInterval(checkAlarms, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleStorageUpdate = () => refreshUnread();
    const handleNewNotification = (event) => {
      const item = event.detail;
      if (!item) return;
      setToast({
        judul: item.judul || 'Pemberitahuan baru',
        pesan: item.pesan || 'Ada aktivitas baru',
        id: item.id || Date.now(),
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(item.judul || 'Pemberitahuan baru', {
          body: item.pesan || 'Ada aktivitas baru di sistem.',
          tag: item.id || 'notif-new',
        });
      }
    };

    window.addEventListener('kegiatan-data-changed', handleStorageUpdate);
    window.addEventListener('new-notification', handleNewNotification);

    return () => {
      window.removeEventListener('kegiatan-data-changed', handleStorageUpdate);
      window.removeEventListener('new-notification', handleNewNotification);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return { title: 'Dashboard Utama', sub: 'Ringkasan kegiatan & statistik Komisi DPRD' };
      case '/jadwal': return { title: 'Jadwal Kegiatan Komisi', sub: 'Manajemen waktu & agenda Komisi I–IV' };
      case '/arsip': return { title: 'Arsip Dokumen Digital', sub: 'Repositori surat masuk, keluar & berkas fisik' };
      case '/absensi': return { title: 'Presensi & Absensi', sub: 'Rekapitulasi kehadiran anggota DPRD' };
      case '/rapat': return { title: 'Modul Rapat & Notulen', sub: 'Catatan hasil rapat & risalah komisi' };
      case '/notifikasi': return { title: 'Notifikasi', sub: 'Riwayat aktivitas & pemberitahuan' };
      case '/menu': return { title: 'Pengaturan', sub: 'Pengaturan akun & aplikasi' };
      case '/surat': return { title: 'Manajemen Surat', sub: 'Pengelolaan surat masuk, keluar & disposisi' };
      case '/fasilitas': return { title: 'Ruangan & Fasilitas', sub: 'Peminjaman ruangan dan inventaris' };
      case '/tamu': return { title: 'Tamu & Narasumber', sub: 'Manajemen undangan eksternal' };
      case '/anggaran': return { title: 'Manajemen Anggaran', sub: 'Pemantauan alokasi dan realisasi biaya' };
      case '/laporan': return { title: 'Laporan & Dashboard', sub: 'Statistik eksekutif dan export data' };
      case '/pengingat': return { title: 'Pengingat & Alarm Otomatis', sub: 'Kelola alarm jadwal dan pengingat kegiatan DPRD' };
      case '/pesan': return { title: 'Pesan Internal & Disposisi', sub: 'Komunikasi internal anggota DPRD dan sekretariat' };
      case '/voting': return { title: 'Voting & Pengambilan Suara', sub: 'Sesi voting digital per agenda rapat dan sidang komisi' };
      case '/legislasi': return { title: 'Produk Legislasi', sub: 'Tracking Perda, Raperda & Pansus — dari inisiasi hingga pengesahan' };
      default: return { title: 'SIM Kegiatan DPRD', sub: '' };
    }
  };

  const pageMeta = getTitle();

  return (
    <div className="app-shell">
      <Sidebar
        unreadCount={unreadCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="topbar-title">{pageMeta.title}</div>
              {pageMeta.sub && <div className="topbar-sub">{pageMeta.sub}</div>}
            </div>
          </div>
          <div className="topbar-actions">
            <DarkModeToggle />
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-sm shadow-sm">
                {(user?.displayName || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.displayName || 'Admin'}</div>
                <div className="text-[10px] text-slate-400">{user?.roleLabel || 'Sekretariat DPRD'}</div>
              </div>
            </div>
          </div>
        </header>

        {toast && (
          <div style={{
            position: 'fixed',
            top: 18,
            right: 22,
            zIndex: 2000,
            width: 320,
            background: '#111827',
            color: '#fff',
            borderRadius: 14,
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            padding: '14px 16px',
            borderLeft: '4px solid #10B981',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{toast.judul}</div>
            <div style={{ fontSize: 12, color: '#E5E7EB', lineHeight: 1.4 }}>{toast.pesan}</div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jadwal" element={<JadwalPage />} />
          <Route path="/arsip" element={<ArsipPage />} />
          <Route path="/absensi" element={<AbsensiPage />} />
          <Route path="/rapat" element={<RapatPage />} />
          <Route path="/notifikasi" element={<NotifikasiPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/surat" element={<SuratPage />} />
          <Route path="/fasilitas" element={<FasilitasPage />} />
          <Route path="/tamu" element={<TamuPage />} />
          <Route path="/anggaran" element={<AnggaranPage />} />
          <Route path="/laporan" element={<LaporanPage />} />
          <Route path="/pengingat" element={<PengingatPage />} />
          <Route path="/pesan" element={<PesanPage />} />
          <Route path="/voting" element={<VotingPage />} />
          <Route path="/legislasi" element={<LegislasiPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    seedMockData();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/presensi" element={<PresensiPublicPage />} />
        <Route path="/verifikasi-ttd" element={<VerifikasiTtdPublicPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
