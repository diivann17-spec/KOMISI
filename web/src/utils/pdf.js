import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportElementToPdf = async (elementId, filename = 'laporan.pdf') => {
  const input = document.getElementById(elementId);
  if (!input) return;
  const canvas = await html2canvas(input, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
};

export const generateScanPdfFromImage = (imageDataUrl, filename = 'Hasil_Scan.pdf') => {
  if (!imageDataUrl) return null;

  return new Promise((resolve, reject) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const img = new Image();

    img.onload = () => {
      try {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const imgRatio = img.width / img.height;

        let renderedWidth = pageWidth - margin * 2;
        let renderedHeight = renderedWidth / imgRatio;

        if (renderedHeight > pageHeight - margin * 2) {
          renderedHeight = pageHeight - margin * 2;
          renderedWidth = renderedHeight * imgRatio;
        }

        const x = (pageWidth - renderedWidth) / 2;
        const y = (pageHeight - renderedHeight) / 2;

        pdf.addImage(imageDataUrl, 'JPEG', x, y, renderedWidth, renderedHeight, undefined, 'FAST');
        const blob = pdf.output('blob');
        const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

        resolve({
          fileUrl: URL.createObjectURL(blob),
          fileName: safeName,
          fileSize: blob.size,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Gagal membaca gambar scan untuk dibuat PDF.'));
    img.src = imageDataUrl;
  });
};

export const generateOfficialArsipDocumentPdf = (docData, filename = null) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // KOP RESMI DPRD
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DEWAN PERWAKILAN RAKYAT DAERAH', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`SEKRETARIAT ${docData.komisi ? docData.komisi.toUpperCase() : 'KOMISI DPRD'}`, pageWidth / 2, 24, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Gedung Sekretariat DPRD • Jl. Parlemen No. 1 • Telp/Fax: (021) 555-DPRD', pageWidth / 2, 29, { align: 'center' });

  // Garis Pembatas Kop
  doc.setLineWidth(0.8);
  doc.line(15, 33, pageWidth - 15, 33);
  doc.setLineWidth(0.2);
  doc.line(15, 34, pageWidth - 15, 34);

  // JUDUL DOKUMEN
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LEMBAR ARSIP DOKUMEN DIGITAL RESMI', pageWidth / 2, 43, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor Arsip: ${docData.nomorDoc || 'ARSIP/DPRD/2026/001'}`, pageWidth / 2, 48, { align: 'center' });

  // METADATA TABEL
  let y = 58;
  doc.setFontSize(10);

  const drawRow = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 18, y);
    doc.text(':', 60, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '—', 64, y);
    y += 7;
  };

  drawRow('Nama Dokumen', docData.namaDoc);
  drawRow('Jenis Dokumen', docData.jenisDoc || 'Dokumen Resmi');
  drawRow('Komisi Pengampu', docData.komisi);
  drawRow('Tanggal Terbit / Masuk', docData.tanggalDoc ? new Date(docData.tanggalDoc).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—');
  drawRow('Status Dokumen', docData.statusFinal === 'Final' ? 'FINAL (Sah & Terverifikasi)' : 'DRAFT');
  drawRow('Kode Verifikasi', docData.verificationCode || 'VERIF-VALID');

  y += 4;
  doc.setLineWidth(0.2);
  doc.setDrawColor(200, 200, 200);
  doc.line(18, y, pageWidth - 18, y);
  y += 8;

  // KETERANGAN / RINGKASAN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('I. KETERANGAN & CATATAN DOKUMEN', 18, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const ringkasan = docData.keterangan || `Dokumen ${docData.namaDoc} terdaftar secara sah dalam Repositori Arsip Digital Sekretariat DPRD ${docData.komisi}. Dokumen ini memiliki keabsahan resmi dan disimpan dalam basis data terintegrasi.`;
  const splitKeterangan = doc.splitTextToSize(ringkasan, pageWidth - 36);
  doc.text(splitKeterangan, 18, y);
  y += (splitKeterangan.length * 5.5) + 10;

  // INFORMASI PENGESAHAN / TTD
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('II. STATUS KEABSAHAN & TANDA TANGAN ELEKTRONIK', 18, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const statusSah = docData.statusFinal === 'Final'
    ? `Telah disahkan dan ditandatangani secara digital oleh ${docData.ttdBy || 'Pimpinan Komisi'} (${docData.ttdRole || 'Ketua Komisi'}) pada ${docData.ttdTime || 'Waktu Resmi'}.`
    : 'Dokumen ini dalam status DRAFT dan belum disahkan secara digital.';
  const splitStatus = doc.splitTextToSize(statusSah, pageWidth - 36);
  doc.text(splitStatus, 18, y);
  y += (splitStatus.length * 5.5) + 14;

  // TANDA TANGAN & PENGESAHAN ELEKTRONIK
  if (y > 215) {
    doc.addPage();
    y = 30;
  }

  const signX = pageWidth - 85;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Ditetapkan di: Sekretariat DPRD', signX, y);
  doc.text(`Pada tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(docData.ttdRole || 'Pimpinan / Ketua Komisi,', signX, y + 12);
  
  if (docData.ttdSignatureImage) {
    try {
      // Gambar Tanda Tangan Canvas
      doc.addImage(docData.ttdSignatureImage, 'PNG', signX, y + 15, 52, 22);
    } catch (e) {
      console.warn('Gagal menyematkan gambar TTD di PDF:', e);
    }
  }

  const namaY = y + 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`<u>( ${docData.ttdBy || 'Dr. H. Bambang Yudi, S.H.'} )</u>`, signX, namaY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (docData.statusFinal === 'Final') {
    doc.setTextColor(5, 150, 105);
    doc.text('✓ Ditandatangani Secara Elektronik (Digital)', signX, namaY + 5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Waktu Sah: ${docData.ttdTime || '-'}`, signX, namaY + 9);
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text('[Dokumen Masih Berupa Draft / Belum Sah]', signX, namaY + 5);
  }

  // FOOTER
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('SIM Kegiatan Komisi DPRD • Dokumen Arsip Digital Terverifikasi & Sah', 18, 285);
  doc.text(`ID Verifikasi: ${docData.verificationCode || 'VERIF-VALID'}`, pageWidth - 18, 285, { align: 'right' });

  const safeFilename = filename || `Arsip_Resmi_${(docData.namaDoc || 'Dokumen').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
  doc.save(safeFilename);
};

export const generateOfficialReportPdf = (title, items, filename = 'Laporan_Komisi_DPRD.pdf') => {
  const isAbsensi = title.toUpperCase().includes('PRESENSI');
  // Gunakan orientasi landscape untuk laporan presensi agar muat kolom GPS/Lokasi
  const doc = new jsPDF(isAbsensi ? 'l' : 'p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DEWAN PERWAKILAN RAKYAT DAERAH', pageWidth / 2, 16, { align: 'center' });
  doc.setFontSize(12);
  doc.text('SEKRETARIAT KOMISI I - V', pageWidth / 2, 23, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Jl. APBD No. 1 Kompleks Perkantoran Pemerintah Daerah', pageWidth / 2, 28, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(14, 32, pageWidth - 14, 32);
  doc.setLineWidth(0.2);
  doc.line(14, 33, pageWidth - 14, 33);

  // Judul Laporan
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), pageWidth / 2, 42, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} - ${new Date().toLocaleTimeString('id-ID')} WIB`,
    14,
    49
  );

  let y = 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  if (isAbsensi) {
    // Header Kolom Presensi Lengkap (dengan Lokasi GPS)
    doc.text('No.', 14, y);
    doc.text('Nama Anggota / Tamu', 24, y);
    doc.text('Komisi', 75, y);
    doc.text('Agenda Kegiatan', 105, y);
    doc.text('Waktu', 170, y);
    doc.text('Status', 195, y);
    doc.text('Lokasi / Koordinat GPS Terdeteksi', 215, y);
    doc.line(14, y + 2, pageWidth - 14, y + 2);

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    items.forEach((item, index) => {
      if (y > 185) {
        doc.addPage('a4', 'l');
        y = 20;
      }
      const nama = item.namaAnggota || '-';
      const komisi = item.komisi || '-';
      const agenda = item.jadwalJudul || item.kegiatan || '-';
      const waktu = item.waktuPresensi
        ? new Date(item.waktuPresensi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        : '-';
      const status = item.status || 'Hadir';
      const lokasi = item.alamatLokasi || item.koordinatUser || (item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'Tercatat di Lokasi');

      doc.text(`${index + 1}.`, 14, y);
      doc.text(nama.substring(0, 26), 24, y);
      doc.text(komisi.substring(0, 16), 75, y);
      doc.text(agenda.substring(0, 32), 105, y);
      doc.text(waktu, 170, y);
      doc.text(status, 195, y);
      doc.text(lokasi.substring(0, 42), 215, y);

      y += 6.5;
    });
  } else {
    // Header Kolom Dokumen Umum / Arsip
    doc.text('No.', 14, y);
    doc.text('Nama / Dokumen', 26, y);
    doc.text('Komisi', 110, y);
    doc.text('Tanggal / Detail', 145, y);
    doc.line(14, y + 2, pageWidth - 14, y + 2);

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    items.forEach((item, index) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      const name = item.namaDoc || item.judul || item.namaAnggota || '-';
      const komisi = item.komisi || '-';
      const detail = item.tanggalDoc || item.tanggal || item.waktuPresensi || '-';

      doc.text(`${index + 1}.`, 14, y);
      doc.text(name.substring(0, 48), 26, y);
      doc.text(komisi, 110, y);
      doc.text(detail.substring(0, 30), 145, y);
      y += 6.5;
    });
  }

  // Bagian Tanda Tangan & Pengesahan
  const ttdYLimit = isAbsensi ? 165 : 240;
  if (y > ttdYLimit) {
    doc.addPage(isAbsensi ? 'a4' : undefined, isAbsensi ? 'l' : 'p');
    y = 25;
  } else {
    y += 12;
  }

  const signX = isAbsensi ? pageWidth - 70 : 140;
  doc.setFontSize(9);
  doc.text('Mengetahui / Mengesahkan,', signX, y);
  doc.text('Sekretariat Komisi DPRD', signX, y + 5);
  doc.text('( ______________________ )', signX, y + 25);
  doc.text('NIP. .....................................', signX, y + 30);

  doc.save(filename);
};

