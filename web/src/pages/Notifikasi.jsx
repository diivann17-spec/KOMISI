import { useState, useEffect } from 'react';
import { notifikasiStorage, formatDateTime } from '../utils/storage';
import { Bell, CheckCheck, Trash2, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { logActivity } from '../utils/audit';

const INITIAL_SECURITY_ALERTS = [
  {
    id: 'FRAUD-101',
    judul: '🚨 Deteksi Percobaan Absensi Ganda',
    pesan: 'Sistem menolak percobaan absensi 2x berturut-turut pada kegiatan "Rapat Komisi I" dari IP: 182.253.xx.xx',
    tipe: 'fraud',
    level: 'Peringatan Sedang',
    dibaca: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'FRAUD-102',
    judul: '⚠️ Presensi Di Luar Radius Lokasi (GPS)',
    pesan: 'Percobaan presensi pengguna Ahmad gagal karena jarak 14.2 km dari lokasi kegiatan.',
    tipe: 'fraud',
    level: 'Peringatan Tinggi',
    dibaca: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export default function NotifikasiPage() {
  const [notifList, setNotifList] = useState([]);
  const [filterTab, setFilterTab] = useState('semua');

  const loadData = () => {
    const list = notifikasiStorage.getAll();
    // Combine with security alerts
    const merged = [...INITIAL_SECURITY_ALERTS, ...list];
    setNotifList(merged);
  };

  useEffect(loadData, []);

  const handleMarkAllRead = () => {
    notifikasiStorage.markAllRead();
    setNotifList(prev => prev.map(n => ({ ...n, dibaca: true })));
  };

  const handleDelete = (id) => {
    notifikasiStorage.delete(id);
    setNotifList(prev => prev.filter(n => n.id !== id));
  };

  const handleSimulateFraud = () => {
    const newAlert = {
      id: `FRAUD-${Date.now().toString().slice(-4)}`,
      judul: '🚨 Peringatan Deteksi Fraud Baru',
      pesan: 'Percobaan scan QR expired atau pemalsuan koordinat GPS terdeteksi oleh sistem.',
      tipe: 'fraud',
      level: 'Peringatan Tinggi',
      dibaca: false,
      createdAt: new Date().toISOString()
    };

    setNotifList([newAlert, ...notifList]);
    logActivity('FRAUD_ALERT_SIMULATION', 'Memicu peringatan deteksi aktivitas tidak wajar');
    alert('⚠️ Peringatan Deteksi Aktivitas Tidak Wajar (Fraud) telah ditambahkan ke log notifikasi!');
  };

  const filteredNotif = notifList.filter(item => {
    if (filterTab === 'fraud') return item.tipe === 'fraud';
    if (filterTab === 'umum') return item.tipe !== 'fraud';
    return true;
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>Pemberitahuan &amp; Peringatan</h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>Notification Alert, Deteksi Fraud, &amp; Log Aktivitas Sistem</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleSimulateFraud}>
            <AlertTriangle size={16} color="var(--warning)" /> Simulasi Deteksi Fraud
          </button>
          {notifList.length > 0 && (
            <button className="btn btn-secondary" onClick={handleMarkAllRead}>
              <CheckCheck size={16} /> Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      <div className="filter-pills" style={{ marginBottom: 16 }}>
        <button className={`pill${filterTab === 'semua' ? ' active' : ''}`} onClick={() => setFilterTab('semua')}>
          <Bell size={13} /> Semua ({notifList.length})
        </button>
        <button className={`pill${filterTab === 'fraud' ? ' active' : ''}`} onClick={() => setFilterTab('fraud')}>
          <ShieldAlert size={13} /> Keamanan ({notifList.filter(n => n.tipe === 'fraud').length})
        </button>
        <button className={`pill${filterTab === 'umum' ? ' active' : ''}`} onClick={() => setFilterTab('umum')}>
          <Bell size={13} /> Umum
        </button>
      </div>

      <div className="card">
        {filteredNotif.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} className="icon" />
            <h3>Belum ada pemberitahuan</h3>
            <p>Pemberitahuan baru akan muncul di sini.</p>
          </div>
        ) : (
          <div>
            {filteredNotif.map(item => {
              const isFraud = item.tipe === 'fraud';
              return (
                <div
                  key={item.id}
                  className={`notif-item ${item.dibaca ? 'read' : 'unread'}`}
                  style={isFraud ? { borderLeft: '4px solid var(--red)', background: item.dibaca ? 'var(--card)' : '#FEF2F2' } : {}}
                >
                  <div className={`notif-dot ${item.dibaca ? 'read' : ''}`} style={isFraud ? { background: 'var(--red)' } : {}} />
                  <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: isFraud ? 'var(--danger)' : 'var(--text)' }}>
                      {item.judul}
                    </span>
                    {isFraud && <span className="badge badge-red" style={{ fontSize: 10 }}>SECURITY ALERT</span>}
                  </div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.4 }}>
                      {item.pesan}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm btn-icon"
                    title="Hapus"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
