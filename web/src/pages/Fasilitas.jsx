import React, { useState, useEffect } from 'react';
import { Building, Calendar, Users, Plus, CheckCircle, Clock, AlertTriangle, Monitor, Mic, Coffee, Trash2, Edit2, XCircle, Search, Filter } from 'lucide-react';
import { logActivity } from '../utils/audit';

const INITIAL_ROOMS = [
  { id: 'R1', nama: 'Ruang Rapat Komisi I', kapasitas: 30, lokasi: 'Lantai 2 Gedung A' },
  { id: 'R2', nama: 'Ruang Rapat Komisi II', kapasitas: 30, lokasi: 'Lantai 2 Gedung A' },
  { id: 'R3', nama: 'Ruang Rapat Komisi III', kapasitas: 30, lokasi: 'Lantai 3 Gedung A' },
  { id: 'R4', nama: 'Ruang Rapat Komisi IV', kapasitas: 30, lokasi: 'Lantai 3 Gedung A' },
  { id: 'R5', nama: 'Ruang Paripurna Utama', kapasitas: 150, lokasi: 'Gedung Utama' },
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
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('sim_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('sim_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [showModal, setShowModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('Semua');

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

  const [formRoom, setFormRoom] = useState({
    nama: '',
    kapasitas: 30,
    lokasi: ''
  });

  useEffect(() => {
    localStorage.setItem('sim_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('sim_rooms', JSON.stringify(rooms));
  }, [rooms]);

  const openAddBooking = () => {
    setEditingBooking(null);
    setFormBooking({
      ruangan: rooms[0]?.nama || 'Ruang Rapat Komisi I',
      tanggal: new Date().toISOString().split('T')[0],
      jamMulai: '09:00',
      jamSelesai: '11:00',
      kegiatan: '',
      pemohon: 'Petugas Komisi',
      proyektor: true,
      mic: true,
      snack: true
    });
    setShowModal(true);
  };

  const openEditBooking = (b) => {
    setEditingBooking(b.id);
    setFormBooking({
      ruangan: b.ruangan,
      tanggal: b.tanggal,
      jamMulai: b.jamMulai,
      jamSelesai: b.jamSelesai,
      kegiatan: b.kegiatan,
      pemohon: b.pemohon,
      proyektor: b.fasilitas.includes('Proyektor'),
      mic: b.fasilitas.includes('Microphone'),
      snack: b.fasilitas.includes('Konsumsi / Snack')
    });
    setShowModal(true);
  };

  const handleSaveBooking = (e) => {
    e.preventDefault();

    // Check for conflict with existing active bookings
    const hasConflict = bookings.some(b => 
      b.id !== editingBooking &&
      b.status === 'Disetujui' &&
      b.ruangan === formBooking.ruangan &&
      b.tanggal === formBooking.tanggal &&
      ((formBooking.jamMulai >= b.jamMulai && formBooking.jamMulai < b.jamSelesai) ||
       (formBooking.jamSelesai > b.jamMulai && formBooking.jamSelesai <= b.jamSelesai))
    );

    if (hasConflict) {
      alert('⚠️ PERINGATAN BENTROK: Ruangan tersebut sudah dipesan untuk jadwal aktif pada jam yang dipilih! Pembatalan/penghapusan booking sebelumnya membebaskan ruangan ini.');
      return;
    }

    const fasList = [];
    if (formBooking.proyektor) fasList.push('Proyektor');
    if (formBooking.mic) fasList.push('Microphone');
    if (formBooking.snack) fasList.push('Konsumsi / Snack');

    if (editingBooking) {
      const updated = bookings.map(b => b.id === editingBooking ? {
        ...b,
        ruangan: formBooking.ruangan,
        tanggal: formBooking.tanggal,
        jamMulai: formBooking.jamMulai,
        jamSelesai: formBooking.jamSelesai,
        kegiatan: formBooking.kegiatan,
        pemohon: formBooking.pemohon,
        fasilitas: fasList
      } : b);
      setBookings(updated);
      logActivity('BOOKING_ROOM_EDIT', `Memperbarui peminjaman ${formBooking.ruangan} untuk ${formBooking.kegiatan}`);
    } else {
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
    }

    setShowModal(false);
  };

  const handleDeleteBooking = (booking) => {
    if (confirm(`⚠️ Hapus reservasi "${booking.kegiatan}" di ${booking.ruangan}?\nRuangan akan langsung kembali TERSEDIA untuk peminjaman agenda rapat lain.`)) {
      const updated = bookings.filter(b => b.id !== booking.id);
      setBookings(updated);
      logActivity('BOOKING_ROOM_DELETE', `Menghapus reservasi ${booking.ruangan} (${booking.kegiatan}). Ruangan dibebaskan.`);
    }
  };

  const handleChangeStatus = (booking, newStatus) => {
    const updated = bookings.map(b => b.id === booking.id ? { ...b, status: newStatus } : b);
    setBookings(updated);
    logActivity('BOOKING_STATUS_CHANGE', `Mengubah status reservasi ${booking.ruangan} menjadi ${newStatus}`);
  };

  const handleAddRoom = (e) => {
    e.preventDefault();
    if (!formRoom.nama.trim()) return alert('Nama ruangan harus diisi');
    const newRoom = {
      id: `R-${Date.now().toString().slice(-4)}`,
      nama: formRoom.nama,
      kapasitas: parseInt(formRoom.kapasitas) || 30,
      lokasi: formRoom.lokasi || 'Gedung DPRD'
    };
    setRooms([...rooms, newRoom]);
    logActivity('ROOM_ADD', `Menambah master ruangan baru: ${newRoom.nama}`);
    setShowRoomModal(false);
    setFormRoom({ nama: '', kapasitas: 30, lokasi: '' });
  };

  const handleDeleteRoom = (room) => {
    if (confirm(`Hapus ruangan "${room.nama}"?`)) {
      setRooms(rooms.filter(r => r.id !== room.id));
      logActivity('ROOM_DELETE', `Menghapus master ruangan: ${room.nama}`);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter(b => {
    const matchRoom = filterRoom === 'Semua' || b.ruangan === filterRoom;
    const matchSearch = b.kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.pemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.ruangan.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRoom && matchSearch;
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>Ruangan &amp; Fasilitas</h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>Peminjaman Ruang Rapat Komisi, Pembatalan &amp; Pelepasan Ruangan untuk Agenda Lain</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowRoomModal(true)}>
            <Building size={16} /> + Tambah Ruangan
          </button>
          <button className="btn btn-primary" onClick={openAddBooking}>
            <Plus size={16} /> Booking Ruang Rapat
          </button>
        </div>
      </div>

      {/* Grid Ruangan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        {rooms.map(room => {
          const activeBooking = bookings.find(b => 
            b.ruangan === room.nama &&
            b.tanggal === todayStr &&
            b.status === 'Disetujui'
          );
          const isBusy = !!activeBooking;

          return (
            <div key={room.id} className="card" style={{ padding: 18, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{room.nama}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge ${isBusy ? 'badge-orange' : 'badge-green'}`}>
                    {isBusy ? 'Terpakai' : 'Tersedia'}
                  </span>
                  {rooms.length > 1 && (
                    <button 
                      className="btn btn-ghost btn-icon-sm"
                      title="Hapus Master Ruangan"
                      onClick={() => handleDeleteRoom(room)}
                      style={{ color: 'var(--danger)', padding: 2 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
                📍 {room.lokasi} • 👥 Kapasitas {room.kapasitas} orang
              </div>
              {isBusy ? (
                <div style={{ fontSize: 11.5, background: 'var(--warning-s)', color: '#92400E', padding: '6px 10px', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
                  <strong>Agenda Hari Ini:</strong> {activeBooking.kegiatan} ({activeBooking.jamMulai}–{activeBooking.jamSelesai})
                </div>
              ) : (
                <div style={{ fontSize: 11.5, color: 'var(--success)', marginTop: 8, fontWeight: 600 }}>
                  ✓ Siap digunakan untuk agenda rapat baru
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Daftar Booking & Tabel Reservasi */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title">Jadwal &amp; Riwayat Peminjaman Ruangan</div>

          {/* Filter & Search */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Cari agenda/pemohon..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 32, fontSize: 12, height: 34 }}
              />
            </div>
            <select
              className="form-select"
              value={filterRoom}
              onChange={e => setFilterRoom(e.target.value)}
              style={{ fontSize: 12, height: 34, width: 180 }}
            >
              <option value="Semua">Semua Ruangan</option>
              {rooms.map(r => (
                <option key={r.id} value={r.nama}>{r.nama}</option>
              ))}
            </select>
          </div>
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
                <th style={{ textAlign: 'center', width: 140 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-4)' }}>Tidak ada data reservasi ruangan.</td></tr>
              ) : (
                filteredBookings.map(b => {
                  let statusBadgeClass = 'badge-green';
                  if (b.status === 'Batal') statusBadgeClass = 'badge-red';
                  if (b.status === 'Selesai') statusBadgeClass = 'badge-blue';

                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>{b.ruangan}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-2)' }}>{b.tanggal}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--blue)', marginTop: 2, fontWeight: 600 }}>
                          <Clock size={11} /> {b.jamMulai} – {b.jamSelesai}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>{b.kegiatan}</td>
                      <td style={{ color: 'var(--text-2)' }}>{b.pemohon}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {b.fasilitas.map((f, idx) => (
                            <span key={idx} className="badge badge-purple" style={{ fontSize: 10 }}>{f}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass}`}>{b.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          {b.status === 'Disetujui' && (
                            <button
                              className="btn btn-warning btn-sm btn-icon"
                              title="Tandai Batal (Bebaskan Ruangan)"
                              onClick={() => handleChangeStatus(b, 'Batal')}
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Edit Reservasi"
                            onClick={() => openEditBooking(b)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            title="Hapus Reservasi Ruangan"
                            onClick={() => handleDeleteBooking(b)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Booking */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">{editingBooking ? '✏️ Edit Peminjaman Ruangan' : '➕ Form Peminjaman Ruang Rapat'}</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveBooking}>
                <div className="form-group">
                  <label className="form-label">Pilih Ruangan</label>
                  <select className="form-select" value={formBooking.ruangan} onChange={e => setFormBooking({ ...formBooking, ruangan: e.target.value })}>
                    {rooms.map(r => (
                      <option key={r.id} value={r.nama}>{r.nama} (Kapasitas {r.kapasitas} orang)</option>
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
                  <label className="form-label">Pemohon / Penanggung Jawab</label>
                  <input type="text" className="form-input" required value={formBooking.pemohon} onChange={e => setFormBooking({ ...formBooking, pemohon: e.target.value })} />
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
                <div className="modal-footer" style={{ margin: '16px -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">{editingBooking ? 'Simpan Perubahan' : 'Konfirmasi Booking'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Room Baru */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title">🏢 Tambah Master Ruangan Baru</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowRoomModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddRoom}>
                <div className="form-group">
                  <label className="form-label">Nama Ruangan</label>
                  <input type="text" className="form-input" placeholder="Contoh: Ruang Rapat Mediasi" required value={formRoom.nama} onChange={e => setFormRoom({ ...formRoom, nama: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kapasitas (Orang)</label>
                  <input type="number" className="form-input" required min="5" max="500" value={formRoom.kapasitas} onChange={e => setFormRoom({ ...formRoom, kapasitas: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Lokasi / Lantai</label>
                  <input type="text" className="form-input" placeholder="Contoh: Lantai 1 Gedung B" value={formRoom.lokasi} onChange={e => setFormRoom({ ...formRoom, lokasi: e.target.value })} />
                </div>
                <div className="modal-footer" style={{ margin: '16px -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Ruangan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
