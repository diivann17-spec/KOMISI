import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, Plus, Minus, TrendingUp, TrendingDown, Wallet,
  ArrowUpCircle, ArrowDownCircle, X, Trash2, BarChart2, FileText
} from 'lucide-react';
import { logActivity } from '../utils/audit';
import { generateLaporanKeuanganPdf } from '../utils/pdf';

const BASE_PAGU = 500_000_000; // Rp 500 Juta (pagu awal)

const INITIAL_TRANSACTIONS = [
  {
    id: 'TRX-001', tipe: 'pengeluaran', tanggal: '2026-08-10',
    kegiatan: 'Rapat Dengar Pendapat Komisi I', komisi: 'Komisi I',
    kategori: 'Konsumsi Rapat', nominal: 3_500_000,
    keterangan: 'Snack & Makan Siang 35 orang',
  },
  {
    id: 'TRX-002', tipe: 'pengeluaran', tanggal: '2026-08-12',
    kegiatan: 'Kunjungan Kerja Lapangan Komisi III', komisi: 'Komisi III',
    kategori: 'Perjalanan Dinas', nominal: 18_500_000,
    keterangan: 'Transportasi & Uang Saku Kunker 5 Anggota',
  },
  {
    id: 'TRX-003', tipe: 'pengeluaran', tanggal: '2026-08-15',
    kegiatan: 'Dengar Pendapat Ranperda Kebudayaan', komisi: 'Komisi IV',
    kategori: 'Honorarium Pakar', nominal: 4_000_000,
    keterangan: 'Honor 2 Narasumber Ahli',
  },
  {
    id: 'TRX-004', tipe: 'tambah', tanggal: '2026-08-01',
    kegiatan: 'Penambahan Pagu APBD Perubahan', komisi: 'Semua Komisi',
    kategori: 'Penambahan Pagu', nominal: 50_000_000,
    keterangan: 'Tambahan pagu dari APBD Perubahan T.A. 2026',
  },
  {
    id: 'TRX-005', tipe: 'pengurangan', tanggal: '2026-08-05',
    kegiatan: 'Efisiensi Anggaran Komisi II', komisi: 'Komisi II',
    kategori: 'Pengurangan Pagu', nominal: 25_000_000,
    keterangan: 'Efisiensi belanja berdasarkan Surat Edaran Bupati',
  },
];

