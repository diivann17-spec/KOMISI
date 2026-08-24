import {
    Archive,
    ArrowUpRight,
    Bell,
    Calendar,
    ChevronRight,
    MapPin,
    MessageSquare,
    Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KOMISI_COLORS } from '../constants/theme';
import {
    absensiStorage,
    arsipStorage,
    jadwalStorage,
    notifikasiStorage,
    rapatStorage,
    lokusKunjunganStorage,
    userStorage,
} from '../utils/storage';

const ICON_COLORS = {
  blue:    { icon: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  green:   { icon: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  purple:  { icon: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  red:     { icon: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ jadwal: 0, arsip: 0, absensi: 0, rapat: 0, notif: 0, lokus: 0 });
  const [todayAgenda, setTodayAgenda] = useState([]);
  const [lokusList, setLokusList] = useState([]);
  const user = userStorage.getCurrentUser();

  const loadData = () => {
    const today = new Date().toISOString().split('T')[0];
    const jList = jadwalStorage.getAll();
    const lList = lokusKunjunganStorage.getAll();
    setStats({
      jadwal: jList.length,
      arsip: arsipStorage.getAll().length,
      absensi: absensiStorage.getAll().length,
      rapat: rapatStorage.getAll().length,
      notif: notifikasiStorage.getUnread().length,
      lokus: lList.length,
    });
    setTodayAgenda(jList.filter((j) => j.tanggal === today));
    setLokusList(lList.slice(0, 3));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('kegiatan-data-changed', handleUpdate);
    return () => window.removeEventListener('kegiatan-data-changed', handleUpdate);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const STAT_CARDS = [
    { label: 'Total Jadwal',   value: stats.jadwal,  icon: Calendar,      color: 'blue',   path: '/jadwal' },
    { label: 'Lokus Kunjungan',value: stats.lokus,   icon: MapPin,        color: 'green',  path: '/lokus-kunjungan' },
    { label: 'Arsip Dokumen',  value: stats.arsip,   icon: Archive,       color: 'purple', path: '/arsip' },
    { label: 'Notif Baru',     value: stats.notif,   icon: Bell,          color: 'red',    path: '/notifikasi' },
  ];

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>

      {/* ── Hero Banner ── */}
      <div className="dashboard-hero" style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #172554 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        minHeight: 130
      }}>
        {/* Ambient Glow Effects */}
        <div style={{
          position: 'absolute', top: -30, right: 120, width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(37,99,235,0.25)', filter: 'blur(50px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: 60, width: 140, height: 140,
          borderRadius: '50%', background: 'rgba(234,179,8,0.15)', filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div className="dashboard-hero-copy" style={{ flex: 1, minWidth: 'min(100%, 200px)', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 99,
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
            fontSize: 11, fontWeight: 800, color: '#FCD34D', marginBottom: 10,
          }}>
            <Sparkles size={13} /> SIM Kegiatan Komisi DPRD
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 6, letterSpacing: '-0.3px', lineHeight: 1.25 }}>
            {greeting()}, {user?.displayName || 'Petugas Komisi'} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{user?.roleLabel || 'Sekretariat DPRD'}</span>
            <span>•</span>
            <span>
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </p>
        </div>

        <div className="dashboard-hero-agenda">
          <div className="hero-agenda-count">
            {todayAgenda.length}
          </div>
          <div className="hero-agenda-label">
            Agenda Hari Ini
          </div>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="stats-grid">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, path }) => {
          const c = ICON_COLORS[color];
          return (
            <div
              key={label}
              className="stat-card"
              onClick={() => navigate(path)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9,
                  background: c.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={19} color={c.icon} />
                </div>
                <ArrowUpRight size={15} color="var(--text-4)" />
              </div>
              <div>
                <div className="stat-value">
                  {value}
                </div>
                <div className="stat-label" style={{ marginTop: 4 }}>
                  {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Content Grid ── */}
      <div className="dashboard-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>

        {/* Agenda Hari Ini */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">📅 Agenda Hari Ini</div>
              <div className="card-sub">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            <button
              onClick={() => navigate('/jadwal')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 700, color: 'var(--blue)',
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'color 0.13s', padding: 0,
              }}
            >
              Semua <ChevronRight size={14} />
            </button>
          </div>

          <div className="card-body" style={{ flex: 1 }}>
            {todayAgenda.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-4)' }}>
                <Calendar size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Tidak ada agenda rapat terjadwal untuk hari ini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayAgenda.map((item) => {
                  const c = KOMISI_COLORS[item.komisi] || { bg: '#F1F5F9', text: '#475569', accent: '#64748B' };
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface2)',
                        borderLeft: `4px solid ${c.accent}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span className="badge" style={{ background: c.bg, color: c.text, fontSize: 10 }}>
                          {item.komisi}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>
                          {item.waktuMulai} – {item.waktuSelesai}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{item.judul}</div>
                      {item.lokasi && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {item.lokasi}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Akses Cepat Modul */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🚀 Akses Cepat Modul</div>
              <div className="card-sub">Pintas navigasi fitur SIM Komisi DPRD</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { title: 'Jadwal Komisi', sub: 'Agenda & Kalender', path: '/jadwal', bg: '#EFF6FF', color: '#2563EB' },
              { title: 'Arsip Surat', sub: 'Dokumen Digital', path: '/arsip', bg: '#ECFDF5', color: '#10B981' },
              { title: 'Ruangan & Fasilitas', sub: 'Booking & Status', path: '/fasilitas', bg: '#FEF3C7', color: '#D97706' },
              { title: 'Presensi Rapat', sub: 'Absensi Anggota', path: '/absensi', bg: '#F3E8FF', color: '#9333EA' },
            ].map((mod, idx) => (
              <div
                key={idx}
                onClick={() => navigate(mod.path)}
                style={{
                  background: mod.bg,
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'transform 0.12s ease',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
                className="hover:scale-[1.02]"
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: mod.color }}>{mod.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{mod.sub}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
