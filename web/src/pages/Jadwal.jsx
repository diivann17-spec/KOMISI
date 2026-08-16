import { useState, useEffect } from 'react';
import { jadwalStorage, notifikasiStorage, formatDate } from '../utils/storage';
import { DAFTAR_KOMISI, KOMISI_COLORS } from '../constants/theme';
import { Plus, X, Calendar, MapPin, Clock, Edit2, Trash2, QrCode, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { logActivity } from '../utils/audit';

const JENIS = ['Rapat Komisi','Rapat Kerja','Rapat Dengar Pendapat','Kunjungan Kerja','Audiensi','Reses','Kegiatan Internal','Lainnya'];
const STATUS_BADGE = { aktif: 'badge-blue', selesai: 'badge-green', batal: 'badge-red', tunda: 'badge-yellow' };
const EMPTY = { judul:'', tanggal:'', waktuMulai:'08:00', waktuSelesai:'12:00', lokasi:'Ruang Rapat Komisi I', komisi:'Komisi I', jenisKegiatan:'Rapat Komisi', keterangan:'', alasanPerubahan:'', status:'aktif' };

export default function JadwalPage() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [qrModalItem, setQrModalItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const load = () => {
    let all = jadwalStorage.getAll();
    if (filter !== 'Semua') all = all.filter(j => j.komisi === filter);
    setList(all.sort((a, b) => a.tanggal < b.tanggal ? 1 : -1));
  };

  useEffect(load, [filter]);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (item) => { setForm({ ...item, alasanPerubahan: item.alasanPerubahan || '' }); setEditId(item.id); setShowModal(true); };

  const handleSave = () => {
    if (!form.judul.trim() || !form.tanggal) return alert('Judul dan tanggal wajib diisi.');
    if (editId) {
      jadwalStorage.update(editId, form);
      logActivity('JADWAL_UPDATE', `Memperbarui kegiatan "${form.judul}". Alasan: ${form.alasanPerubahan || 'Perubahan rutin'}`);
    } else {
      const created = jadwalStorage.add(form);
      logActivity('JADWAL_ADD', `Membuat kegiatan baru "${form.judul}" untuk ${form.komisi}`);
      notifikasiStorage.add({
        judul: 'Jadwal baru ditambahkan',
        pesan: `"${form.judul}" pada ${formatDate(form.tanggal)}.`,
        tipe: 'jadwal', dibaca: false, createdAt: new Date().toISOString(),
      });
    }
    setShowModal(false);
    load();
  };

  const handleDelete = (item) => {
    if (confirm(`Hapus "${item.judul}"?`)) {
      jadwalStorage.delete(item.id);
      logActivity('JADWAL_DELETE', `Menghapus kegiatan: ${item.judul}`);
      load();
    }
  };

  const grouped = list.reduce((acc, item) => {
    const key = item.tanggal;
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>Jadwal Kegiatan Komisi</h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>Kelola agenda rapat, perubahan jadwal, &amp; QR Absensi Komisi I–IV</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Tambah Jadwal
        </button>
      </div>

      {/* Filter */}
      <div className="filter-pills mb-4">
        {['Semua', ...DAFTAR_KOMISI.map(k => k.nama)].map(f => (
          <button key={f} className={`pill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} className="empty-state-icon" />
          <h3>Belum ada jadwal</h3>
          <p>Klik "Tambah Jadwal" untuk membuat kegiatan baru.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-6">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              {formatDate(date)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(item => {
                const c = KOMISI_COLORS[item.komisi] || { bg: '#F1F5F9', text: '#475569', accent: '#64748B' };
                const today = new Date().toISOString().split('T')[0];
                const isToday = item.tanggal === today;
                return (
                  <div key={item.id} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', borderLeft: `4px solid ${c.accent}` }}>
                    <div style={{ flex: 1 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: c.bg, color: c.text }}>{item.komisi}</span>
                        <span className={`badge ${STATUS_BADGE[item.status] || 'badge-blue'}`}>{item.status}</span>
                        {isToday && <span className="badge badge-yellow">Hari Ini</span>}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.judul}</div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' }}>
                          <Clock size={12} /> {item.waktuMulai}–{item.waktuSelesai}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' }}>
                          <MapPin size={12} /> {item.lokasi || '—'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' }}>
                          <Calendar size={12} /> {item.jenisKegiatan}
                        </span>
                      </div>
                      {item.alasanPerubahan && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>
                          <AlertCircle size={12} /> Catatan Perubahan: {item.alasanPerubahan}
                        </div>
                      )}
                      {item.keterangan && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{item.keterangan}</div>}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-secondary btn-sm" title="Tampilkan QR Absensi" onClick={() => setQrModalItem(item)}>
                        <QrCode size={14} /> QR Absensi
                      </button>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(item)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Modal QR Code Absensi (Fitur 4) */}
      {qrModalItem && (
        <div className="modal-overlay" onClick={() => setQrModalItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
            <div className="modal-header">
              <h3 className="modal-title">📱 QR Code Absensi Kegiatan</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setQrModalItem(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{qrModalItem.judul}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
                {qrModalItem.komisi} • {qrModalItem.tanggal} • {qrModalItem.waktuMulai}–{qrModalItem.waktuSelesai}
              </p>

              {/* QR Code — gunakan URL nyata dari window.location.origin agar bisa di-scan HP */}
              <div style={{ background: '#fff', padding: 16, borderRadius: 14, display: 'inline-block', border: '3px solid var(--navy)', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <QRCodeSVG
                  value={`${window.location.origin}/presensi?jadwalId=${qrModalItem.id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* URL yang bisa di-scan */}
              <div style={{ background: '#F8FAFC', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>🔗 URL Presensi (scan untuk membuka):</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--navy)', wordBreak: 'break-all', fontWeight: 600 }}>
                  {window.location.origin}/presensi?jadwalId={qrModalItem.id}
                </div>
              </div>

              {/* Panduan scan */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#1E40AF', textAlign: 'left', lineHeight: 1.8 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>📱 Cara Scan dari HP:</div>
                <div>1. Pastikan HP & komputer terhubung <strong>WiFi yang sama</strong></div>
                <div>2. Buka <strong>Kamera HP</strong> atau <strong>Google Lens</strong></div>
                <div>3. Arahkan ke QR di atas → Tap notifikasi yang muncul</div>
                <div>4. Halaman Presensi akan terbuka, isi nama & klik Kirim</div>
              </div>

              {/* Jika masih localhost, tampilkan peringatan */}
              {window.location.hostname === 'localhost' && (
                <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 12, color: '#92400E', textAlign: 'left' }}>
                  ⚠️ <strong>Mode Localhost:</strong> QR hanya bisa dibuka di komputer ini.<br />
                  Untuk scan dari HP, jalankan: <code style={{ background: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>npm run dev -- --host</code><br />
                  lalu gunakan IP jaringan (misal: <strong>192.168.x.x:5173</strong>)
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary w-full" onClick={() => setQrModalItem(null)}>Tutup QR Code</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit' : 'Tambah'} Jadwal Kegiatan</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Judul Kegiatan *</label>
                <input className="form-input" value={form.judul} onChange={e => setForm(p => ({...p, judul: e.target.value}))} placeholder="Judul kegiatan..." />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Komisi</label>
                  <select className="form-select" value={form.komisi} onChange={e => setForm(p => ({...p, komisi: e.target.value}))}>
                    {DAFTAR_KOMISI.map(k => <option key={k.id}>{k.nama}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jenis Kegiatan</label>
                  <select className="form-select" value={form.jenisKegiatan} onChange={e => setForm(p => ({...p, jenisKegiatan: e.target.value}))}>
                    {JENIS.map(j => <option key={j}>{j}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tanggal *</label>
                  <input type="date" className="form-input" value={form.tanggal} onChange={e => setForm(p => ({...p, tanggal: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
                    {['aktif','selesai','batal','tunda'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Jam Mulai</label>
                  <input type="time" className="form-input" value={form.waktuMulai} onChange={e => setForm(p => ({...p, waktuMulai: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Selesai</label>
                  <input type="time" className="form-input" value={form.waktuSelesai} onChange={e => setForm(p => ({...p, waktuSelesai: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Lokasi / Ruang Rapat (Booking)</label>
                <select
                  className="form-select"
                  value={form.lokasi}
                  onChange={e => setForm(p => ({...p, lokasi: e.target.value}))}
                >
                  <option value="Ruang Rapat Komisi I">Ruang Rapat Komisi I (Gedung A Lt. 2)</option>
                  <option value="Ruang Rapat Komisi II">Ruang Rapat Komisi II (Gedung A Lt. 2)</option>
                  <option value="Ruang Rapat Komisi III">Ruang Rapat Komisi III (Gedung A Lt. 3)</option>
                  <option value="Ruang Rapat Komisi IV">Ruang Rapat Komisi IV (Gedung A Lt. 3)</option>
                  <option value="Ruang Paripurna Utama">Ruang Paripurna Utama (Gedung Utama)</option>
                  <option value="Kunjungan Kerja Lapangan">Kunjungan Kerja Lapangan / Luar Kota</option>
                  <option value="Ruang Rapat Sekretariat">Ruang Rapat Sekretariat</option>
                </select>
              </div>
              {editId && (
                <div className="form-group">
                  <label className="form-label">Alasan Perubahan Jadwal (Opsional)</label>
                  <input className="form-input" value={form.alasanPerubahan} onChange={e => setForm(p => ({...p, alasanPerubahan: e.target.value}))} placeholder="Alasan jadwal diubah/ditunda..." />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Keterangan / Agenda</label>
                <textarea className="form-textarea" value={form.keterangan} onChange={e => setForm(p => ({...p, keterangan: e.target.value}))} placeholder="Agenda, catatan..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editId ? <><Edit2 size={14} /> Perbarui Jadwal</> : <><Plus size={14} /> Simpan Jadwal</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