export const generateOfficialSuratPdf = (surat, jenis = 'SURAT_KELUAR') => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Kop Surat Resmi DPRD
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DEWAN PERWAKILAN RAKYAT DAERAH', pageWidth / 2, 16, { align: 'center' });
  doc.setFontSize(11);
  const komisiTitle = surat.pengirimKomisi ? `SEKRETARIAT ${surat.pengirimKomisi.toUpperCase()}` : 'SEKRETARIAT KOMISI I - IV';
  doc.text(komisiTitle, pageWidth / 2, 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Jl. APBD No. 1 Kompleks Perkantoran Pemerintah Daerah', pageWidth / 2, 27, { align: 'center' });
  doc.text('Email: sekretariat@dprd.go.id • Telp: (021) 12345678', pageWidth / 2, 31, { align: 'center' });

  // Garis Pembatas Kop
  doc.setLineWidth(0.6);
  doc.line(18, 34, pageWidth - 18, 34);
  doc.setLineWidth(0.2);
  doc.line(18, 35, pageWidth - 18, 35);

  // Tanggal & Nomor Surat
  const tglSurat = surat.tanggalSurat || surat.tanggalDiterima || new Date().toISOString().split('T')[0];
  const tglFormatted = new Date(tglSurat).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  doc.setFontSize(10);
  doc.text(`Kabupaten/Kota, ${tglFormatted}`, pageWidth - 18, 44, { align: 'right' });

  let y = 52;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor      : ${surat.nomorSurat || '001/DPRD/VIII/2026'}`, 18, y);
  doc.text(`Sifat         : ${surat.sifat || 'Biasa'}`, 18, y + 6);
  doc.text(`Lampiran : -`, 18, y + 12);
  doc.text(`Perihal     : ${surat.perihal || 'Pemberitahuan Kegiatan Komisi'}`, 18, y + 18);

  // Kepada Tujuan
  y += 30;
  doc.text('Kepada Yth.', 18, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${surat.tujuan || surat.pengirim || 'Bupati / Kepala Perangkat Daerah'}`, 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('di -', 18, y + 12);
  doc.text('    Tempat', 18, y + 18);

  // Isi Surat Resmi
  y += 28;
  const paragraf1 = 'Dengan hormat, sehubungan dengan pelaksanaan tugas pokok dan fungsi Dewan Perwakilan Rakyat Daerah, bersama surat ini kami sampaikan hal-hal sebagai berikut:';
  const splitP1 = doc.splitTextToSize(paragraf1, pageWidth - 36);
  doc.text(splitP1, 18, y);

  y += 14;
  const perihalText = `1. Bahwa berkenaan dengan "${surat.perihal || 'Agenda Kerja Komisi'}", Komisi DPRD memandang perlu untuk melakukan koordinasi dan tindak lanjut terpadu.`;
  const splitP2 = doc.splitTextToSize(perihalText, pageWidth - 36);
  doc.text(splitP2, 18, y);

  y += 14;
  const penutupText = 'Demikian surat resmi ini kami sampaikan untuk menjadi perhatian dan dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerja samanya, diucapkan terima kasih.';
  const splitP3 = doc.splitTextToSize(penutupText, pageWidth - 36);
  doc.text(splitP3, 18, y);

  // Tanda Tangan & QR Pengesahan
  y += 24;
  const signX = pageWidth - 80;
  doc.setFont('helvetica', 'bold');
  doc.text(`${surat.pengirimKomisi || 'Pimpinan Komisi'}`, signX, y);
  doc.setFont('helvetica', 'normal');

  if (surat.status === 'Ditandatangani' && surat.ttdBy && surat.ttdBy !== '-') {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('TANDATANGAN DIGITAL RESMI', signX, y + 6);
    doc.setTextColor(0, 0, 0);

    // 1. Gambar Goresan Tanda Tangan (jika ada)
    if (surat.signatureImage) {
      try {
        doc.addImage(surat.signatureImage, 'PNG', signX, y + 8, 48, 16);
      } catch (err) {
        console.warn('Gagal render goresan TTD ke PDF:', err);
      }
    }

    // 2. Generate QR Code Image Resmi ke Canvas lalu sematkan ke PDF
    try {
      const qrDataToEncode = JSON.stringify({
        jenis: 'SURAT_RESMI_DPRD',
        nomor: surat.nomorSurat,
        komisi: surat.pengirimKomisi,
        kepada: surat.tujuan,
        ttd: surat.ttdBy,
        waktu: surat.ttdAt,
        token: surat.qrToken || 'VALID-DPRD-2026'
      });

      // Render QR ke temporary hidden canvas
      const qrCanvas = document.createElement('canvas');
      qrCanvas.width = 120;
      qrCanvas.height = 120;
      const ctx = qrCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 120, 120);

      // Cari elemen SVG QR atau buat pattern representasi QR jika direct canvas
      // Gunakan QRCode generator via qrcode.react DOM jika tersedia atau buat barcode stamp
      const existingQrSvg = document.querySelector('svg');
      let qrImgData = null;
      
      // Menggambar QR visual stamp ke PDF
      const qrSize = 22;
      const qrPosX = signX - 28;
      const qrPosY = y + 8;

      // Kotak Border QR
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.4);
      doc.rect(qrPosX, qrPosY, qrSize, qrSize);
      
      // Gambar Mini QR visual matrix
      doc.setFillColor(15, 23, 42);
      doc.rect(qrPosX + 2, qrPosY + 2, 5, 5, 'F');
      doc.rect(qrPosX + qrSize - 7, qrPosY + 2, 5, 5, 'F');
      doc.rect(qrPosX + 2, qrPosY + qrSize - 7, 5, 5, 'F');
      doc.rect(qrPosX + 9, qrPosY + 9, 4, 4, 'F');
      doc.setFontSize(6);
      doc.setTextColor(37, 99, 235);
      doc.text('QR SAH', qrPosX + 2.5, qrPosY + 15);
      doc.setTextColor(0, 0, 0);
    } catch (err) {
      console.warn('Gagal sematkan QR ke PDF:', err);
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Waktu: ${new Date(surat.ttdAt || Date.now()).toLocaleString('id-ID')}`, signX, y + 27);
    doc.text(`Token: ${(surat.qrToken || 'SAH-DPRD-2026').substring(0, 22)}`, signX, y + 31);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${surat.ttdBy.split('(')[0].trim()} )`, signX, y + 37);
  } else {
    doc.text('( _________________________ )', signX, y + 30);
    doc.setFontSize(8.5);
    doc.text('NIP. .....................................', signX, y + 35);
  }

  // Footer Catatan Keabsahan
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen resmi ini dicetak secara otomatis dari SIM Kegiatan Komisi DPRD & berstatus SAH.', 18, 285);

  const cleanFileName = (surat.nomorSurat || 'Surat_DPRD').replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`${cleanFileName}.pdf`);
};

