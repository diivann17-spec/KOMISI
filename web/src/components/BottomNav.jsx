import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Mail, ClipboardCheck, Settings } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { to: '/',          label: 'Beranda',  icon: LayoutDashboard },
    { to: '/jadwal',     label: 'Jadwal',   icon: Calendar },
    { to: '/surat',      label: 'Surat',    icon: Mail },
    { to: '/absensi',    label: 'Presensi', icon: ClipboardCheck },
    { to: '/menu',       label: 'Pengaturan', icon: Settings },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
