/**
 * PDF Generator Helper
 * Menggunakan expo-print untuk generate PDF dari gambar scan
 */
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { generateId } from './storage';

/**
 * Generate PDF dari array URI gambar
 * @param {string[]} imageUris - Array URI gambar yang akan digabungkan
 * @param {string} title - Judul dokumen (opsional)
 * @returns {Promise<string>} URI file PDF yang dihasilkan
 */
export const generatePdfFromImages = async (imageUris, title = 'Dokumen Scan') => {
  try {
    // Konversi setiap gambar ke base64 untuk di-embed ke HTML
    const imagePages = await Promise.all(
      imageUris.map(async (uri, index) => {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Deteksi tipe gambar
        const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

        return `
          <div class="page" ${index > 0 ? 'style="page-break-before: always;"' : ''}>
            <img src="data:${mimeType};base64,${base64}" />
          </div>
        `;
      })
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page {
              margin: 0;
              size: A4;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .page {
              width: 100%;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .page img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          ${imagePages.join('\n')}
        </body>
      </html>
    `;

    const { uri: pdfUri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Pindahkan ke folder arsip
    const arsipDir = `${FileSystem.documentDirectory}arsip/`;
    const dirInfo = await FileSystem.getInfoAsync(arsipDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(arsipDir, { intermediates: true });
    }

    const fileName = `scan_${generateId()}.pdf`;
    const destUri = `${arsipDir}${fileName}`;
    await FileSystem.moveAsync({ from: pdfUri, to: destUri });

    return destUri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generate PDF dari HTML content (untuk laporan)
 * @param {string} htmlContent - Konten HTML
 * @param {string} fileName - Nama file
 * @returns {Promise<string>} URI file PDF
 */
export const generatePdfFromHtml = async (htmlContent, fileName) => {
  try {
    const { uri: pdfUri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    const arsipDir = `${FileSystem.documentDirectory}arsip/`;
    const dirInfo = await FileSystem.getInfoAsync(arsipDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(arsipDir, { intermediates: true });
    }

    const destUri = `${arsipDir}${fileName || `laporan_${generateId()}.pdf`}`;
    await FileSystem.moveAsync({ from: pdfUri, to: destUri });

    return destUri;
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    throw error;
  }
};

/**
 * Mendapatkan ukuran file
 * @param {string} uri - URI file
 * @returns {Promise<number>} Ukuran file dalam bytes
 */
export const getFileSize = async (uri) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.size || 0;
  } catch {
    return 0;
  }
};

/**
 * Hapus file
 * @param {string} uri - URI file
 */
export const deleteFile = async (uri) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

/**
 * Simpan gambar sementara untuk scan
 * @param {string} uri - URI gambar dari kamera
 * @returns {Promise<string>} URI gambar yang disimpan
 */
export const saveScanImage = async (uri) => {
  try {
    const scanDir = `${FileSystem.cacheDirectory}scan_temp/`;
    const dirInfo = await FileSystem.getInfoAsync(scanDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(scanDir, { intermediates: true });
    }

    const ext = uri.split('.').pop() || 'jpg';
    const fileName = `page_${generateId()}.${ext}`;
    const destUri = `${scanDir}${fileName}`;
    await FileSystem.copyAsync({ from: uri, to: destUri });

    return destUri;
  } catch (error) {
    console.error('Error saving scan image:', error);
    throw error;
  }
};

/**
 * Bersihkan folder temporary scan
 */
export const clearScanTemp = async () => {
  try {
    const scanDir = `${FileSystem.cacheDirectory}scan_temp/`;
    const dirInfo = await FileSystem.getInfoAsync(scanDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(scanDir, { idempotent: true });
    }
  } catch (error) {
    console.error('Error clearing scan temp:', error);
  }
};
