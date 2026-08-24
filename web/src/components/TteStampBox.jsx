import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function TteStampBox({
  jabatan = 'KEPALA DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL KOTA SALATIGA',
  nama = 'Drs. NOEGROHO AGOES SETIJONO',
  nip = 'NIP. 19670802 199703 1 002',
  verificationUrl = '',
  signatureImage = null,
  width = 340
}) {
  return (
    <div style={{ width: width, margin: '0 auto', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      {/* Judul Merah di atas border */}
      <div style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
        Tanda Tangan Elektronik (TTE) / QR Code
      </div>

      {/* Box Bingkai Merah */}
      <div style={{
        border: '3px solid #DC2626',
        borderRadius: 4,
        padding: '14px 16px 10px',
        background: '#FFFFFF',
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)',
        position: 'relative'
      }}>
        {/* Teks Jabatan (Atas) */}
        <div style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#1E293B',
          lineHeight: 1.35,
          textTransform: 'uppercase',
          marginBottom: 10,
          letterSpacing: 0.2
        }}>
          {jabatan}
        </div>

        {/* QR Code (Tengah) */}
        <div style={{ position: 'relative', display: 'inline-block', margin: '4px 0 10px' }}>
          <div style={{ background: '#FFF', padding: 4, display: 'inline-block' }}>
            <QRCodeSVG value={verificationUrl || 'https://dprd.go.id'} size={110} level="H" includeMargin={false} />
          </div>

          {/* Canvas TTD Goresan jika ada overlay */}
          {signatureImage && (
            <img
              src={signatureImage}
              alt="Goresan TTD"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxHeight: 70,
                maxWidth: 160,
                pointerEvents: 'none',
                opacity: 0.85
              }}
            />
          )}
        </div>

        {/* Nama Tergarisbawah & NIP (Bawah) */}
        <div style={{ marginTop: 2 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#0F172A',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            textTransform: 'uppercase'
          }}>
            {nama}
          </div>
          <div style={{ fontSize: 10.5, color: '#475569', marginTop: 3, fontWeight: 600 }}>
            {nip}
          </div>
        </div>
      </div>
    </div>
  );
}
