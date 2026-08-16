import React, { useState, useEffect } from 'react';
import { Building, Calendar, Users, Plus, CheckCircle, Clock, AlertTriangle, Monitor, Mic, Coffee } from 'lucide-react';
import { logActivity } from '../utils/audit';

const INITIAL_ROOMS = [
  { id: 'R1', nama: 'Ruang Rapat Komisi I', kapasitas: 30, lokasi: 'Lantai 2 Gedung A', status: 'Tersedia' },
  { id: 'R2', nama: 'Ruang Rapat Komisi II', kapasitas: 30, lokasi: 'Lantai 2 Gedung A', status: 'Tersedia' },
  { id: 'R3', nama: 'Ruang Rapat Komisi III', kapasitas: 30, lokasi: 'Lantai 3 Gedung A', status: 'Tersedia' },
  { id: 'R4', nama: 'Ruang Rapat Komisi IV', kapasitas: 30, lokasi: 'Lantai 3 Gedung A', status: 'Tersedia' },
  { id: 'R5', nama: 'Ruang Paripurna Utama', kapasitas: 150, lokasi: 'Gedung Utama', status: 'Tersedia' },
];

const INITIAL_BOOKINGS = [
  {
    id: 'BK-101',
    ruangan: 'Ruang Rapat Komisi II',
    tanggal: new Date().toISOString().split('T')[0],
    jamMulai: '10:00',
    jamSelesai: '12:00',
    kegiatan: 'Rapat Kerja Bersama Dinas Keuangan',
    pemohon: 'Sekretariat Komisi II',
    fasilitas: ['Proyektor', 'Microphone', 'Konsumsi / Snack'],
    status: 'Disetujui'
  }
];

export default function FasilitasPage() {
  const [rooms] = useState(INITIAL_ROOMS);
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('sim_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });
  
  const [showModal, setShowModal] = useState(false);
  const [formBooking, setFormBooking] = useState({
    ruangan: 'Ruang Rapat Komisi I',
    tanggal: new Date().toISOString().split('T')[0],
    jamMulai: '09:00',
    jamSelesai: '11:00',
    kegiatan: '',
    pemohon: 'Petugas Komisi',
    proyektor: true,
    mic: true,
    snack: true
  });

  useEffect(() => {
    localStorage.setItem('sim_bookings', JSON.stringify(bookings));
  }, [bookings]);

  const handleCreateBooking = (e) => {
    e.preventDefault();
    
    // Check for conflict
    const hasConflict = bookings.some(b => 
      b.ruangan === formBooking.ruangan &&
      b.tanggal === formBooking.tanggal &&
      ((formBooking.jamMulai >= b.jamMulai && formBooking.jamMulai < b.jamSelesai) ||
       (formBooking.jamSelesai > b.jamMulai && formBooking.jamSelesai <= b.jamSelesai))
    );

    if (hasConflict) {
      alert('⚠️ PERINGATAN BENTROK: Ruangan tersebut sudah dipesan pada tanggal dan jam yang dipilih!');
      return;
    }

    const fasList = [];
    if (formBooking.proyektor) fasList.push('Proyektor');
    if (formBooking.mic) fasList.push('Microphone');
    if (formBooking.snack) fasList.push('Konsumsi / Snack');

    const newBooking = {
      id: `BK-${Date.now().toString().slice(-4)}`,
      ruangan: formBooking.ruangan,
      tanggal: formBooking.tanggal,
      jamMulai: formBooking.jamMulai,
      jamSelesai: formBooking.jamSelesai,
      kegiatan: formBooking.kegiatan,
      pemohon: formBooking.pemohon,
      fasilitas: fasList,
      status: 'Disetujui'
    };

    setBookings([newBooking, ...bookings]);
    logActivity('BOOKING_ROOM_ADD', `Pemesanan ${newBooking.ruangan} untuk ${newBooking.kegiatan}`);
    setShowModal(false);
    setFormBooking({
      ruangan: 'Ruang Rapat Komisi I',
      tanggal: new Date().toISOString().split('T')[0],
      jamMulai: '09:00',
      jamSelesai: '11:00',
      kegiatan: '',
      pemohon: 'Petugas Komisi',
      proyektor: true,
      mic: true,
      snack: true
    });
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>Ruangan &amp; Fasilitas</h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>Peminjaman Ruang Rapat Komisi &amp; Permintaan Fasilitas Kegiatan</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Booking Ruang Rapat
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {rooms.map(room => {
          const isBusy = bookings.some(b => b.ruangan === room.nama && b.tanggal === new Date().toISOString().split('T')[0]);
          return (
            <div key={room.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{room.nama}</div>
                <span className={`badge ${isBusy ? 'badge-orange' : 'badge-green'}`}>
                  {isBusy ? 'Terpakai' : 'Tersedia'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                📍 {room.lokasi} • 👥 {room.kapasitas} orang
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Jadwal Peminjaman Ruangan</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ruangan</th>
                <th>Tanggal &amp; Waktu</th>
                <th>Kegiatan / Agenda</th>
                <th>Pemohon</th>
                <th>Fasilitas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-4)' }}>Belum ada reservasi ruangan.</td></tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text)' }}>{b.ruangan}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{b.tanggal}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--blue)', marginTop: 2 }}>
                        <Clock size={11} /> {b.jamMulai} – {b.jamSelesai}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.kegiatan}</td>
                    <td>{b.pemohon}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {b.fasilitas.map((f, idx) => (
                          <span key={idx} className="badge badge-gray" style={{ fontSize: 10 }}>{f}</span>
                        ))}
                      </div>
                    </td>
                    <td><span className="badge badge-green">{b.status}</span></td>
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
              <div className="modal-title">Form Peminjaman Ruang Rapat</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateBooking}>
                <div className="form-group">
                  <label className="form-label">Pilih Ruangan</label>
                  <select className="form-select" value={formBooking.ruangan} onChange={e => setFormBooking({ ...formBooking, ruangan: e.target.value })}>
                    {rooms.map(r => (
                      <option key={r.id} value={r.nama}>{r.nama} (Kapasitas {r.kapasitas})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Pelaksanaan</label>
                  <input type="date" className="form-input" required value={formBooking.tanggal} onChange={e => setFormBooking({ ...formBooking, tanggal: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Jam Mulai</label>
                    <input type="time" className="form-input" required value={formBooking.jamMulai} onChange={e => setFormBooking({ ...formBooking, jamMulai: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jam Selesai</label>
                    <input type="time" className="form-input" required value={formBooking.jamSelesai} onChange={e => setFormBooking({ ...formBooking, jamSelesai: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Kegiatan / Agenda</label>
                  <input type="text" className="form-input" placeholder="Contoh: Rapat Dengar Pendapat Komisi I" required value={formBooking.kegiatan} onChange={e => setFormBooking({ ...formBooking, kegiatan: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fasilitas Tambahan</label>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                    {[['proyektor', 'Proyektor'], ['mic', 'Microphone'], ['snack', 'Konsumsi / Snack']].map(([key, lbl]) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' }}>
                        <input type="checkbox" checked={formBooking[key]} onChange={e => setFormBooking({ ...formBooking, [key]: e.target.checked })} />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="modal-footer" style={{ margin: '0 -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Konfirmasi Booking</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
