import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, PieChart, Plus, ArrowUpRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { logActivity } from '../utils/audit';

const TOTAL_PAGU = 500000000; // Rp 500 Juta

const INITIAL_EXPENSES = [
  {
    id: 'ANG-001',
    kegiatan: 'Rapat Dengar Pendapat Komisi I',
    komisi: 'Komisi I',
    kategori: 'Konsumsi Rapat',
    nominal: 3500000,
    tanggal: '2026-08-10',
    keterangan: 'Snack & Makan Siang 35 orang',
    bukti: 'nota_konsumsi_001.pdf'
  },
  {
    id: 'ANG-002',
    kegiatan: 'Kunjungan Kerja Lapangan Komisi III',
    komisi: 'Komisi III',
    kategori: 'Perjalanan Dinas',
    nominal: 18500000,
    tanggal: '2026-08-12',
    keterangan: 'Transportasi & Uang Saku Kunker 5 Anggota',
    bukti: 'spt_kunker_002.pdf'
  },
  {
    id: 'ANG-003',
    kegiatan: 'Dengar Pendapat Ranperda Kebudayaan',
    komisi: 'Komisi IV',
    kategori: 'Honorarium Pakar',
    nominal: 4000000,
    tanggal: '2026-08-15',
    keterangan: 'Honor 2 Narasumber Ahli',
    bukti: 'kwitansi_honor_003.pdf'
  }
];

export default function AnggaranPage() {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('sim_anggaran');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [showModal, setShowModal] = useState(false);
  const [formExpense, setFormExpense] = useState({
    kegiatan: '',
    komisi: 'Komisi I',
    kategori: 'Konsumsi Rapat',
    nominal: '',
    keterangan: ''
  });

  useEffect(() => {
    localStorage.setItem('sim_anggaran', JSON.stringify(expenses));
  }, [expenses]);

  const totalRealisasi = expenses.reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const sisaPagu = TOTAL_PAGU - totalRealisasi;
  const persentaseSerapan = ((totalRealisasi / TOTAL_PAGU) * 100).toFixed(1);

  const handleAddExpense = (e) => {
    e.preventDefault();
    const newExpense = {
      id: `ANG-${Date.now().toString().slice(-4)}`,
      ...formExpense,
      nominal: Number(formExpense.nominal),
      tanggal: new Date().toISOString().split('T')[0],
      bukti: 'bukti_nota.pdf'
    };

    setExpenses([newExpense, ...expenses]);
    logActivity('ANGGARAN_ADD', `Pencatatan realisasi anggaran Rp ${newExpense.nominal.toLocaleString('id-ID')} untuk ${newExpense.kegiatan}`);
    setShowModal(false);
    setFormExpense({
      kegiatan: '',
      komisi: 'Komisi I',
      kategori: 'Konsumsi Rapat',
      nominal: '',
      keterangan: ''
    });
  };

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>Manajemen Anggaran Kegiatan</h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>Pemantauan Pagu Anggaran, Realisasi Pengeluaran &amp; Bukti Bayar Komisi I–IV</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Catat Realisasi Biaya
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 18 }}>
        <div className="stat-card">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pagu Anggaran Komisi</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', marginTop: 4 }}>{formatRupiah(TOTAL_PAGU)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Alokasi Anggaran T.A. 2026</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Realisasi Pengeluaran</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--danger)', letterSpacing: '-0.04em', marginTop: 4 }}>{formatRupiah(totalRealisasi)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Sisa Pagu: {formatRupiah(sisaPagu)}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Persentase Serapan</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--success)', letterSpacing: '-0.04em', marginTop: 4 }}>{persentaseSerapan}%</div>
          <div style={{ background: 'var(--border)', height: 6, borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ background: 'var(--success)', height: '100%', width: `${Math.min(Number(persentaseSerapan), 100)}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Rincian Realisasi Pengeluaran Kegiatan</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No Ref &amp; Tanggal</th>
                <th>Nama Kegiatan</th>
                <th>Komisi</th>
                <th>Kategori</th>
                <th>Nominal</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-4)' }}>Belum ada realisasi pengeluaran yang dicatat.</td></tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 12 }}>{e.id}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{e.tanggal}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{e.kegiatan}</td>
                    <td><span className="badge badge-gray">{e.komisi}</span></td>
                    <td><span className="badge badge-blue">{e.kategori}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)', whiteSpace: 'nowrap' }}>{formatRupiah(e.nominal)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{e.keterangan}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">Catat Pengeluaran Anggaran</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddExpense}>
                <div className="form-group">
                  <label className="form-label">Nama Kegiatan</label>
                  <input type="text" className="form-input" placeholder="Contoh: Rapat Kerja Komisi I" required value={formExpense.kegiatan} onChange={e => setFormExpense({ ...formExpense, kegiatan: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Komisi Penanggung Jawab</label>
                    <select className="form-select" value={formExpense.komisi} onChange={e => setFormExpense({ ...formExpense, komisi: e.target.value })}>
                      <option value="Komisi I">Komisi I</option>
                      <option value="Komisi II">Komisi II</option>
                      <option value="Komisi III">Komisi III</option>
                      <option value="Komisi IV">Komisi IV</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kategori Biaya</label>
                    <select className="form-select" value={formExpense.kategori} onChange={e => setFormExpense({ ...formExpense, kategori: e.target.value })}>
                      <option value="Konsumsi Rapat">Konsumsi Rapat</option>
                      <option value="Perjalanan Dinas">Perjalanan Dinas</option>
                      <option value="Honorarium Pakar">Honorarium Pakar</option>
                      <option value="ATK &amp; Percetakan">ATK &amp; Percetakan</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nominal Pengeluaran (Rp)</label>
                  <input type="number" className="form-input" placeholder="Contoh: 2500000" required value={formExpense.nominal} onChange={e => setFormExpense({ ...formExpense, nominal: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Keterangan / Rincian Nota</label>
                  <textarea className="form-textarea" rows={3} placeholder="Detail kwitansi/nota pengeluaran..." required value={formExpense.keterangan} onChange={e => setFormExpense({ ...formExpense, keterangan: e.target.value })} />
                </div>
                <div className="modal-footer" style={{ margin: '0 -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Realisasi</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

