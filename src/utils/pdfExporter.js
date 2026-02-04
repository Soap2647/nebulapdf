import * as pdfjsLib from 'pdfjs-dist';
import { preparePdfData } from './pdfHelper';

// PDF.js worker setup - yerel dosya kullan
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * PDF sayfasını PNG olarak dışa aktarır
 * @param {Uint8Array|ArrayBuffer} pdfData - PDF dosyası
 * @param {number} pageNum - Sayfa numarası (1-indexed)
 * @param {Object} options - Seçenekler
 * @returns {Promise<Blob>} PNG blob
 */
export async function exportPageAsPng(pdfData, pageNum, options = {}) {
    const {
        scale = 2, // Yüksek çözünürlük için 2x
        quality = 1,
    } = options;

    const safeData = preparePdfData(pdfData);
    const pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
    const page = await pdf.getPage(pageNum);

    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');

    await page.render({
        canvasContext: context,
        viewport,
    }).promise;

    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', quality);
    });
}

/**
 * PDF sayfasını JPG olarak dışa aktarır
 * @param {Uint8Array|ArrayBuffer} pdfData - PDF dosyası
 * @param {number} pageNum - Sayfa numarası
 * @param {Object} options - Seçenekler
 * @returns {Promise<Blob>} JPG blob
 */
export async function exportPageAsJpg(pdfData, pageNum, options = {}) {
    const {
        scale = 2,
        quality = 0.92,
        backgroundColor = '#ffffff',
    } = options;

    const safeData = preparePdfData(pdfData);
    const pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
    const page = await pdf.getPage(pageNum);

    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');

    // JPEG için beyaz arka plan
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
        canvasContext: context,
        viewport,
    }).promise;

    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
    });
}

/**
 * Tüm PDF sayfalarını PNG olarak dışa aktarır
 * @param {Uint8Array|ArrayBuffer} pdfData - PDF dosyası
 * @param {Object} options - Seçenekler
 * @returns {Promise<Array<{pageNum, blob}>>} PNG blobları
 */
export async function exportAllPagesAsPng(pdfData, options = {}) {
    const safeData = preparePdfData(pdfData);
    const pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
    const results = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const blob = await exportPageAsPng(pdfData, pageNum, options);
        results.push({ pageNum, blob });
    }

    return results;
}

/**
 * Tüm PDF sayfalarını JPG olarak dışa aktarır
 * @param {Uint8Array|ArrayBuffer} pdfData - PDF dosyası
 * @param {Object} options - Seçenekler
 * @returns {Promise<Array<{pageNum, blob}>>} JPG blobları
 */
export async function exportAllPagesAsJpg(pdfData, options = {}) {
    const safeData = preparePdfData(pdfData);
    const pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
    const results = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const blob = await exportPageAsJpg(pdfData, pageNum, options);
        results.push({ pageNum, blob });
    }

    return results;
}

/**
 * Blob'u dosya olarak indirir
 * @param {Blob} blob - İndirilecek blob
 * @param {string} filename - Dosya adı
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Belirtilen sayfayı yüksek çözünürlükte PNG olarak indirir
 * @param {ArrayBuffer} pdfData - PDF dosyası
 * @param {number} pageNum - Sayfa numarası
 * @param {string} baseName - Dosya adı tabanı
 * @param {Object} options - Seçenekler
 */
export async function downloadPageAsPng(pdfData, pageNum, baseName = 'page', options = {}) {
    const blob = await exportPageAsPng(pdfData, pageNum, options);
    downloadBlob(blob, `${baseName}_${pageNum}.png`);
}

/**
 * Belirtilen sayfayı JPG olarak indirir
 * @param {ArrayBuffer} pdfData - PDF dosyası
 * @param {number} pageNum - Sayfa numarası
 * @param {string} baseName - Dosya adı tabanı
 * @param {Object} options - Seçenekler
 */
export async function downloadPageAsJpg(pdfData, pageNum, baseName = 'page', options = {}) {
    const blob = await exportPageAsJpg(pdfData, pageNum, options);
    downloadBlob(blob, `${baseName}_${pageNum}.jpg`);
}

/**
 * PDF bilgilerini alır
 * @param {Uint8Array|ArrayBuffer} pdfData - PDF dosyası
 * @returns {Promise<Object>} PDF bilgileri
 */
export async function getPdfInfo(pdfData) {
    const safeData = preparePdfData(pdfData);
    const pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
    const metadata = await pdf.getMetadata();

    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1 });

    return {
        numPages: pdf.numPages,
        width: viewport.width,
        height: viewport.height,
        title: metadata.info?.Title || '',
        author: metadata.info?.Author || '',
        subject: metadata.info?.Subject || '',
        creator: metadata.info?.Creator || '',
        creationDate: metadata.info?.CreationDate || '',
    };
}
