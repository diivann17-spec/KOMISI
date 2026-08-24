import { useState, useEffect } from 'react';
import { userStorage, clearAllData, seedMockData } from '../utils/storage';
import { logoutUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, RefreshCw, Plus, Trash2, Users, Shield, Info } from 'lucide-react';
import { logActivity } from '../utils/audit';

const INITIAL_KOMISI_USERS = [
  { id: 'u1', nama: 'Ir. H. Ahmad Sudirman, M.Si', username: 'ahmad_komisi1', komisi: 'Komisi I', jabatan: 'Ketua' },
  { id: 'u2', nama: 'H. Ridwan Kamil, M.M.', username: 'ridwan_komisi2', komisi: 'Komisi II', jabatan: 'Ketua' },
  { id: 'u3', nama: 'Dr. H. Hendra Wijaya', username: 'hendra_komisi3', komisi: 'Komisi III', jabatan: 'Ketua' },
  { id: 'u4', nama: 'Hj. Siti Rahmawati, S.Pd.', username: 'siti_komisi4', komisi: 'Komisi IV', jabatan: 'Ketua' },
];

export default function MenuPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [komisiUsers, setKomisiUsers] = useState(() => {
    const saved = localStorage.getItem('sim_komisi_users');
    return saved ? JSON.parse(saved) : INITIAL_KOMISI_USERS;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [formUser, setFormUser] = useState({
    nama: '',
    username: '',
    komisi: 'Komisi I',
    jabatan: 'Anggota'
  });

  useEffect(() => {
    setUser(userStorage.getCurrentUser());
  }, []);

  useEffect(() => {
    localStorage.setItem('sim_komisi_users', JSON.stringify(komisiUsers));
  }, [komisiUsers]);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      try {
        await logoutUser();
        userStorage.clearCurrentUser();
        navigate('/login');
      } catch (err) {
        alert('Gagal logout: ' + err.message);
      }
    }
  };

  const handleResetData = () => {
    if (confirm('RESET DATA: Apakah Anda yakin ingin mengembalikan semua data ke setelan awal (mock data)?')) {
      clearAllData();
      seedMockData();
      alert('Data berhasil di-reset.');
      window.location.reload();
    }
  };

  const handleAddKomisiUser = (e) => {
    e.preventDefault();
    if (!formUser.nama.trim() || !formUser.username.trim()) return alert('Nama dan username wajib diisi.');
    const newUser = {
      id: `u-${Date.now()}`,
      nama: formUser.nama.trim(),
      username: formUser.username.trim().toLowerCase(),
      komisi: formUser.komisi,
      jabatan: formUser.jabatan
    };
    setKomisiUsers([newUser, ...komisiUsers]);
    logActivity('USER_ADD', `Menambah user baru ${newUser.nama} untuk ${newUser.komisi}`);
    setShowAddModal(false);
    setFormUser({ nama: '', username: '', komisi: 'Komisi I', jabatan: 'Anggota' });
  };

  const handleDeleteKomisiUser = (u) => {
    if (confirm(`Hapus user "${u.nama}" (${u.komisi})?`)) {
      setKomisiUsers(komisiUsers.filter(item => item.id !== u.id));
      logActivity('USER_DELETE', `Menghapus user ${u.nama} (${u.komisi})`);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pengaturan &amp; Manajemen User Komisi 1–4</h1>
        <p>Kelola profil akun pengguna, anggota Komisi I–IV, dan pemeliharaan aplikasi</p>
      </div>

      <div className="grid-2 mb-6">
        {/* User Current Info Card */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: 'var(--navy)',
                color: 'var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              {(user?.displayName || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{user?.displayName || 'Admin'}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{user?.roleLabel || 'Sekretariat DPRD'}</p>
              <span className="badge badge-blue" style={{ marginTop: 4 }}>
                Username: {user?.username || 'admin'}
              </span>
            </div>
          </div>
          <button className="btn btn-danger w-full btn-lg" onClick={handleLogout}>
            <LogOut size={18} /> Keluar dari Sistem
          </button>
        </div>

        {/* System Reset Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Sistem &amp; Pemeliharaan</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
            Jika Anda mengalami kendala tampilan atau data tidak sesuai, Anda dapat mengembalikan data lokal aplikasi ke data standar awal.
          </p>
          <button className="btn btn-secondary w-full" onClick={handleResetData}>
            <RefreshCw size={16} /> Reset Data ke Setelan Awal
          </button>
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={14} /> SIM Kegiatan Komisi I–IV DPRD Edition v1.0.0 (Vite React)
          </div>
        </div>
      </div>

      {/* MANAJEMEN USER KOMISI 1 - 4 */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title">👥 Manajemen User Komisi 1, 2, 3, 4</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Daftar user dan penugasan anggota dewan pada Komisi I–IV</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> Tambah User Komisi
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Anggota / User</th>
                <th>Username</th>
                <th>Penugasan Komisi</th>
                <th>Jabatan</th>
                <th style={{ textAlign: 'center', width: 90 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {komisiUsers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-4)' }}>Belum ada user Komisi terdaftar.</td></tr>
              ) : (
                komisiUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text)' }}>{u.nama}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 600 }}>@{u.username}</td>
                    <td>
                      <span className="badge badge-purple">{u.komisi}</span>
                    </td>
                    <td><span className="badge badge-yellow">{u.jabatan}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        title="Hapus User Komisi"
                        onClick={() => handleDeleteKomisiUser(u)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH USER KOMISI */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="modal-title">👤 Tambah User Komisi Baru</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddKomisiUser}>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap &amp; Gelar *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Dra. Hj. Siti Rahmawati"
                    required
                    value={formUser.nama}
                    onChange={e => setFormUser({ ...formUser, nama: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Username Login *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: siti_komisi4"
                    required
                    value={formUser.username}
                    onChange={e => setFormUser({ ...formUser, username: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Pilih Komisi</label>
                    <select
                      className="form-select"
                      value={formUser.komisi}
                      onChange={e => setFormUser({ ...formUser, komisi: e.target.value })}
                    >
                      <option value="Komisi I">Komisi I</option>
                      <option value="Komisi II">Komisi II</option>
                      <option value="Komisi III">Komisi III</option>
                      <option value="Komisi IV">Komisi IV</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jabatan</label>
                    <select
                      className="form-select"
                      value={formUser.jabatan}
                      onChange={e => setFormUser({ ...formUser, jabatan: e.target.value })}
                    >
                      <option value="Ketua">Ketua</option>
                      <option value="Wakil Ketua">Wakil Ketua</option>
                      <option value="Sekretaris">Sekretaris</option>
                      <option value="Anggota">Anggota</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ margin: '16px -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan User Komisi</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
