import { useState, useEffect, useCallback } from 'react';
import { Vote, Plus, X, CheckCircle2, Clock, Users, BarChart3, Trash2, Play, Square, AlertCircle } from 'lucide-react';
import { votingStorage, jadwalStorage, formatDateTime, formatDate, generateId } from '../utils/storage';
import { logActivity } from '../utils/audit';

const KOMISI_LIST = ['Semua Komisi', 'Komisi I', 'Komisi II', 'Komisi III', 'Komisi IV'];
const STATUS_LIST = ['semua', 'draft', 'aktif', 'selesai'];
const QUORUM_THRESHOLD = 0.67; // 2/3 dari total anggota

const SEED_VOTING = [
  {
    id: 'v1',
    judul: 'Persetujuan Raperda Pengelolaan Sampah',
    deskripsi: 'Pembahasan dan persetujuan Raperda tentang Pengelolaan Sampah dan Kebersihan Lingkungan Hidup.',
    komisi: 'Komisi III',
    totalAnggota: 9,
    status: 'aktif',
    votes: { ya: 5, tidak: 1, abstain: 1 },
    voterIds: [],
    tanggalMulai: new Date(Date.now() - 3600000).toISOString(),
    tanggalSelesai: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'v2',
    judul: 'Persetujuan Anggaran Kunjungan Kerja Q3',
    deskripsi: 'Persetujuan alokasi anggaran untuk kunjungan kerja triwulan ketiga seluruh komisi.',
    komisi: 'Semua Komisi',
    totalAnggota: 30,
    status: 'selesai',
    votes: { ya: 22, tidak: 3, abstain: 2 },
    voterIds: [],
    tanggalMulai: new Date(Date.now() - 86400000).toISOString(),
    tanggalSelesai: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

function StatusBadge({ status }) {
  const map = {
    draft: { label: 'Draft', cls: 'badge-gray' },
    aktif: { label: '🟢 Aktif', cls: 'badge-green' },
    selesai: { label: 'Selesai', cls: 'badge-blue' },
  };
  const s = map[status] || map.draft;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function VoteBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{label}</span>
        <span style={{ color: 'var(--text-3)' }}>{count} suara ({pct}%)</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function VotingPage() {
  const [items, setItems] = useState([]);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterKomisi, setFilterKomisi] = useState('Semua Komisi');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [myVote, setMyVote] = useState({});
  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return { id: 'u1', displayName: 'Admin' }; }
  });

  const [form, setForm] = useState({
    judul: '', deskripsi: '', komisi: 'Komisi I',
    totalAnggota: 9,
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  const loadData = useCallback(() => {
    let data = votingStorage.getAll();
    if (data.length === 0) {
      SEED_VOTING.forEach(v => votingStorage.add(v));
      data = SEED_VOTING;
    }
    setItems(data);
    // Load votes yang sudah dilakukan user ini
    const saved = JSON.parse(localStorage.getItem('sim_my_votes') || '{}');
    setMyVote(saved);
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('kegiatan-data-changed', loadData);
    return () => window.removeEventListener('kegiatan-data-changed', loadData);
  }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const newVoting = {
      id: generateId(),
      ...form,
      totalAnggota: parseInt(form.totalAnggota),
      status: 'draft',
      votes: { ya: 0, tidak: 0, abstain: 0 },
      voterIds: [],
    };
    await votingStorage.add(newVoting);
    logActivity('BUAT_VOTING', `Sesi voting dibuat: ${form.judul}`);
    setItems(votingStorage.getAll());
    setShowCreate(false);
    setForm({ judul: '', deskripsi: '', komisi: 'Komisi I', totalAnggota: 9, tanggalMulai: new Date().toISOString().split('T')[0], tanggalSelesai: new Date(Date.now() + 86400000).toISOString().split('T')[0] });
  };

  const handleStatusChange = async (item, newStatus) => {
    await votingStorage.update(item.id, { status: newStatus });
    logActivity('UPDATE_VOTING', `Status voting "${item.judul}" → ${newStatus}`);
    setItems(votingStorage.getAll());
    if (selected?.id === item.id) setSelected({ ...item, status: newStatus });
  };

  const handleVote = async (votingId, pilihan) => {
    const uid = currentUser?.id || 'u1';
    const allVotes = JSON.parse(localStorage.getItem('sim_my_votes') || '{}');
    if (allVotes[votingId]) { alert('Anda sudah memberikan suara pada sesi ini.'); return; }

    const item = items.find(i => i.id === votingId);
    if (!item || item.status !== 'aktif') return;

    const updatedVotes = { ...item.votes, [pilihan]: (item.votes[pilihan] || 0) + 1 };
    await votingStorage.update(votingId, { votes: updatedVotes });

    allVotes[votingId] = pilihan;
    localStorage.setItem('sim_my_votes', JSON.stringify(allVotes));
    setMyVote(allVotes);
    logActivity('CAST_VOTE', `Suara diberikan: ${pilihan.toUpperCase()} pada "${item.judul}"`);
    setItems(votingStorage.getAll());
    setSelected({ ...item, votes: updatedVotes });
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus sesi voting ini?')) return;
    await votingStorage.delete(id);
    if (selected?.id === id) setSelected(null);
    setItems(votingStorage.getAll());
  };

  const filtered = items.filter(item => {
    const statusMatch = filterStatus === 'semua' || item.status === filterStatus;
    const komisiMatch = filterKomisi === 'Semua Komisi' || item.komisi === filterKomisi || item.komisi === 'Semua Komisi';
    return statusMatch && komisiMatch;
  });

  const totalVotes = (v) => (v?.ya || 0) + (v?.tidak || 0) + (v?.abstain || 0);
  const getQuorumStatus = (item) => {
    const cast = totalVotes(item.votes);
    const needed = Math.ceil(item.totalAnggota * QUORUM_THRESHOLD);
    return { cast, needed, reached: cast >= needed };
  };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Voting & Pengambilan Suara
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>
            Sesi voting digital per agenda rapat dan sidang komisi
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Buat Sesi Voting
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Sesi', value: items.length, color: 'var(--primary)' },
          { label: 'Aktif', value: items.filter(i => i.status === 'aktif').length, color: 'var(--success)' },
          { label: 'Selesai', value: items.filter(i => i.status === 'selesai').length, color: 'var(--text-3)' },
          { label: 'Draft', value: items.filter(i => i.status === 'draft').length, color: '#F59E0B' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="filter-pills">
          {STATUS_LIST.map(s => (
            <button key={s} className={`pill${filterStatus === s ? ' active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 140 }}
          value={filterKomisi} onChange={e => setFilterKomisi(e.target.value)}>
          {KOMISI_LIST.map(k => <option key={k}>{k}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* List voting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Vote size={44} className="icon" />
                <h3>Belum ada sesi voting</h3>
                <p>Buat sesi voting baru untuk agenda rapat komisi.</p>
              </div>
            </div>
          ) : (
            filtered.map(item => {
              const quorum = getQuorumStatus(item);
              const total = totalVotes(item.votes);
              const sudahVote = myVote[item.id];
              const pct_ya = total > 0 ? Math.round((item.votes.ya / total) * 100) : 0;
              return (
                <div key={item.id} className="card" style={{ cursor: 'pointer', borderLeft: selected?.id === item.id ? '4px solid var(--primary)' : '4px solid transparent' }}
                  onClick={() => setSelected(selected?.id === item.id ? null : item)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                        <StatusBadge status={item.status} />
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>{item.komisi}</span>
                        {sudahVote && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Sudah Vote: {sudahVote.toUpperCase()}</span>}
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{item.judul}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{item.deskripsi}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {item.status === 'draft' && (
                        <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); handleStatusChange(item, 'aktif'); }}>
                          <Play size={13} /> Mulai
                        </button>
                      )}
                      {item.status === 'aktif' && (
                        <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); handleStatusChange(item, 'selesai'); }}>
                          <Square size={13} /> Tutup
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={e => { e.stopPropagation(); handleDelete(item.id); }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress ringkas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                    {[
                      { label: 'YA', count: item.votes.ya, color: '#10B981' },
                      { label: 'TIDAK', count: item.votes.tidak, color: '#EF4444' },
                      { label: 'ABSTAIN', count: item.votes.abstain, color: '#94A3B8' },
                    ].map(({ label, count, color }) => (
                      <div key={label} style={{ textAlign: 'center', padding: '8px', background: 'var(--surface)', borderRadius: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color }}>{count}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} /> {total}/{item.totalAnggota} suara masuk
                    </span>
                    <span style={{ color: quorum.reached ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {quorum.reached ? '✓ Kuorum Tercapai' : `⚠ Butuh ${quorum.needed - quorum.cast} suara lagi`}
                    </span>
                  </div>

                  {/* Cast Vote */}
                  {item.status === 'aktif' && !sudahVote && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm" style={{ flex: 1, background: '#10B981', color: '#fff', fontWeight: 800 }}
                        onClick={e => { e.stopPropagation(); handleVote(item.id, 'ya'); }}>
                        ✅ YA
                      </button>
                      <button className="btn btn-sm" style={{ flex: 1, background: '#EF4444', color: '#fff', fontWeight: 800 }}
                        onClick={e => { e.stopPropagation(); handleVote(item.id, 'tidak'); }}>
                        ❌ TIDAK
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                        onClick={e => { e.stopPropagation(); handleVote(item.id, 'abstain'); }}>
                        ⬜ ABSTAIN
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card" style={{ position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Detail Hasil Voting</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>
            <StatusBadge status={selected.status} />
            <h4 style={{ fontSize: 14, fontWeight: 800, margin: '10px 0 4px', color: 'var(--text)' }}>{selected.judul}</h4>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{selected.deskripsi}</p>

            <VoteBar label="YA" count={selected.votes?.ya || 0} total={totalVotes(selected.votes)} color="#10B981" />
            <VoteBar label="TIDAK" count={selected.votes?.tidak || 0} total={totalVotes(selected.votes)} color="#EF4444" />
            <VoteBar label="ABSTAIN" count={selected.votes?.abstain || 0} total={totalVotes(selected.votes)} color="#94A3B8" />

            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--surface)', borderRadius: 10 }}>
              {(() => {
                const q = getQuorumStatus(selected);
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-3)' }}>Suara masuk</span>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{q.cast} / {selected.totalAnggota}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-3)' }}>Status Kuorum (≥2/3)</span>
                      <span style={{ fontWeight: 800, color: q.reached ? 'var(--success)' : 'var(--danger)' }}>
                        {q.reached ? '✓ Tercapai' : `✗ Belum (butuh ${q.needed})`}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            {selected.status === 'selesai' && (
              <div style={{ marginTop: 12, padding: '12px 16px', background: selected.votes?.ya > selected.votes?.tidak ? '#D1FAE5' : '#FEE2E2', borderRadius: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: selected.votes?.ya > selected.votes?.tidak ? '#065F46' : '#991B1B' }}>
                  {selected.votes?.ya > selected.votes?.tidak ? '✅ Disetujui' : '❌ Ditolak'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  Berdasarkan hasil voting final
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Buat Voting */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ width: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Vote size={16} style={{ marginRight: 8 }} />Buat Sesi Voting Baru</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Judul Agenda / Sesi Voting</label>
                <input className="form-input" placeholder="mis. Persetujuan Raperda Pengelolaan Sampah"
                  value={form.judul} onChange={e => setForm(p => ({ ...p, judul: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" rows={3} placeholder="Deskripsi agenda voting..."
                  value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Komisi</label>
                  <select className="form-select" value={form.komisi} onChange={e => setForm(p => ({ ...p, komisi: e.target.value }))}>
                    {KOMISI_LIST.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Jumlah Anggota Pemilih</label>
                  <input className="form-input" type="number" min={1} max={100} value={form.totalAnggota}
                    onChange={e => setForm(p => ({ ...p, totalAnggota: e.target.value }))} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Tanggal Mulai</label>
                  <input className="form-input" type="date" value={form.tanggalMulai}
                    onChange={e => setForm(p => ({ ...p, tanggalMulai: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Tanggal Selesai</label>
                  <input className="form-input" type="date" value={form.tanggalSelesai}
                    onChange={e => setForm(p => ({ ...p, tanggalSelesai: e.target.value }))} required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Vote size={15} /> Buat Voting</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
