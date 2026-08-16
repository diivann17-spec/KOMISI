import { useState, useEffect } from 'react';
import { userStorage, clearAllData, seedMockData } from '../utils/storage';
import { logoutUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, RefreshCw, Shield, Info } from 'lucide-react';

export default function MenuPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(userStorage.getCurrentUser());
  }, []);

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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pengaturan & Profil</h1>
        <p>Kelola akun pengguna dan konfigurasi aplikasi web</p>
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: 24 }}>
          <div className="flex items-center gap-4 mb-4">
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
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>{user?.displayName || 'Admin'}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{user?.roleLabel || 'Sekretariat DPRD'}</p>
              <span className="badge badge-blue mt-auto" style={{ marginTop: 4 }}>
                Username: {user?.username || 'admin'}
              </span>
            </div>
          </div>
          <div className="divider" />
          <button className="btn btn-danger w-full btn-lg" onClick={handleLogout}>
            <LogOut size={18} /> Keluar dari Sistem
          </button>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Sistem & Pemeliharaan</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
            Jika Anda mengalami kendala tampilan atau data tidak sesuai, Anda dapat mengembalikan data lokal aplikasi ke data standar awal.
          </p>
          <button className="btn btn-secondary w-full" onClick={handleResetData}>
            <RefreshCw size={16} /> Reset Data ke Setelan Awal
          </button>

          <div className="divider" />
          <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-3)' }}>
            <Info size={14} />
            <span>SIM Kegiatan Komisi I–V DPRD Web Edition v1.0.0 (Vite React)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