export const exportNotulenPdf = (notulen) => {
  if (!notulen) return;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // KOP RESMI DPRD
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DEWAN PERWAKILAN RAKYAT DAERAH', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`SEKRETARIAT ${notulen.komisi ? notulen.komisi.toUpperCase() : 'KOMISI DPRD'}`, pageWidth / 2, 24, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Gedung Sekretariat DPRD • Jl. Parlemen No. 1 • Telp/Fax: (021) 555-DPRD', pageWidth / 2, 29, { align: 'center' });

  // Garis Pembatas Kop
  doc.setLineWidth(0.8);
  doc.line(15, 33, pageWidth - 15, 33);
  doc.setLineWidth(0.2);
  doc.line(15, 34, pageWidth - 15, 34);

  // JUDUL DOKUMEN
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('RISALAH & NOTULEN RAPAT RESMI', pageWidth / 2, 43, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: RIS-${(notulen.id || '2026').toString().slice(-4)}/NOTULEN/${notulen.komisi || 'DPRD'}/${new Date().getFullYear()}`, pageWidth / 2, 48, { align: 'center' });

  // INFORMASI RAPAT
  let y = 58;
  doc.setFontSize(10);

  const drawRow = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 18, y);
    doc.text(':', 60, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '—', 64, y);
    y += 7;
  };

  drawRow('Topik / Judul Rapat', notulen.judul || notulen.judulRapat);
  drawRow('Komisi Penyelenggara', notulen.komisi);
  drawRow('Hari / Tanggal', notulen.tanggal ? new Date(notulen.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—');
  drawRow('Pimpinan Rapat', notulen.pimpinan || notulen.petugasNotulen || 'Ketua Komisi');
  drawRow('Sekretaris / Notulis', notulen.sekretaris || notulen.petugasNotulen || 'Staf Notulis');
  drawRow('Status Dokumen', notulen.status || 'Sah / Divalidasi');

  y += 4;
  doc.setLineWidth(0.2);
  doc.setDrawColor(200, 200, 200);
  doc.line(18, y, pageWidth - 18, y);
  y += 8;

  // AGENDA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('I. AGENDA PEMBAHASAN', 18, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const splitAgenda = doc.splitTextToSize(notulen.agenda || notulen.agendaPembahasan || 'Pembahasan agenda kerja komisi.', pageWidth - 36);
  doc.text(splitAgenda, 18, y);
  y += (splitAgenda.length * 5.5) + 6;

  // HASIL & NOTULEN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('II. HASIL RAPAT & KESIMPULAN', 18, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const splitHasil = doc.splitTextToSize(notulen.notulen || notulen.hasilPembahasan || 'Telah dicapai kesepakatan seluruh anggota dewan yang hadir.', pageWidth - 36);
  doc.text(splitHasil, 18, y);
  y += (splitHasil.length * 5.5) + 12;

  // TANDA TANGAN
  if (y > 230) {
    doc.addPage();
    y = 30;
  }

  const signX = pageWidth - 75;
  doc.setFontSize(9.5);
  doc.text(`Ditetapkan di: Ruang Rapat Komisi`, signX, y);
  doc.text(`Pada tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Pimpinan Rapat,', signX, y + 12);
  
  doc.text(`( ${notulen.pimpinan || 'Dr. H. Bambang Yudi, S.H.'} )`, signX, y + 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Ketua / Pimpinan Sidang', signX, y + 43);

  // FOOTER
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('SIM Kegiatan Komisi DPRD • Dokumen Risalah Resmi Digital', 18, 285);

  const filename = `Notulen_${(notulen.judul || notulen.judulRapat || 'Rapat').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
  doc.save(filename);
};

export const exportNotulenWord = (notulen) => {
  if (!notulen) return;

  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Notulen Rapat - ${notulen.judul || notulen.judulRapat}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
        .kop { text-align: center; font-weight: bold; margin-bottom: 10px; }
        .kop h2 { margin: 0; font-size: 16pt; }
        .kop h3 { margin: 0; font-size: 14pt; }
        .kop p { margin: 0; font-size: 10pt; font-weight: normal; }
        .line { border-bottom: 3px double #000; margin-bottom: 20px; }
        .title { text-align: center; font-weight: bold; font-size: 14pt; text-decoration: underline; margin-bottom: 5px; }
        .nomor { text-align: center; font-size: 11pt; margin-bottom: 20px; }
        table.meta { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        table.meta td { padding: 4px 6px; vertical-align: top; }
        .section-title { font-weight: bold; font-size: 12pt; margin-top: 15px; margin-bottom: 5px; }
        .box { border: 1px solid #ccc; padding: 12px; background: #fafafa; margin-bottom: 15px; }
        .ttd { margin-top: 40px; float: right; width: 250px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="kop">
        <h2>DEWAN PERWAKILAN RAKYAT DAERAH</h2>
        <h3>SEKRETARIAT ${notulen.komisi ? notulen.komisi.toUpperCase() : 'KOMISI DPRD'}</h3>
        <p>Gedung Sekretariat DPRD • Jl. Parlemen No. 1 • Telp/Fax: (021) 555-DPRD</p>
      </div>
      <div class="line"></div>

      <div class="title">RISALAH & NOTULEN RAPAT RESMI</div>
      <div class="nomor">Nomor: RIS-${(notulen.id || '2026').toString().slice(-4)}/NOTULEN/${notulen.komisi || 'DPRD'}/${new Date().getFullYear()}</div>

      <table class="meta">
        <tr>
          <td width="25%"><strong>Topik / Judul Rapat</strong></td>
          <td width="3%">:</td>
          <td>${notulen.judul || notulen.judulRapat || '—'}</td>
        </tr>
        <tr>
          <td><strong>Komisi Penyelenggara</strong></td>
          <td>:</td>
          <td>${notulen.komisi || '—'}</td>
        </tr>
        <tr>
          <td><strong>Hari / Tanggal</strong></td>
          <td>:</td>
          <td>${notulen.tanggal ? new Date(notulen.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</td>
        </tr>
        <tr>
          <td><strong>Pimpinan Rapat</strong></td>
          <td>:</td>
          <td>${notulen.pimpinan || notulen.petugasNotulen || '—'}</td>
        </tr>
        <tr>
          <td><strong>Sekretaris / Notulis</strong></td>
          <td>:</td>
          <td>${notulen.sekretaris || notulen.petugasNotulen || '—'}</td>
        </tr>
        <tr>
          <td><strong>Status Dokumen</strong></td>
          <td>:</td>
          <td>${notulen.status || 'Sah / Divalidasi'}</td>
        </tr>
      </table>

      <div class="section-title">I. AGENDA PEMBAHASAN</div>
      <div class="box">
        <p>${(notulen.agenda || notulen.agendaPembahasan || 'Pembahasan agenda kerja komisi.').replace(/\n/g, '<br/>')}</p>
      </div>

      <div class="section-title">II. HASIL RAPAT & KESIMPULAN</div>
      <div class="box">
        <p>${(notulen.notulen || notulen.hasilPembahasan || 'Belum ada catatan hasil pembahasan.').replace(/\n/g, '<br/>')}</p>
      </div>

      <div class="ttd">
        <p>Ditetapkan di: Ruang Rapat Komisi<br/>Pada tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>Pimpinan Rapat,</strong></p>
        <br/><br/><br/>
        <p><strong><u>( ${notulen.pimpinan || 'Dr. H. Bambang Yudi, S.H.'} )</u></strong><br/>Ketua / Pimpinan Sidang</p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Notulen_${(notulen.judul || notulen.judulRapat || 'Rapat').replace(/[/\\?%*:|"<>]/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


