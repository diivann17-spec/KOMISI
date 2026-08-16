import React, { useState, useEffect } from 'react';
import { Users, QrCode, UserCheck, Plus, Search, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { logActivity } from '../utils/audit';

const INITIAL_GUESTS = [
  {
    id: 'TM-001',
    nama: 'Dr. Ir. Budi Santoso, M.Si',
    instansi: 'Dinas Pekerjaan Umum',
    jabatan: 'Kepala Dinas',
    noHp: '081234567890',
    agenda: 'Rapat Kerja Komisi III - Evaluasi Jalan Daerah',
    statusHadir: 'Hadir',
    jamHadir: '09:15',
    honorarium: 'Rp 1.500.000',
    qrCode: 'GUEST-TM-001-PU'
  },
  {
    id: 'TM-002',
    nama: 'Prof. Ahmad Dahlan',
    instansi: 'Universitas Negeri',
    jabatan: 'Pakar Hukum Tata Negara',
    noHp: '081987654321',
    agenda: 'Dengar Pendapat Ranperda Komisi I',
    statusHadir: 'Belum Hadir',
    jamHadir: '-',
    honorarium: 'Rp 2.500.000',
    qrCode: 'GUEST-TM-002-UN'
  }
];

export default function TamuPage() {
  const [guests, setGuests] = useState(() => {
    const saved = localStorage.getItem('sim_tamu');
    return saved ? JSON.parse(saved) : INITIAL_GUESTS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);

  const [formTamu, setFormTamu] = useState({
    nama: '',
    instansi: '',
    jabatan: '',
    noHp: '',
    agenda: 'Rapat Kerja Komisi I',
    honorarium: 'Rp 1.000.000'
  });

  useEffect(() => {
    localStorage.setItem('sim_tamu', JSON.stringify(guests));
  }, [guests]);

  const handleAddGuest = (e) => {
    e.preventDefault();
    const guestId = `TM-${Date.now().toString().slice(-4)}`;
    const newGuest = {
      id: guestId,
      ...formTamu,
      statusHadir: 'Belum Hadir',
      jamHadir: '-',
      qrCode: `GUEST-${guestId}`
    };

    setGuests([newGuest, ...guests]);
    logActivity('TAMU_ADD', `Registrasi tamu baru ${newGuest.nama} (${newGuest.instansi})`);
    setShowModal(false);
    setFormTamu({
      nama: '',
      instansi: '',
      jabatan: '',
      noHp: '',
      agenda: 'Rapat Kerja Komisi I',
      honorarium: 'Rp 1.000.000'
    });
  };

  const handleMarkPresent = (id) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setGuests(prev => prev.map(g => {
      if (g.id === id) {
        logActivity('TAMU_PRESENSI', `Presensi tamu ${g.nama} berhasil dicatat.`);
        return { ...g, statusHadir: 'Hadir', jamHadir: timeNow };
      }
      return g;
    }));
  };

  const filteredGuests = guests.filter(g =>
    g.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.instansi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.agenda.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Tamu &amp; Narasumber Eksternal
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>
            Registrasi Tamu, Undangan QR Whatsapp, Absensi Tamu &amp; Honorarium
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Tambah Tamu / Narasumber
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
        <div className="stat-card">
          <div className="stat-label">Total Undangan Tamu</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{guests.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tamu Sudah Hadir</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {guests.filter(g => g.statusHadir === 'Hadir').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Belum Hadir</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {guests.filter(g => g.statusHadir === 'Belum Hadir').length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Cari nama tamu, instansi, atau agenda rapat..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table Tamu */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Daftar Undangan Tamu &amp; Narasumber</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama &amp; Jabatan</th>
                <th>Instansi</th>
                <th>Agenda Rapat</th>
                <th>Honorarium</th>
                <th>Status Kehadiran</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-4)' }}>
                    Tidak ditemukan data tamu.
                  </td>
                </tr>
              ) : (
                filteredGuests.map(g => (
                  <tr key={g.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{g.nama}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{g.jabatan} • {g.noHp}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{g.instansi}</td>
                    <td style={{ maxWidth: 250, fontSize: 12 }}>{g.agenda}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{g.honorarium}</td>
                    <td>
                      {g.statusHadir === 'Hadir' ? (
                        <span className="badge badge-green">Hadir ({g.jamHadir})</span>
                      ) : (
                        <span className="badge badge-orange">Belum Hadir</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Lihat QR Code Undangan"
                          onClick={() => setSelectedQR(g)}
                        >
                          <QrCode size={13} /> QR
                        </button>
                        {g.statusHadir === 'Belum Hadir' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMarkPresent(g.id)}
                          >
                            <UserCheck size={13} /> Hadirkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrasi Tamu */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">Registrasi Tamu / Narasumber</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddGuest}>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap &amp; Gelar</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Dr. Budi Santoso, M.Si"
                    required
                    value={formTamu.nama}
                    onChange={e => setFormTamu({ ...formTamu, nama: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Instansi / Lembaga</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Dinas PU"
                      required
                      value={formTamu.instansi}
                      onChange={e => setFormTamu({ ...formTamu, instansi: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jabatan</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Kepala Dinas"
                      required
                      value={formTamu.jabatan}
                      onChange={e => setFormTamu({ ...formTamu, jabatan: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">No. WhatsApp / HP</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0812xxxx"
                      required
                      value={formTamu.noHp}
                      onChange={e => setFormTamu({ ...formTamu, noHp: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Honorarium (Opsional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formTamu.honorarium}
                      onChange={e => setFormTamu({ ...formTamu, honorarium: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Agenda Rapat yang Dihadiri</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Rapat Dengar Pendapat Evaluasi Anggaran"
                    required
                    value={formTamu.agenda}
                    onChange={e => setFormTamu({ ...formTamu, agenda: e.target.value })}
                  />
                </div>

                <div className="modal-footer" style={{ margin: '14px -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Generate QR &amp; Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal View QR Code */}
      {selectedQR && (
        <div className="modal-overlay" onClick={() => setSelectedQR(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center' }}>
            <div className="modal-header">
              <div className="modal-title">QR Undangan Tamu</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setSelectedQR(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
                {selectedQR.nama} ({selectedQR.instansi})
              </p>
              
              <div style={{ background: '#fff', padding: 14, borderRadius: 12, display: 'inline-block', border: '1px solid var(--border)', marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
                <QRCodeSVG value={selectedQR.qrCode} size={180} />
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, fontFamily: 'monospace', background: 'var(--surface2)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                Kode: {selectedQR.qrCode}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary w-full" onClick={() => setSelectedQR(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
