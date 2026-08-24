import { useState, useEffect, useCallback } from 'react';
import { AlarmClock, Plus, Trash2, Bell, BellOff, CheckCircle2, Clock, CalendarDays, RefreshCw, X } from 'lucide-react';
import { pengingatStorage, jadwalStorage, formatDate, formatDateTime, generateId } from '../utils/storage';
import { logActivity } from '../utils/audit';

const REPEAT_OPTIONS = ['Tidak Ada', 'Setiap Hari', 'Setiap Minggu', 'Setiap Bulan'];

function getStatus(item) {
  const now = new Date();
  const due = new Date(`${item.tanggal}T${item.waktu}`);
  if (item.selesai) return 'selesai';
  if (due < now) return 'terlewat';
  return 'aktif';
}

function getCountdown(item) {
  const now = new Date();
  const due = new Date(`${item.tanggal}T${item.waktu}`);
  const diff = due - now;
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)} hari lagi`;
  if (h > 0) return `${h} jam ${m} menit lagi`;
  return `${m} menit lagi`;
}

function StatusBadge({ status }) {
  const map = {
    aktif: { label: 'Aktif', className: 'badge-green' },
    terlewat: { label: 'Terlewat', className: 'badge-red' },
    selesai: { label: 'Selesai', className: 'badge-gray' },
  };
  const s = map[status] || map.aktif;
  return <span className={`badge ${s.className}`}>{s.label}</span>;
}

export default function PengingatPage() {
  const [items, setItems] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);
  const [filterTab, setFilterTab] = useState('semua');
  const [showModal, setShowModal] = useState(false);
  const [now, setNow] = useState(new Date());

  const [form, setForm] = useState({
    judul: '', tanggal: new Date().toISOString().split('T')[0],
    waktu: '08:00', catatan: '', repeat: 'Tidak Ada',
  });

  const loadData = useCallback(() => {
    setItems(pengingatStorage.getAll());
    setJadwalList(jadwalStorage.getAll());
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('kegiatan-data-changed', loadData);
    return () => window.removeEventListener('kegiatan-data-changed', loadData);
  }, [loadData]);

  // Update countdown setiap menit
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Auto-fire browser notification saat waktu tiba
  useEffect(() => {
    const fired = JSON.parse(localStorage.getItem('sim_fired_alarms') || '[]');
    items.forEach(item => {
      if (item.selesai || fired.includes(item.id)) return;
      const due = new Date(`${item.tanggal}T${item.waktu}`);
      const diff = due - now;
      if (diff >= 0 && diff <= 60000) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`⏰ ${item.judul}`, {
            body: item.catatan || 'Pengingat jadwal DPRD',
            tag: item.id,
          });
        }
        window.dispatchEvent(new CustomEvent('new-notification', {
          detail: { id: item.id, judul: `⏰ ${item.judul}`, pesan: item.catatan || 'Pengingat telah tiba.' },
        }));
        localStorage.setItem('sim_fired_alarms', JSON.stringify([...fired, item.id]));
      }
    });
  }, [now, items]);

  const handleAddJadwalAlarm = async (jadwal) => {
    const tanggal = jadwal.tanggal;
    const waktu = jadwal.waktuMulai || '08:00';
    const existing = items.find(i => i.jadwalId === jadwal.id);
    if (existing) { alert('Pengingat untuk jadwal ini sudah ada.'); return; }
    const newItem = await pengingatStorage.add({
      id: generateId(),
      judul: `⏰ ${jadwal.judul}`,
      tanggal, waktu,
      catatan: `Kegiatan: ${jadwal.jenisKegiatan} — ${jadwal.lokasi}`,
      repeat: 'Tidak Ada',
      selesai: false,
      jadwalId: jadwal.id,
    });
    logActivity('TAMBAH_PENGINGAT', `Pengingat dibuat dari jadwal: ${jadwal.judul}`);
    setItems(pengingatStorage.getAll());
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) return;
    await pengingatStorage.add({ ...form, selesai: false, id: generateId() });
    logActivity('TAMBAH_PENGINGAT', `Pengingat manual: ${form.judul}`);
    setItems(pengingatStorage.getAll());
    setShowModal(false);
    setForm({ judul: '', tanggal: new Date().toISOString().split('T')[0], waktu: '08:00', catatan: '', repeat: 'Tidak Ada' });
  };

  const handleToggleSelesai = async (item) => {
    await pengingatStorage.update(item.id, { selesai: !item.selesai });
    setItems(pengingatStorage.getAll());
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pengingat ini?')) return;
    await pengingatStorage.delete(id);
    setItems(pengingatStorage.getAll());
  };

  const filtered = items.filter(item => {
    const s = getStatus(item);
    if (filterTab === 'aktif') return s === 'aktif';
    if (filterTab === 'terlewat') return s === 'terlewat';
    if (filterTab === 'selesai') return s === 'selesai';
    return true;
  });

  const aktifCount = items.filter(i => getStatus(i) === 'aktif').length;
  const terlewatCount = items.filter(i => getStatus(i) === 'terlewat').length;
  const selesaiCount = items.filter(i => getStatus(i) === 'selesai').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingJadwal = jadwalList.filter(j => j.tanggal >= todayStr).slice(0, 5);

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Pengingat & Alarm Otomatis
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>
            Kelola alarm jadwal dan pengingat kegiatan DPRD
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Tambah Pengingat
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Aktif', value: aktifCount, color: 'var(--success)', bg: '#D1FAE5', icon: Bell },
          { label: 'Terlewat', value: terlewatCount, color: 'var(--danger)', bg: '#FEE2E2', icon: BellOff },
          { label: 'Selesai', value: selesaiCount, color: 'var(--text-3)', bg: 'var(--surface)', icon: CheckCircle2 },
          { label: 'Total', value: items.length, color: 'var(--primary)', bg: '#DBEAFE', icon: AlarmClock },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Main List */}
        <div>
          <div className="filter-pills" style={{ marginBottom: 14 }}>
            {[['semua', 'Semua', items.length], ['aktif', 'Aktif', aktifCount], ['terlewat', 'Terlewat', terlewatCount], ['selesai', 'Selesai', selesaiCount]].map(([val, label, count]) => (
              <button key={val} className={`pill${filterTab === val ? ' active' : ''}`} onClick={() => setFilterTab(val)}>
                {label} {count > 0 && <span style={{ marginLeft: 4, background: filterTab === val ? 'rgba(255,255,255,0.25)' : 'var(--border)', borderRadius: 8, padding: '1px 6px', fontSize: 11 }}>{count}</span>}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <AlarmClock size={44} className="icon" />
                <h3>Belum ada pengingat</h3>
                <p>Tambahkan pengingat manual atau dari jadwal yang tersedia.</p>
              </div>
            ) : (
              filtered.map((item, idx) => {
                const status = getStatus(item);
                const countdown = getCountdown(item);
                const borderColor = status === 'aktif' ? 'var(--success)' : status === 'terlewat' ? 'var(--danger)' : 'var(--border)';
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    borderLeft: `4px solid ${borderColor}`,
                    opacity: item.selesai ? 0.6 : 1,
                  }}>
                    <button
                      title={item.selesai ? 'Tandai belum selesai' : 'Tandai selesai'}
                      onClick={() => handleToggleSelesai(item)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, marginTop: 2, color: item.selesai ? 'var(--success)' : 'var(--border)' }}
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textDecoration: item.selesai ? 'line-through' : 'none' }}>
                          {item.judul}
                        </span>
                        <StatusBadge status={status} />
                        {item.repeat !== 'Tidak Ada' && (
                          <span className="badge badge-blue" style={{ fontSize: 10 }}>
                            <RefreshCw size={9} style={{ marginRight: 3 }} />{item.repeat}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarDays size={12} /> {formatDate(item.tanggal)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {item.waktu} WIB
                        </span>
                        {countdown && (
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>⏱ {countdown}</span>
                        )}
                      </div>
                      {item.catatan && (
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{item.catatan}</div>
                      )}
                    </div>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleDelete(item.id)} title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar: Jadwal Mendatang */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Jadwal Mendatang
          </h3>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {upcomingJadwal.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Tidak ada jadwal mendatang.</div>
            ) : (
              upcomingJadwal.map((jadwal, idx) => {
                const sudahAda = items.some(i => i.jadwalId === jadwal.id);
                return (
                  <div key={jadwal.id} style={{
                    padding: '12px 16px',
                    borderBottom: idx < upcomingJadwal.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{jadwal.judul}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
                      {formatDate(jadwal.tanggal)} — {jadwal.waktuMulai}
                    </div>
                    {sudahAda ? (
                      <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Ada Pengingat</span>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleAddJadwalAlarm(jadwal)}>
                        <Bell size={12} /> Set Alarm
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Tambah */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><AlarmClock size={18} style={{ marginRight: 8 }} />Tambah Pengingat Baru</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 0 4px' }}>
              <div>
                <label className="form-label">Judul Pengingat</label>
                <input className="form-input" placeholder="mis. Rapat Komisi I Hari Ini" value={form.judul}
                  onChange={e => setForm(p => ({ ...p, judul: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Tanggal</label>
                  <input className="form-input" type="date" value={form.tanggal}
                    onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Waktu</label>
                  <input className="form-input" type="time" value={form.waktu}
                    onChange={e => setForm(p => ({ ...p, waktu: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="form-label">Ulangi</label>
                <select className="form-select" value={form.repeat} onChange={e => setForm(p => ({ ...p, repeat: e.target.value }))}>
                  {REPEAT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Catatan (opsional)</label>
                <textarea className="form-input" rows={2} placeholder="Keterangan tambahan..." value={form.catatan}
                  onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Plus size={15} /> Simpan Pengingat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
