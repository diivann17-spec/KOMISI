import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, X, ChevronRight, FileText, Users, Calendar, Edit3, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { legislasiStorage, formatDate, generateId } from '../utils/storage';
import { logActivity } from '../utils/audit';

const KOMISI_LIST = ['Komisi I', 'Komisi II', 'Komisi III', 'Komisi IV'];
const JENIS_LIST = ['Raperda', 'Perda', 'Pansus', 'Keputusan DPRD'];

const STATUS_FLOW = [
  { key: 'inisiasi',     label: 'Inisiasi',     color: '#64748B', bg: '#F1F5F9', icon: Circle },
  { key: 'pembahasan',   label: 'Pembahasan',   color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  { key: 'finalisasi',   label: 'Finalisasi',   color: '#2563EB', bg: '#DBEAFE', icon: FileText },
  { key: 'disahkan',     label: 'Disahkan',     color: '#10B981', bg: '#D1FAE5', icon: CheckCircle2 },
];

const SEED_LEGISLASI = [
  {
    id: 'leg1',
    judul: 'Raperda tentang Pengelolaan Sampah dan Kebersihan Lingkungan Hidup',
    nomor: 'Raperda No. 03/2025',
    jenis: 'Raperda', komisi: 'Komisi III',
    inisiator: 'Komisi III DPRD',
    status: 'pembahasan',
    tanggalInisiasi: '2025-03-15',
    tanggalTarget: '2025-12-31',
    anggotaPansus: ['H. Ahmad Fauzi, S.E.', 'Dra. Siti Rahmah, M.Pd.', 'Ir. Budi Santoso'],
    keterangan: 'Naskah akademik telah selesai disusun. Sedang dalam pembahasan tingkat komisi.',
    dokumen: [],
    timeline: [
      { tanggal: '2025-03-15', kegiatan: 'Inisiasi Raperda oleh Komisi III' },
      { tanggal: '2025-04-10', kegiatan: 'Penyusunan Naskah Akademik' },
      { tanggal: '2025-06-01', kegiatan: 'Rapat Pembahasan I bersama Eksekutif' },
    ],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'leg2',
    judul: 'Peraturan Daerah tentang Pajak Daerah dan Retribusi Daerah',
    nomor: 'Perda No. 01/2025',
    jenis: 'Perda', komisi: 'Komisi II',
    inisiator: 'Pemerintah Daerah',
    status: 'disahkan',
    tanggalInisiasi: '2024-09-01',
    tanggalTarget: '2025-03-31',
    anggotaPansus: ['Drs. Supriyadi, M.Si.', 'Hj. Nurul Hidayah, S.H.'],
    keterangan: 'Telah disahkan dalam Rapat Paripurna DPRD.',
    dokumen: [],
    timeline: [
      { tanggal: '2024-09-01', kegiatan: 'Penyampaian Raperda dari Eksekutif' },
      { tanggal: '2024-11-15', kegiatan: 'Pembahasan di Komisi II' },
      { tanggal: '2025-01-20', kegiatan: 'Rapat Finalisasi dan Harmonisasi' },
      { tanggal: '2025-03-10', kegiatan: 'Pengesahan di Rapat Paripurna' },
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

function StatusStepper({ currentStatus }) {
  const currentIdx = STATUS_FLOW.findIndex(s => s.key === currentStatus);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '12px 0' }}>
      {STATUS_FLOW.map((s, idx) => {
        const done = idx <= currentIdx;
        const current = idx === currentIdx;
        const Icon = s.icon;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: idx < STATUS_FLOW.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? s.bg : 'var(--surface)',
                border: current ? `3px solid ${s.color}` : `2px solid ${done ? s.color : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                <Icon size={14} color={done ? s.color : 'var(--text-3)'} />
              </div>
              <div style={{ fontSize: 10, fontWeight: current ? 800 : 500, color: done ? s.color : 'var(--text-3)', whiteSpace: 'nowrap' }}>
                {s.label}
              </div>
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <div style={{ flex: 1, height: 3, background: idx < currentIdx ? s.color : 'var(--border)', margin: '0 4px', marginBottom: 16, transition: 'background 0.3s', borderRadius: 2 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_FLOW.find(f => f.key === status) || STATUS_FLOW[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color, fontWeight: 700,
      fontSize: 12, padding: '3px 10px', borderRadius: 20,
    }}>
      {s.label}
    </span>
  );
}

export default function LegislasiPage() {
  const [items, setItems] = useState([]);
  const [filterKomisi, setFilterKomisi] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterJenis, setFilterJenis] = useState('semua');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const emptyForm = {
    judul: '', nomor: '', jenis: 'Raperda', komisi: 'Komisi I',
    inisiator: '', status: 'inisiasi',
    tanggalInisiasi: new Date().toISOString().split('T')[0],
    tanggalTarget: '',
    anggotaPansus: '', keterangan: '',
    timeline: [],
  };
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(() => {
    let data = legislasiStorage.getAll();
    if (data.length === 0) {
      SEED_LEGISLASI.forEach(l => legislasiStorage.add(l));
      data = SEED_LEGISLASI;
    }
    setItems(data);
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('kegiatan-data-changed', loadData);
    return () => window.removeEventListener('kegiatan-data-changed', loadData);
  }, [loadData]);

  const handleSave = async (e) => {
    e.preventDefault();
    const pansusArr = typeof form.anggotaPansus === 'string'
      ? form.anggotaPansus.split('\n').map(s => s.trim()).filter(Boolean)
      : form.anggotaPansus;

    if (editMode && selected) {
      await legislasiStorage.update(selected.id, { ...form, anggotaPansus: pansusArr });
      logActivity('EDIT_LEGISLASI', `Legislasi diperbarui: ${form.judul}`);
      setSelected({ ...selected, ...form, anggotaPansus: pansusArr });
    } else {
      const newEntry = await legislasiStorage.add({
        id: generateId(), ...form,
        anggotaPansus: pansusArr,
        dokumen: [], timeline: [{ tanggal: form.tanggalInisiasi, kegiatan: 'Inisiasi legislasi' }],
      });
      logActivity('TAMBAH_LEGISLASI', `Produk legislasi baru: ${form.judul}`);
    }
    setItems(legislasiStorage.getAll());
    setShowForm(false);
    setEditMode(false);
    setForm(emptyForm);
  };

  const handleAdvanceStatus = async (item) => {
    const idx = STATUS_FLOW.findIndex(s => s.key === item.status);
    if (idx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[idx + 1].key;
    const newTimeline = [
      ...(item.timeline || []),
      { tanggal: new Date().toISOString().split('T')[0], kegiatan: `Status diubah ke: ${STATUS_FLOW[idx + 1].label}` }
    ];
    await legislasiStorage.update(item.id, { status: nextStatus, timeline: newTimeline });
    logActivity('UPDATE_LEGISLASI', `Status "${item.judul}" → ${nextStatus}`);
    setItems(legislasiStorage.getAll());
    if (selected?.id === item.id) setSelected({ ...item, status: nextStatus, timeline: newTimeline });
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk legislasi ini?')) return;
    await legislasiStorage.delete(id);
    if (selected?.id === id) setSelected(null);
    setItems(legislasiStorage.getAll());
  };

  const handleEdit = (item) => {
    setForm({ ...item, anggotaPansus: (item.anggotaPansus || []).join('\n') });
    setEditMode(true);
    setShowForm(true);
  };

  const filtered = items.filter(item => {
    const km = filterKomisi === 'semua' || item.komisi === filterKomisi;
    const sm = filterStatus === 'semua' || item.status === filterStatus;
    const jm = filterJenis === 'semua' || item.jenis === filterJenis;
    return km && sm && jm;
  });

  const currentStatusIdx = (status) => STATUS_FLOW.findIndex(s => s.key === status);
  const isLast = (status) => currentStatusIdx(status) >= STATUS_FLOW.length - 1;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Produk Legislasi
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>
            Tracking Perda, Raperda & Pansus — dari inisiasi hingga pengesahan
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditMode(false); setShowForm(true); }}>
          <Plus size={16} /> Tambah Produk Legislasi
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {STATUS_FLOW.map(s => {
          const count = items.filter(i => i.status === s.key).length;
          return (
            <div key={s.key} className="card" style={{ padding: '14px 18px', borderLeft: `4px solid ${s.color}`, cursor: 'pointer' }}
              onClick={() => setFilterStatus(filterStatus === s.key ? 'semua' : s.key)}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={filterKomisi} onChange={e => setFilterKomisi(e.target.value)}>
          <option value="semua">Semua Komisi</option>
          {KOMISI_LIST.map(k => <option key={k}>{k}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
          <option value="semua">Semua Jenis</option>
          {JENIS_LIST.map(j => <option key={j}>{j}</option>)}
        </select>
        <div className="filter-pills">
          {[['semua', 'Semua'], ...STATUS_FLOW.map(s => [s.key, s.label])].map(([val, label]) => (
            <button key={val} className={`pill${filterStatus === val ? ' active' : ''}`} onClick={() => setFilterStatus(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Legislation List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <BookOpen size={44} className="icon" />
                <h3>Belum ada produk legislasi</h3>
                <p>Tambahkan Raperda, Perda, atau Pansus untuk dilacak progresnya.</p>
              </div>
            </div>
          ) : (
            filtered.map(item => (
              <div key={item.id} className="card" style={{
                cursor: 'pointer',
                borderLeft: selected?.id === item.id ? '4px solid var(--primary)' : '4px solid transparent',
              }} onClick={() => setSelected(selected?.id === item.id ? null : item)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                      <StatusBadge status={item.status} />
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{item.komisi}</span>
                      <span className="badge badge-blue" style={{ fontSize: 11 }}>{item.jenis}</span>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 2, lineHeight: 1.4 }}>{item.judul}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.nomor} • Inisiator: {item.inisiator}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!isLast(item.status) && (
                      <button className="btn btn-secondary btn-sm" title="Lanjut ke tahap berikutnya"
                        onClick={e => { e.stopPropagation(); handleAdvanceStatus(item); }}>
                        <ChevronRight size={13} />
                      </button>
                    )}
                    <button className="btn btn-secondary btn-sm btn-icon" title="Edit"
                      onClick={e => { e.stopPropagation(); handleEdit(item); }}>
                      <Edit3 size={13} />
                    </button>
                    <button className="btn btn-secondary btn-sm btn-icon" title="Hapus"
                      onClick={e => { e.stopPropagation(); handleDelete(item.id); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <StatusStepper currentStatus={item.status} />
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> Inisiasi: {formatDate(item.tanggalInisiasi)}
                  </span>
                  {item.tanggalTarget && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> Target: {formatDate(item.tanggalTarget)}
                    </span>
                  )}
                  {item.anggotaPansus?.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={11} /> {item.anggotaPansus.length} Anggota Pansus
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card" style={{ position: 'sticky', top: 20, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Detail Legislasi</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>

            <StatusBadge status={selected.status} />
            <h4 style={{ fontSize: 14, fontWeight: 800, margin: '10px 0 4px', color: 'var(--text)', lineHeight: 1.4 }}>{selected.judul}</h4>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>{selected.nomor}</div>

            <StatusStepper currentStatus={selected.status} />

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Jenis', value: selected.jenis },
                { label: 'Komisi', value: selected.komisi },
                { label: 'Inisiator', value: selected.inisiator },
                { label: 'Tanggal Inisiasi', value: formatDate(selected.tanggalInisiasi) },
                { label: 'Target Selesai', value: selected.tanggalTarget ? formatDate(selected.tanggalTarget) : '-' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-3)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                </div>
              ))}
            </div>

            {selected.anggotaPansus?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase' }}>Anggota Pansus</div>
                {selected.anggotaPansus.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11 }}>
                      {a.charAt(0)}
                    </div>
                    <span style={{ color: 'var(--text)' }}>{a}</span>
                  </div>
                ))}
              </div>
            )}

            {selected.keterangan && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface)', borderRadius: 10, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                {selected.keterangan}
              </div>
            )}

            {/* Timeline */}
            {selected.timeline?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10, textTransform: 'uppercase' }}>Timeline</div>
                {selected.timeline.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === selected.timeline.length - 1 ? 'var(--primary)' : 'var(--border)', marginTop: 4 }} />
                      {i < selected.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{t.kegiatan}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{formatDate(t.tanggal)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLast(selected.status) && (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}
                onClick={() => handleAdvanceStatus(selected)}>
                <ChevronRight size={15} /> Lanjut ke Tahap Berikutnya
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><BookOpen size={16} style={{ marginRight: 8 }} />{editMode ? 'Edit' : 'Tambah'} Produk Legislasi</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
              <div>
                <label className="form-label">Judul Lengkap</label>
                <input className="form-input" placeholder="Raperda tentang..." value={form.judul}
                  onChange={e => setForm(p => ({ ...p, judul: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Jenis</label>
                  <select className="form-select" value={form.jenis} onChange={e => setForm(p => ({ ...p, jenis: e.target.value }))}>
                    {JENIS_LIST.map(j => <option key={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Komisi</label>
                  <select className="form-select" value={form.komisi} onChange={e => setForm(p => ({ ...p, komisi: e.target.value }))}>
                    {KOMISI_LIST.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Nomor / Kode</label>
                  <input className="form-input" placeholder="mis. Raperda No. 03/2025" value={form.nomor}
                    onChange={e => setForm(p => ({ ...p, nomor: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Inisiator</label>
                  <input className="form-input" placeholder="mis. Komisi I DPRD" value={form.inisiator}
                    onChange={e => setForm(p => ({ ...p, inisiator: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Status Saat Ini</label>
                <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {STATUS_FLOW.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Tanggal Inisiasi</label>
                  <input className="form-input" type="date" value={form.tanggalInisiasi}
                    onChange={e => setForm(p => ({ ...p, tanggalInisiasi: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Tanggal Target</label>
                  <input className="form-input" type="date" value={form.tanggalTarget}
                    onChange={e => setForm(p => ({ ...p, tanggalTarget: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Anggota Pansus (satu per baris)</label>
                <textarea className="form-input" rows={3} placeholder="Nama anggota pansus, satu per baris"
                  value={form.anggotaPansus} onChange={e => setForm(p => ({ ...p, anggotaPansus: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="form-label">Keterangan</label>
                <textarea className="form-input" rows={3} placeholder="Catatan perkembangan legislasi..."
                  value={form.keterangan} onChange={e => setForm(p => ({ ...p, keterangan: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  <BookOpen size={15} /> {editMode ? 'Simpan Perubahan' : 'Tambah Legislasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
