import {
  Archive,
  ArrowUpRight,
  Bell,
  Calendar,
  ChevronRight,
  MapPin,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DAFTAR_KOMISI, KOMISI_COLORS } from '../constants/theme';
import {
  absensiStorage,
  arsipStorage,
  jadwalStorage,
  notifikasiStorage,
  rapatStorage,
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
  const [stats, setStats] = useState({ jadwal: 0, arsip: 0, absensi: 0, rapat: 0, notif: 0 });
  const [todayAgenda, setTodayAgenda] = useState([]);
  const user = userStorage.getCurrentUser();

  const loadData = () => {
    const today = new Date().toISOString().split('T')[0];
    const jList = jadwalStorage.getAll();
    setStats({
      jadwal: jList.length,
      arsip: arsipStorage.getAll().length,
      absensi: absensiStorage.getAll().length,
      rapat: rapatStorage.getAll().length,
      notif: notifikasiStorage.getUnread().length,
    });
    setTodayAgenda(jList.filter((j) => j.tanggal === today));
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
    { label: 'Arsip Dokumen',  value: stats.arsip,   icon: Archive,       color: 'green',  path: '/arsip' },
    { label: 'Data Rapat',     value: stats.rapat,   icon: MessageSquare, color: 'purple', path: '/rapat' },
    { label: 'Notif Baru',     value: stats.notif,   icon: Bell,          color: 'red',    path: '/notifikasi' },
  ];

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #172554 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
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
        gap: 16
      }}>
        {/* decorative ambient glow */}
        <div style={{
          position: 'absolute', top: -30, right: 120, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(37,99,235,0.2)', filter: 'blur(45px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: 60, width: 130, height: 130,
          borderRadius: '50%', background: 'rgba(234,179,8,0.12)', filter: 'blur(35px)',
          pointerEvents: 'none',
        }} />

        <div style={{ flex: 1, minWidth: 260, position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 99,
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
            fontSize: 11, fontWeight: 700, color: '#FCD34D', marginBottom: 12,
          }}>
            <Sparkles size={13} /> SIM Kegiatan Komisi DPRD
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 6, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {greeting()}, {user?.displayName || 'Petugas Komisi'} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, margin: 0 }}>
            {user?.roleLabel || 'Petugas Komisi'} &nbsp;•&nbsp;{' '}
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius)',
          padding: '14px 22px',
          textAlign: 'center',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#FCD34D', lineHeight: 1 }}>
            {todayAgenda.length}
          </div>
          <div style={{ fontSize: 11, color: '#E2E8F0', marginTop: 4, fontWeight: 600, letterSpacing: 0.2 }}>
            Agenda hari ini
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>

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

          <div style={{ padding: '8px 18px 16px', flex: 1 }}>
            {todayAgenda.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 12px' }}>
                <Calendar size={36} className="icon" />
                <h3>Tidak ada agenda hari ini</h3>
                <p>Tambahkan jadwal kegiatan melalui menu Jadwal.</p>
              </div>
            ) : (
              todayAgenda.map((item) => {
                const color = KOMISI_COLORS[item.komisi] || { accent: '#2563EB', bg: 'var(--blue-s)', text: 'var(--blue)' };
                return (
                  <div key={item.id} className="agenda-item">
                    <div className="agenda-time">{item.waktuMulai}</div>
                    <div className="agenda-dot" style={{ background: color.accent }} />
                    <div className="agenda-body">
                      <div className="agenda-title">{item.judul}</div>
                      <div className="agenda-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={11} /> {item.lokasi}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                            background: color.bg, color: color.text,
                          }}
                        >
                          {item.komisi}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Komisi Quick Overview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">🏛️ Komisi DPRD</div>
              <div className="card-sub">Bidang &amp; jumlah agenda</div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', flex: 1 }}>
            {DAFTAR_KOMISI.map((k) => {
              const c = KOMISI_COLORS[k.nama] || {};
              const count = jadwalStorage.getAll().filter((j) => j.komisi === k.nama).length;
              return (
                <div
                  key={k.id}
                  onClick={() => navigate('/jadwal')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: c.bg || 'var(--surface2)', color: c.text || 'var(--text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 11, flexShrink: 0,
                  }}>
                    {k.nama.split(' ')[1]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{k.nama}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {k.bidang}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                    background: c.bg || 'var(--surface2)', color: c.accent || 'var(--blue)', flexShrink: 0,
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
