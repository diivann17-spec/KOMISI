import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Archive, Calendar, ClipboardCheck,
  MessageSquare, Bell, Settings, LogOut, Scale,
  Mail, Building, Users, DollarSign, BarChart
} from 'lucide-react';
import { userStorage } from '../utils/storage';
import { useState, useEffect } from 'react';

const NAV_ALL = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/surat',        icon: Mail,              label: 'Surat Menyurat' },
  { to: '/jadwal',       icon: Calendar,         label: 'Jadwal Kegiatan' },
  { to: '/arsip',        icon: Archive,           label: 'Arsip Dokumen' },
  { to: '/absensi',      icon: ClipboardCheck,    label: 'Presensi & Absensi' },
  { to: '/rapat',        icon: MessageSquare,     label: 'Rapat & Notulen' },
  { to: '/fasilitas',    icon: Building,          label: 'Ruangan & Fasilitas' },
  { to: '/tamu',         icon: Users,             label: 'Tamu & Narasumber' },
  { to: '/anggaran',     icon: DollarSign,        label: 'Anggaran' },
  { to: '/laporan',      icon: BarChart,          label: 'Laporan & Statistik' },
  { to: '/notifikasi',   icon: Bell,              label: 'Notifikasi', badge: true },
  { to: '/menu',         icon: Settings,          label: 'Pengaturan' },
];

const NAV_PIMPINAN = [
  { to: '/',             icon: LayoutDashboard, label: 'Executive Dashboard' },
  { to: '/laporan',      icon: BarChart,          label: 'Laporan & Statistik' },
  { to: '/absensi',      icon: ClipboardCheck,    label: 'Monitoring Kuorum' },
  { to: '/surat',        icon: Mail,              label: 'Disposisi Surat' },
  { to: '/jadwal',       icon: Calendar,         label: 'Kalender Sidang & Rapat' },
  { to: '/rapat',        icon: MessageSquare,     label: 'Risalah Rapat' },
  { to: '/arsip',        icon: Archive,           label: 'Arsip Dokumen' },
  { to: '/anggaran',     icon: DollarSign,        label: 'Monitoring Anggaran' },
  { to: '/notifikasi',   icon: Bell,              label: 'Notifikasi Pimpinan', badge: true },
  { to: '/menu',         icon: Settings,          label: 'Info Akses' },
];

export default function Sidebar({ unreadCount = 0 }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(userStorage.getCurrentUser());
  }, []);

  const isPimpinan = user?.role === 'pimpinan';
  const navList = isPimpinan ? NAV_PIMPINAN : NAV_ALL;

  const handleLogout = () => {
    if (confirm('Keluar dari sistem?')) {
      userStorage.clearCurrentUser();
      navigate('/login');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <div className="sidebar-brand-icon">
            <Scale size={18} />
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">SIM Kegiatan DPRD</div>
            <div className="sidebar-brand-sub">
              {isPimpinan ? 'Portal Ketua / Pimpinan' : 'Komisi I–IV • Kab/Kota'}
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">{isPimpinan ? 'Menu Eksekutif Pimpinan' : 'Menu Utama'}</div>
        {navList.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            {label}
            {badge && unreadCount > 0 && (
              <span className="nav-badge">{unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={handleLogout} title="Klik untuk keluar">
          <div className="user-avatar">
            {(user?.displayName || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name truncate">{user?.displayName || 'Admin'}</div>
            <div className="user-role">{user?.roleLabel || 'Sekretariat DPRD'}</div>
          </div>
          <LogOut size={15} color="#64748B" />
        </div>
      </div>
    </aside>
  );
}