export default function AnggaranPage() {
  const [transactions, setTransactions] = useState(() => {
    try {
      // Coba baca data baru
      const saved = localStorage.getItem('sim_anggaran_v2');
      if (saved) return JSON.parse(saved);

      // Migrasi dari format lama (sim_anggaran) jika ada
      const old = localStorage.getItem('sim_anggaran');
      if (old) {
        const parsed = JSON.parse(old);
        // Format lama adalah array expenses, konversi ke format baru dengan tipe 'pengeluaran'
        const migrated = parsed.map(e => ({
          ...e,
          tipe: e.tipe || 'pengeluaran',
          id: e.id || `TRX-${Date.now().toString().slice(-5)}`,
        }));
        localStorage.setItem('sim_anggaran_v2', JSON.stringify(migrated));
        return migrated;
      }
    } catch { /* ignore parse error, fallback ke initial */ }
    return INITIAL_TRANSACTIONS;
  });

  const [activeTab, setActiveTab] = useState('semua');
  const [showModal, setShowModal] = useState(false);
  const [modalTipe, setModalTipe] = useState('pengeluaran'); // 'pengeluaran' | 'tambah' | 'pengurangan'

  const [form, setForm] = useState({
    kegiatan: '', komisi: 'Komisi I', kategori: 'Konsumsi Rapat',
    nominal: '', keterangan: ''
  });

  useEffect(() => {
    localStorage.setItem('sim_anggaran_v2', JSON.stringify(transactions));
  }, [transactions]);

  const stats = useMemo(() => {
    const totalTambah = transactions
      .filter(t => t.tipe === 'tambah')
      .reduce((s, t) => s + Number(t.nominal), 0);

    const totalPengurangan = transactions
      .filter(t => t.tipe === 'pengurangan')
      .reduce((s, t) => s + Number(t.nominal), 0);

    const totalPengeluaran = transactions
      .filter(t => t.tipe === 'pengeluaran')
      .reduce((s, t) => s + Number(t.nominal), 0);

    const totalPagu = BASE_PAGU + totalTambah - totalPengurangan;
    const sisaPagu = totalPagu - totalPengeluaran;
    const persen = totalPagu > 0 ? ((totalPengeluaran / totalPagu) * 100).toFixed(1) : 0;

    return { totalPagu, totalTambah, totalPengurangan, totalPengeluaran, sisaPagu, persen };
  }, [transactions]);

  const filteredTrx = useMemo(() => {
    if (activeTab === 'semua') return transactions;
    return transactions.filter(t => t.tipe === activeTab);
  }, [transactions, activeTab]);

  const formatRp = (val) => 'Rp ' + Number(val).toLocaleString('id-ID');

  const openModal = (tipe) => {
    setModalTipe(tipe);
    const defaultKategori =
      tipe === 'tambah' ? 'Penambahan Pagu' :
      tipe === 'pengurangan' ? 'Pengurangan Pagu' : 'Konsumsi Rapat';
    setForm({ kegiatan: '', komisi: 'Komisi I', kategori: defaultKategori, nominal: '', keterangan: '' });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTrx = {
      id: `TRX-${Date.now().toString().slice(-5)}`,
      tipe: modalTipe,
      tanggal: new Date().toISOString().split('T')[0],
      ...form,
      nominal: Number(form.nominal),
    };
    setTransactions([newTrx, ...transactions]);
    const label = modalTipe === 'tambah' ? 'Penambahan Anggaran'
      : modalTipe === 'pengurangan' ? 'Pengurangan Anggaran'
      : 'Realisasi Pengeluaran';
    logActivity(`ANGGARAN_${modalTipe.toUpperCase()}`, `${label} ${formatRp(newTrx.nominal)} — ${newTrx.kegiatan}`);
    setShowModal(false);
  };

  const handleDelete = (id, kegiatan) => {
    if (confirm(`Hapus transaksi "${kegiatan}"?`)) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const tipeConfig = {
    pengeluaran: { label: 'Pengeluaran', color: 'var(--danger)', bg: 'var(--danger-s)', icon: <ArrowDownCircle size={13} />, badge: 'badge-red' },
    tambah:      { label: 'Tambah Anggaran', color: 'var(--success)', bg: 'var(--success-s)', icon: <ArrowUpCircle size={13} />, badge: 'badge-green' },
    pengurangan: { label: 'Pengurangan', color: 'var(--warning)', bg: 'var(--warning-s)', icon: <Minus size={13} />, badge: 'badge-orange' },
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Manajemen Anggaran Kegiatan
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>
            Pemantauan Pagu, Realisasi, Tambah & Pengurangan Anggaran Komisi I–IV
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}
            onClick={() => generateLaporanKeuanganPdf(
              transactions, BASE_PAGU,
              `Laporan_Keuangan_DPRD_${new Date().getFullYear()}.pdf`
            )}
          >
            <FileText size={15} /> Cetak Laporan Keuangan
          </button>
          <button className="btn btn-secondary" style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}
            onClick={() => openModal('pengurangan')}>
            <TrendingDown size={15} /> Pengurangan Anggaran
          </button>
          <button className="btn btn-secondary" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
            onClick={() => openModal('tambah')}>
            <TrendingUp size={15} /> Tambah Anggaran
          </button>
          <button className="btn btn-primary" onClick={() => openModal('pengeluaran')}>
            <Plus size={15} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pagu Efektif</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--blue)', letterSpacing: '-0.04em', marginTop: 4 }}>{formatRp(stats.totalPagu)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Pagu Awal + Tambah − Pengurangan</div>
            </div>
            <div style={{ background: 'var(--blue-s)', borderRadius: 8, padding: 8, color: 'var(--blue)' }}>
              <Wallet size={18} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pengeluaran</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--danger)', letterSpacing: '-0.04em', marginTop: 4 }}>{formatRp(stats.totalPengeluaran)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Sisa: {formatRp(stats.sisaPagu)}</div>
            </div>
            <div style={{ background: 'var(--danger-s)', borderRadius: 8, padding: 8, color: 'var(--danger)' }}>
              <ArrowDownCircle size={18} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tambah Anggaran</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--success)', letterSpacing: '-0.04em', marginTop: 4 }}>{formatRp(stats.totalTambah)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{transactions.filter(t => t.tipe === 'tambah').length} transaksi penambahan</div>
            </div>
            <div style={{ background: 'var(--success-s)', borderRadius: 8, padding: 8, color: 'var(--success)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pengurangan Anggaran</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--warning)', letterSpacing: '-0.04em', marginTop: 4 }}>{formatRp(stats.totalPengurangan)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{transactions.filter(t => t.tipe === 'pengurangan').length} transaksi pengurangan</div>
            </div>
            <div style={{ background: 'var(--warning-s)', borderRadius: 8, padding: 8, color: 'var(--warning)' }}>
              <TrendingDown size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Serapan */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={14} style={{ color: 'var(--blue)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Tingkat Serapan Anggaran</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: Number(stats.persen) > 80 ? 'var(--danger)' : 'var(--success)' }}>
            {stats.persen}%
          </span>
        </div>
        <div style={{ background: 'var(--border)', height: 10, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            background: Number(stats.persen) > 80
              ? 'linear-gradient(90deg, var(--warning), var(--danger))'
              : 'linear-gradient(90deg, var(--blue), var(--success))',
            height: '100%',
            width: `${Math.min(Number(stats.persen), 100)}%`,
            transition: 'width 0.5s ease',
            borderRadius: 6
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: 'var(--text-4)' }}>
          <span>Rp 0</span>
          <span>Pagu Efektif: {formatRp(stats.totalPagu)}</span>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="filter-pills" style={{ marginBottom: 0 }}>
        {[
          { key: 'semua', label: `Semua (${transactions.length})` },
          { key: 'pengeluaran', label: `📤 Pengeluaran (${transactions.filter(t => t.tipe === 'pengeluaran').length})` },
          { key: 'tambah', label: `📈 Tambah Anggaran (${transactions.filter(t => t.tipe === 'tambah').length})` },
          { key: 'pengurangan', label: `📉 Pengurangan (${transactions.filter(t => t.tipe === 'pengurangan').length})` },
        ].map(tab => (
          <button key={tab.key}
            className={`pill${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Riwayat Transaksi Anggaran ({filteredTrx.length})</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No Ref & Tanggal</th>
                <th>Tipe</th>
                <th>Nama Kegiatan / Keterangan</th>
                <th>Komisi</th>
                <th>Kategori</th>
                <th>Nominal</th>
                <th style={{ textAlign: 'center', width: 60 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrx.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-4)' }}>
                    Belum ada transaksi anggaran.
                  </td>
                </tr>
              ) : (
                filteredTrx.map(t => {
                  const cfg = tipeConfig[t.tipe] || tipeConfig.pengeluaran;
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 12 }}>{t.id}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{t.tanggal}</div>
                      </td>
                      <td>
                        <span className={`badge ${cfg.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{t.kegiatan}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{t.keterangan}</div>
                      </td>
                      <td><span className="badge badge-gray">{t.komisi}</span></td>
                      <td><span className="badge badge-blue">{t.kategori}</span></td>
                      <td style={{
                        fontWeight: 800, whiteSpace: 'nowrap',
                        color: t.tipe === 'tambah' ? 'var(--success)' : t.tipe === 'pengurangan' ? 'var(--warning)' : 'var(--danger)'
                      }}>
                        {t.tipe === 'tambah' ? '+' : '−'} {formatRp(t.nominal)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-danger btn-icon-sm"
                          title="Hapus transaksi"
                          onClick={() => handleDelete(t.id, t.kegiatan)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Transaksi */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header" style={{
              borderBottom: `3px solid ${
                modalTipe === 'tambah' ? 'var(--success)' :
                modalTipe === 'pengurangan' ? 'var(--warning)' : 'var(--danger)'
              }`
            }}>
              <div className="modal-title" style={{
                color: modalTipe === 'tambah' ? 'var(--success)' :
                       modalTipe === 'pengurangan' ? 'var(--warning)' : 'var(--danger)',
                display: 'flex', alignItems: 'center', gap: 7
              }}>
                {modalTipe === 'tambah' ? <TrendingUp size={18} /> :
                 modalTipe === 'pengurangan' ? <TrendingDown size={18} /> : <ArrowDownCircle size={18} />}
                {modalTipe === 'tambah' ? 'Tambah Anggaran (Pagu)' :
                 modalTipe === 'pengurangan' ? 'Pengurangan Anggaran (Pagu)' : 'Catat Pengeluaran Anggaran'}
              </div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="form-group">
                  <label className="form-label">
                    {modalTipe === 'tambah' ? 'Sumber / Dasar Penambahan *' :
                     modalTipe === 'pengurangan' ? 'Dasar / Alasan Pengurangan *' : 'Nama Kegiatan *'}
                  </label>
                  <input
                    type="text" className="form-input" required
                    placeholder={
                      modalTipe === 'tambah' ? 'Contoh: APBD Perubahan, Hibah, dll.' :
                      modalTipe === 'pengurangan' ? 'Contoh: Efisiensi Belanja, Rasionalisasi' :
                      'Contoh: Rapat Kerja Komisi I'
                    }
                    value={form.kegiatan}
                    onChange={e => setForm({ ...form, kegiatan: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Komisi</label>
                    <select className="form-select" value={form.komisi} onChange={e => setForm({ ...form, komisi: e.target.value })}>
                      <option>Semua Komisi</option>
                      <option>Komisi I</option>
                      <option>Komisi II</option>
                      <option>Komisi III</option>
                      <option>Komisi IV</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select className="form-select" value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })}>
                      {modalTipe === 'tambah' ? (
                        <>
                          <option>Penambahan Pagu</option>
                          <option>APBD Perubahan</option>
                          <option>Dana Hibah</option>
                          <option>Dana Alokasi Khusus</option>
                        </>
                      ) : modalTipe === 'pengurangan' ? (
                        <>
                          <option>Pengurangan Pagu</option>
                          <option>Efisiensi Belanja</option>
                          <option>Rasionalisasi Anggaran</option>
                          <option>Recofusing Anggaran</option>
                        </>
                      ) : (
                        <>
                          <option>Konsumsi Rapat</option>
                          <option>Perjalanan Dinas</option>
                          <option>Honorarium Pakar</option>
                          <option>ATK & Percetakan</option>
                          <option>Sewa Sarana</option>
                          <option>Lain-lain</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nominal (Rp) *</label>
                  <input
                    type="number" className="form-input" required min={1}
                    placeholder="Contoh: 25000000"
                    value={form.nominal}
                    onChange={e => setForm({ ...form, nominal: e.target.value })}
                  />
                  {form.nominal && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                      = {formatRp(form.nominal)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan / Dasar Hukum</label>
                  <textarea
                    className="form-textarea" rows={3}
                    placeholder="Detail nota, nomor surat, atau dasar pengurangan..."
                    value={form.keterangan}
                    onChange={e => setForm({ ...form, keterangan: e.target.value })}
                  />
                </div>

                <div className="modal-footer" style={{ margin: '0 -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      background: modalTipe === 'tambah' ? 'var(--success)' :
                                  modalTipe === 'pengurangan' ? 'var(--warning)' : undefined,
                      borderColor: modalTipe === 'tambah' ? 'var(--success)' :
                                   modalTipe === 'pengurangan' ? 'var(--warning)' : undefined,
                    }}
                  >
                    {modalTipe === 'tambah' ? '+ Simpan Penambahan' :
                     modalTipe === 'pengurangan' ? '− Simpan Pengurangan' : 'Simpan Pengeluaran'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
