import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Inbox, Plus, X, Paperclip, User, Reply, Trash2, CheckCheck, ChevronRight } from 'lucide-react';
import { pesanStorage, formatDateTime, generateId } from '../utils/storage';
import { logActivity } from '../utils/audit';

const MOCK_USERS = [
  { id: 'u1', name: 'Admin Sekretariat', role: 'sekretariat' },
  { id: 'u2', name: 'Ketua DPRD', role: 'pimpinan' },
  { id: 'u3', name: 'Sekretaris Komisi I', role: 'sekretariat' },
  { id: 'u4', name: 'Sekretaris Komisi II', role: 'sekretariat' },
  { id: 'u5', name: 'Sekretaris Komisi III', role: 'sekretariat' },
  { id: 'u6', name: 'Sekretaris Komisi IV', role: 'sekretariat' },
];

const SEED_PESAN = [
  {
    id: 'pm1',
    dari: 'Ketua DPRD',
    dariId: 'u2',
    kepada: 'Admin Sekretariat',
    kepadaId: 'u1',
    subjek: 'Disposisi: Surat Undangan Rapat Koordinasi',
    isi: 'Yth. Sekretariat,\n\nMohon segera ditindaklanjuti surat undangan rapat koordinasi dari Bupati tertanggal hari ini. Harap siapkan daftar hadir dan notulen.\n\nTerima kasih.',
    tipe: 'disposisi',
    dibaca: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'pm2',
    dari: 'Admin Sekretariat',
    dariId: 'u1',
    kepada: 'Ketua DPRD',
    kepadaId: 'u2',
    subjek: 'Laporan: Rekapitulasi Kehadiran Minggu Ini',
    isi: 'Yang Terhormat Bapak Ketua,\n\nBersama ini kami sampaikan rekapitulasi kehadiran anggota DPRD minggu ini. Tingkat kehadiran mencapai 87% dari total sesi rapat.\n\nHormat kami,\nSekretariat DPRD',
    tipe: 'pesan',
    dibaca: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export default function PesanPage() {
  const [pesan, setPesan] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('masuk');
  const [showCompose, setShowCompose] = useState(false);
  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  });
  const [form, setForm] = useState({ kepada: '', subjek: '', isi: '', tipe: 'pesan' });

  const loadData = useCallback(() => {
    const data = pesanStorage.getAll();
    // Seed jika kosong
    if (data.length === 0) {
      SEED_PESAN.forEach(p => pesanStorage.add(p));
      setPesan([...SEED_PESAN]);
    } else {
      setPesan(data);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('kegiatan-data-changed', loadData);
    return () => window.removeEventListener('kegiatan-data-changed', loadData);
  }, [loadData]);

  const currentName = currentUser?.displayName || 'Admin Sekretariat';

  const masuk = pesan.filter(p => p.kepada === currentName || p.kepadaId === currentUser?.id);
  const terkirim = pesan.filter(p => p.dari === currentName || p.dariId === currentUser?.id);
  const disposisi = pesan.filter(p => p.tipe === 'disposisi');

  const list = tab === 'masuk' ? masuk : tab === 'terkirim' ? terkirim : disposisi;
  const unreadMasuk = masuk.filter(p => !p.dibaca).length;

  const handleSelect = async (item) => {
    setSelected(item);
    if (!item.dibaca && (item.kepada === currentName || item.kepadaId === currentUser?.id)) {
      await pesanStorage.update(item.id, { dibaca: true });
      setPesan(pesanStorage.getAll());
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.kepada || !form.subjek.trim() || !form.isi.trim()) return;
    const tujuanUser = MOCK_USERS.find(u => u.id === form.kepada);
    await pesanStorage.add({
      id: generateId(),
      dari: currentName,
      dariId: currentUser?.id || 'u1',
      kepada: tujuanUser?.name || form.kepada,
      kepadaId: form.kepada,
      subjek: form.subjek,
      isi: form.isi,
      tipe: form.tipe,
      dibaca: false,
    });
    logActivity('KIRIM_PESAN', `Pesan terkirim ke ${tujuanUser?.name}: ${form.subjek}`);
    setPesan(pesanStorage.getAll());
    setShowCompose(false);
    setForm({ kepada: '', subjek: '', isi: '', tipe: 'pesan' });
    setTab('terkirim');
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Hapus pesan ini?')) return;
    await pesanStorage.delete(id);
    if (selected?.id === id) setSelected(null);
    setPesan(pesanStorage.getAll());
  };

  const handleReply = (item) => {
    setForm({
      kepada: item.dariId || '',
      subjek: `Re: ${item.subjek}`,
      isi: `\n\n----\nPesan asli dari ${item.dari}:\n${item.isi}`,
      tipe: 'pesan',
    });
    setShowCompose(true);
  };

  const avatarInitial = (name) => (name || 'A').charAt(0).toUpperCase();
  const avatarColor = (name) => {
    const colors = ['#2563EB', '#10B981', '#F59E0B', '#9333EA', '#EF4444', '#0891B2'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Pesan Internal & Disposisi
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>
            Komunikasi internal anggota DPRD dan sekretariat
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
          <Plus size={16} /> Tulis Pesan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 'calc(100vh - 220px)', minHeight: 500 }}>
        {/* Panel kiri: Daftar pesan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="filter-pills" style={{ flexWrap: 'nowrap' }}>
            {[
              ['masuk', `Masuk${unreadMasuk > 0 ? ` (${unreadMasuk})` : ''}`, masuk.length],
              ['terkirim', 'Terkirim', terkirim.length],
              ['disposisi', 'Disposisi', disposisi.length],
            ].map(([val, label]) => (
              <button key={val} className={`pill${tab === val ? ' active' : ''}`} onClick={() => { setTab(val); setSelected(null); }}>
                {label}
              </button>
            ))}
          </div>

          <div className="card" style={{ flex: 1, padding: 0, overflow: 'auto' }}>
            {list.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
                <Inbox size={36} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div style={{ fontSize: 13 }}>Tidak ada pesan</div>
              </div>
            ) : (
              list.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selected?.id === item.id ? 'var(--primary-subtle, #EFF6FF)' : !item.dibaca ? 'var(--surface)' : 'var(--card)',
                    borderLeft: selected?.id === item.id ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: avatarColor(tab === 'terkirim' ? item.kepada : item.dari),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: 13,
                    }}>
                      {avatarInitial(tab === 'terkirim' ? item.kepada : item.dari)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: item.dibaca ? 500 : 800, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tab === 'terkirim' ? `→ ${item.kepada}` : item.dari}
                        </span>
                        {!item.dibaca && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: item.dibaca ? 400 : 700, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.subjek}
                      </div>
                      {item.tipe === 'disposisi' && (
                        <span className="badge badge-yellow" style={{ fontSize: 10, marginTop: 3 }}>Disposisi</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, paddingLeft: 44 }}>
                    {formatDateTime(item.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel kanan: Detail */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selected ? (
            <>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{selected.subjek}</h2>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                    <span><strong>Dari:</strong> {selected.dari}</span>
                    <span><strong>Kepada:</strong> {selected.kepada}</span>
                    <span>{formatDateTime(selected.createdAt)}</span>
                    {selected.tipe === 'disposisi' && <span className="badge badge-yellow">Disposisi</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleReply(selected)}>
                    <Reply size={14} /> Balas
                  </button>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={(e) => handleDelete(selected.id, e)} title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                <div style={{
                  background: 'var(--surface)', borderRadius: 12, padding: '20px 24px',
                  fontSize: 14, lineHeight: 1.8, color: 'var(--text-2)', whiteSpace: 'pre-line',
                }}>
                  {selected.isi}
                </div>
                {selected.tipe === 'disposisi' && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: '#FFF7ED', borderRadius: 10, borderLeft: '4px solid #F59E0B' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 4 }}>📋 Tindakan Diperlukan</div>
                    <div style={{ fontSize: 13, color: '#78350F' }}>Pesan ini adalah disposisi resmi yang memerlukan tindak lanjut segera.</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
              <MessageCircle size={56} style={{ opacity: 0.2, marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>Pilih pesan untuk dibaca</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Klik salah satu pesan di sebelah kiri</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Compose */}
      {showCompose && (
        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Send size={16} style={{ marginRight: 8 }} />Tulis Pesan Baru</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowCompose(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Tujuan</label>
                <select className="form-select" value={form.kepada} onChange={e => setForm(p => ({ ...p, kepada: e.target.value }))} required>
                  <option value="">-- Pilih Penerima --</option>
                  {MOCK_USERS.filter(u => u.name !== currentName).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Jenis</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['pesan', 'Pesan Biasa'], ['disposisi', 'Disposisi']].map(([val, label]) => (
                    <button key={val} type="button"
                      className={`pill${form.tipe === val ? ' active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, tipe: val }))}
                    >{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Subjek</label>
                <input className="form-input" placeholder="Subjek pesan" value={form.subjek}
                  onChange={e => setForm(p => ({ ...p, subjek: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Isi Pesan</label>
                <textarea className="form-input" rows={6} placeholder="Tulis pesan Anda..." value={form.isi}
                  onChange={e => setForm(p => ({ ...p, isi: e.target.value }))} style={{ resize: 'vertical' }} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompose(false)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Send size={15} /> Kirim Pesan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
