import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, RefreshCw } from 'lucide-react';

export default function WebCameraScanner({ onCapture, onClose }) {
  const webcamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3 className="modal-title">Webcam Scanner / Ambil Foto Dokumen</h3>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000', position: 'relative' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode }}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
            Posisikan berkas dokumen atau formulir presensi tepat di depan kamera komputer/laptop.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={toggleCamera}>
            <RefreshCw size={15} /> Putar Kamera
          </button>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button className="btn btn-primary" onClick={capture}>
              <Camera size={16} /> Ambil Foto / Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
