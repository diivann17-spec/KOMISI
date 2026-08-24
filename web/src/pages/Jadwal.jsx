import React, { useState, useEffect } from 'react';
import { jadwalStorage, notifikasiStorage, formatDate } from '../utils/storage';
import { DAFTAR_KOMISI, KOMISI_COLORS } from '../constants/theme';
import { Plus, X, Calendar as CalendarIcon, MapPin, Clock, Edit2, Trash2, QrCode, AlertCircle, ChevronLeft, ChevronRight, Grid, List as ListIcon, Flag, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { logActivity } from '../utils/audit';

// DATASET HARI LIBUR & HARI BESAR NASIONAL INDONESIA
const HARI_LIBUR_NASIONAL = [
  { tanggal: '2026-01-01', nama: 'Tahun Baru 2026 Masehi', tipe: 'Libur Nasional' },
  { tanggal: '2026-01-16', nama: 'Isra Mikraj Nabi Muhammad SAW', tipe: 'Libur Nasional' },
  { tanggal: '2026-02-17', nama: 'Tahun Baru Imlek 2577 Kongzili', tipe: 'Libur Nasional' },
  { tanggal: '2026-03-19', nama: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', tipe: 'Libur Nasional' },
  { tanggal: '2026-03-20', nama: 'Hari Raya Idul Fitri 1447 H (Hari Pertama)', tipe: 'Libur Nasional' },
  { tanggal: '2026-03-21', nama: 'Hari Raya Idul Fitri 1447 H (Hari Kedua)', tipe: 'Libur Nasional' },
  { tanggal: '2026-04-03', nama: 'Wafat Yesus Kristus (Jumat Agung)', tipe: 'Libur Nasional' },
  { tanggal: '2026-05-01', nama: 'Hari Buruh Internasional', tipe: 'Libur Nasional' },
  { tanggal: '2026-05-14', nama: 'Kenaikan Yesus Kristus', tipe: 'Libur Nasional' },
  { tanggal: '2026-05-27', nama: 'Hari Raya Idul Adha 1447 H', tipe: 'Libur Nasional' },
  { tanggal: '2026-05-31', nama: 'Hari Raya Waisak 2570 BE', tipe: 'Libur Nasional' },
  { tanggal: '2026-06-01', nama: 'Hari Lahir Pancasila', tipe: 'Libur Nasional' },
  { tanggal: '2026-06-16', nama: 'Tahun Baru Islam 1448 Hijriah', tipe: 'Libur Nasional' },
  { tanggal: '2026-08-17', nama: 'Hari Kemerdekaan Republik Indonesia (HUT RI Ke-81)', tipe: 'Libur Nasional' },
  { tanggal: '2026-08-25', nama: 'Maulid Nabi Muhammad SAW', tipe: 'Libur Nasional' },
  { tanggal: '2026-10-01', nama: 'Hari Kesaktian Pancasila', tipe: 'Hari Besar Nasional' },
  { tanggal: '2026-10-28', nama: 'Hari Sumpah Pemuda', tipe: 'Hari Besar Nasional' },
  { tanggal: '2026-11-10', nama: 'Hari Pahlawan', tipe: 'Hari Besar Nasional' },
  { tanggal: '2026-12-22', nama: 'Hari Ibu', tipe: 'Hari Besar Nasional' },
  { tanggal: '2026-12-25', nama: 'Hari Raya Natal', tipe: 'Libur Nasional' },
];

const JENIS = ['Rapat Komisi','Rapat Kerja','Rapat Dengar Pendapat','Kunjungan Kerja','Audiensi','Reses','Kegiatan Internal','Lainnya'];
const STATUS_BADGE = { aktif: 'badge-blue', selesai: 'badge-green', batal: 'badge-red', tunda: 'badge-yellow' };
const EMPTY = { judul:'', tanggal: new Date().toISOString().split('T')[0], waktuMulai:'08:00', waktuSelesai:'10:00', lokasi:'Ruang Rapat Komisi I', komisi:'Komisi I', jenisKegiatan:'Rapat Komisi', keterangan:'', alasanPerubahan:'', status:'aktif' };

const TIME_PRESETS = [
  { label: '08:00 - 10:00', start: '08:00', end: '10:00' },
  { label: '10:00 - 12:00', start: '10:00', end: '12:00' },
  { label: '13:00 - 15:00', start: '13:00', end: '15:00' },
  { label: '15:00 - 17:00', start: '15:00', end: '17:00' },
];

export default function JadwalPage() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('Semua');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [showModal, setShowModal] = useState(false);
  const [qrModalItem, setQrModalItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  const load = () => {
    let all = jadwalStorage.getAll();
    if (filter !== 'Semua' && filter !== 'LiburNasional') {
      all = all.filter(j => j.komisi === filter);
    }
    setList(all.sort((a, b) => a.tanggal < b.tanggal ? 1 : -1));
  };

  useEffect(load, [filter]);

  const openAdd = (dateStr = null) => {
    setForm({
      ...EMPTY,
      tanggal: dateStr || new Date().toISOString().split('T')[0],
      komisi: (filter !== 'Semua' && filter !== 'LiburNasional') ? filter : 'Komisi I'
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setForm({ ...item, alasanPerubahan: item.alasanPerubahan || '' });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.judul.trim() || !form.tanggal) return alert('Judul dan tanggal wajib diisi.');
    
    if (editId) {
      jadwalStorage.update(editId, form);
      logActivity('JADWAL_UPDATE', `Memperbarui kegiatan "${form.judul}". Alasan: ${form.alasanPerubahan || 'Perubahan rutin'}`);
    } else {
      jadwalStorage.add(form);
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
    if (confirm(`Hapus agenda "${item.judul}"?`)) {
      jadwalStorage.delete(item.id);
      logActivity('JADWAL_DELETE', `Menghapus kegiatan: ${item.judul}`);
      load();
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarCells = [];
  // Previous month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const dateObj = new Date(year, month - 1, d);
    const dateStr = dateObj.toISOString().split('T')[0];
    calendarCells.push({ day: d, isCurrentMonth: false, dateStr, isSunday: dateObj.getDay() === 0 });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    const dateObj = new Date(year, month, d);
    calendarCells.push({ day: d, isCurrentMonth: true, dateStr, isSunday: dateObj.getDay() === 0 });
  }
  // Next month padding
  const remaining = 35 - calendarCells.length;
  if (remaining > 0) {
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      const dateStr = dateObj.toISOString().split('T')[0];
      calendarCells.push({ day: d, isCurrentMonth: false, dateStr, isSunday: dateObj.getDay() === 0 });
    }
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    setCurrentDate(new Date(year, newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setCurrentDate(new Date(newYear, month, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const grouped = list.reduce((acc, item) => {
    const key = item.tanggal;
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="page">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>Jadwal Kegiatan Komisi &amp; Kalender Nasional</h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>Kalender Interaktif Rapat Komisi I–IV &amp; Hari Besar / Libur Nasional Indonesia</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
            <button
              className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('calendar')}
              title="Tampilan Kalender Visual"
            >
              <Grid size={15} /> Kalender Grid
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              title="Tampilan Daftar Agenda"
            >
              <ListIcon size={15} /> Daftar Agenda
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => openAdd()}>
            <Plus size={16} /> Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Filter Komisi & Hari Libur */}
      <div className="filter-pills mb-4" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {['Semua', ...DAFTAR_KOMISI.map(k => k.nama)].map(f => (
          <button
            key={f}
            className={`pill${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <button
          className={`pill${filter === 'LiburNasional' ? ' active' : ''}`}
          onClick={() => setFilter('LiburNasional')}
          style={{
            borderColor: '#EF4444',
            color: filter === 'LiburNasional' ? '#FFF' : '#DC2626',
            background: filter === 'LiburNasional' ? '#DC2626' : '#FEE2E2',
            fontWeight: 800
          }}
        >
          🇮🇩 Hari Libur Nasional
        </button>
      </div>

      {/* VIEW: CALENDAR GRID (Compact & Rapih) */}
      {viewMode === 'calendar' && (
        <div className="card mb-6" style={{ padding: 18 }}>
          {/* Calendar Header Controls + Dropdown Pilihan Bulan & Tahun */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>
                🗓️
              </div>
              {/* Select Pilihan Bulan */}
              <select
                className="form-select"
                value={month}
                onChange={handleMonthChange}
                style={{ width: 140, fontWeight: 800, fontSize: 13, height: 36, padding: '4px 30px 4px 10px' }}
              >
                {monthNames.map((mName, mIdx) => (
                  <option key={mIdx} value={mIdx}>{mName}</option>
                ))}
              </select>
              {/* Select Pilihan Tahun */}
              <select
                className="form-select"
                value={year}
                onChange={handleYearChange}
                style={{ width: 100, fontWeight: 800, fontSize: 13, height: 36, padding: '4px 30px 4px 10px' }}
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button className="btn btn-secondary btn-sm" onClick={todayMonth} style={{ height: 36, fontSize: 12 }}>
                Bulan Ini
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-icon-sm" onClick={prevMonth} title="Bulan Sebelumnya" style={{ width: 34, height: 34 }}>
                <ChevronLeft size={16} />
              </button>
              <button className="btn btn-secondary btn-icon-sm" onClick={nextMonth} title="Bulan Berikutnya" style={{ width: 34, height: 34 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Days Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center', fontWeight: 800, fontSize: 11.5, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <div style={{ color: '#DC2626' }}>MINGGU</div>
            <div>SENIN</div>
            <div>SELASA</div>
            <div>RABU</div>
            <div>KAMIS</div>
            <div>JUMAT</div>
            <div>SABTU</div>
          </div>

          {/* Calendar Grid Cells (Compact & Compact Size) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {calendarCells.map((cell, idx) => {
              const dayEvents = (filter === 'LiburNasional') ? [] : list.filter(j => j.tanggal === cell.dateStr);
              const nationalHoliday = HARI_LIBUR_NASIONAL.find(h => h.tanggal === cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              const isRedDay = cell.isSunday || !!nationalHoliday;

              return (
                <div
                  key={idx}
                  onClick={() => openAdd(cell.dateStr)}
                  style={{
                    minHeight: 70,
                    background: cell.isCurrentMonth
                      ? (isToday ? 'var(--blue-s)' : (nationalHoliday ? '#FEF2F2' : 'var(--surface)'))
                      : 'var(--surface2)',
                    border: isToday ? '2px solid var(--blue)' : (nationalHoliday ? '1px solid #FECACA' : '1px solid var(--border)'),
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 7px',
                    opacity: cell.isCurrentMonth ? 1 : 0.35,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  className="calendar-cell-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontWeight: (isToday || isRedDay) ? 900 : 700,
                      fontSize: 12,
                      color: isRedDay ? '#DC2626' : (isToday ? 'var(--blue)' : 'var(--text)'),
                      background: isToday ? 'var(--surface)' : 'transparent',
                      width: 20,
                      height: 20,
                      borderRadius: 99,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {cell.day}
                    </span>

                    {dayEvents.length > 0 && (
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--blue)', background: 'var(--surface)', padding: '1px 5px', borderRadius: 99, border: '1px solid var(--border)' }}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Hari Libur Nasional Indicator */}
                  {nationalHoliday && cell.isCurrentMonth && (
                    <div style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: '#991B1B',
                      background: '#FEE2E2',
                      padding: '2px 4px',
                      borderRadius: 4,
                      marginTop: 2,
                      lineHeight: 1.1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      borderLeft: '2px solid #DC2626'
                    }} title={nationalHoliday.nama}>
                      🇮🇩 {nationalHoliday.nama}
                    </div>
                  )}

                  {/* Day Events Pill */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                    {dayEvents.slice(0, 1).map(ev => {
                      const c = KOMISI_COLORS[ev.komisi] || { bg: '#DBEAFE', text: '#1D4ED8', accent: '#2563EB' };
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                          style={{
                            background: c.bg,
                            color: c.text,
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: '2px 4px',
                            borderRadius: 3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderLeft: `2px solid ${c.accent}`
                          }}
                          title={`${ev.komisi}: ${ev.judul} (${ev.waktuMulai} - ${ev.waktuSelesai})`}
                        >
                          {ev.waktuMulai} {ev.judul}
                        </div>
                      );
                    })}
                    {dayEvents.length > 1 && (
                      <div style={{ fontSize: 9, color: 'var(--blue)', fontWeight: 800, textAlign: 'right' }}>
                        +{dayEvents.length - 1} agenda lagi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legenda Keterangan Warna */}
          <div style={{ display: 'flex', gap: 14, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap', fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4F46E5' }} /> Komisi I
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#D97706' }} /> Komisi II
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#16A34A' }} /> Komisi III
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#DB2777' }} /> Komisi IV
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#DC2626' }} /> 🇮🇩 Hari Libur &amp; Hari Besar Nasional
            </div>
          </div>
        </div>
      )}

      {/* VIEW: LIST */}
      {viewMode === 'list' && (
        (filter === 'LiburNasional' ? HARI_LIBUR_NASIONAL : list).length === 0 ? (
          <div className="empty-state card" style={{ padding: 40, textAlign: 'center' }}>
            <CalendarIcon size={48} className="empty-state-icon" style={{ margin: '0 auto 12px', color: 'var(--text-4)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Belum Ada Agenda Jadwal</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Klik "Tambah Jadwal" untuk membuat kegiatan rapat komisi baru.</p>
          </div>
        ) : (
          filter === 'LiburNasional' ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title">🇮🇩 Daftar Hari Libur &amp; Hari Besar Nasional Indonesia</div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Hari / Peristiwa Besar</th>
                      <th>Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HARI_LIBUR_NASIONAL.map((h, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 800, color: '#DC2626', width: 140 }}>{h.tanggal}</td>
                        <td style={{ fontWeight: 800, color: 'var(--text)' }}>{h.nama}</td>
                        <td>
                          <span className={h.tipe === 'Libur Nasional' ? 'badge badge-red' : 'badge badge-yellow'}>
                            {h.tipe}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="mb-6">
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {formatDate(date)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(item => {
                    const c = KOMISI_COLORS[item.komisi] || { bg: '#F1F5F9', text: '#475569', accent: '#64748B' };
                    const isToday = item.tanggal === todayStr;
                    return (
                      <div key={item.id} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', borderLeft: `4px solid ${c.accent}` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span className="badge" style={{ background: c.bg, color: c.text }}>{item.komisi}</span>
                            <span className={`badge ${STATUS_BADGE[item.status] || 'badge-blue'}`}>{item.status}</span>
                            {isToday && <span className="badge badge-yellow">Hari Ini</span>}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{item.judul}</div>
                          <div style={{ display: 'flex', gap: 16, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--blue)', fontWeight: 700 }}>
                              <Clock size={12} /> {item.waktuMulai} – {item.waktuSelesai}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
                              <MapPin size={12} /> {item.lokasi || '—'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
                              <CalendarIcon size={12} /> {item.jenisKegiatan}
                            </span>
                          </div>
                          {item.alasanPerubahan && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--warning)', marginTop: 4, fontWeight: 600 }}>
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
          )
        )
      )}

      {/* Modal QR Code Absensi */}
      {qrModalItem && (
        <div className="modal-overlay" onClick={() => setQrModalItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
            <div className="modal-header">
              <h3 className="modal-title">📱 QR Code Absensi Kegiatan</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setQrModalItem(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{qrModalItem.judul}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
                {qrModalItem.komisi} • {qrModalItem.tanggal} • {qrModalItem.waktuMulai}–{qrModalItem.waktuSelesai}
              </p>

              <div style={{ background: '#fff', padding: 16, borderRadius: 14, display: 'inline-block', border: '3px solid var(--navy)', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <QRCodeSVG
                  value={`${window.location.origin}/presensi?jadwalId=${qrModalItem.id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div style={{ background: 'var(--surface2)', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>🔗 URL Presensi (scan untuk membuka):</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--blue)', wordBreak: 'break-all', fontWeight: 700 }}>
                  {window.location.origin}/presensi?jadwalId={qrModalItem.id}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary w-full" onClick={() => setQrModalItem(null)}>Tutup QR Code</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Jadwal dengan Preset Jam */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? '✏️ Edit Jadwal Kegiatan' : '➕ Tambah Jadwal Kegiatan Baru'}</h3>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Judul Kegiatan *</label>
                <input className="form-input" value={form.judul} onChange={e => setForm(p => ({...p, judul: e.target.value}))} placeholder="Contoh: Rapat Kerja Pembahasan RAPERDA No. 4" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Pilih Komisi *</label>
                  <select className="form-select" value={form.komisi} onChange={e => setForm(p => ({...p, komisi: e.target.value}))}>
                    {DAFTAR_KOMISI.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jenis Kegiatan</label>
                  <select className="form-select" value={form.jenisKegiatan} onChange={e => setForm(p => ({...p, jenisKegiatan: e.target.value}))}>
                    {JENIS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Tanggal Pelaksanaan *</label>
                  <input type="date" className="form-input" value={form.tanggal} onChange={e => setForm(p => ({...p, tanggal: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status Agenda</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
                    <option value="aktif">aktif (Terjadwal)</option>
                    <option value="selesai">selesai (Telah Selesai)</option>
                    <option value="batal">batal (Dibatalkan)</option>
                    <option value="tunda">tunda (Ditunda)</option>
                  </select>
                </div>
              </div>

              {/* Pengaturan Jam Presisi & Preset */}
              <div className="form-group mb-2">
                <label className="form-label">Pengaturan Jam Rapat (Preset Cepat)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                  {TIME_PRESETS.map((tp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`btn btn-sm ${form.waktuMulai === tp.start && form.waktuSelesai === tp.end ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setForm(p => ({ ...p, waktuMulai: tp.start, waktuSelesai: tp.end }))}
                      style={{ fontSize: 11, padding: '4px 6px' }}
                    >
                      {tp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                <label className="form-label">Keterangan / Detail Agenda</label>
                <textarea className="form-textarea" value={form.keterangan} onChange={e => setForm(p => ({...p, keterangan: e.target.value}))} placeholder="Catatan tambahan agenda rapat..." />
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
