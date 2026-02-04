import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { preparePdfData } from './pdfHelper';

// PDF.js worker setup - yerel dosya kullan
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * PDF'deki görselleri tespit eder
 * @param {Uint8Array|ArrayBuffer} pdfData - PDF dosyası
 * @returns {Promise<Array>} Tespit edilen görseller
 */
export async function detectImages(pdfData) {
    const safeData = preparePdfData(pdfData);
    const pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
    const images = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const operatorList = await page.getOperatorList();
        const viewport = page.getViewport({ scale: 1 });

        let transformMatrix = [1, 0, 0, 1, 0, 0];

        for (let i = 0; i < operatorList.fnArray.length; i++) {
            const fn = operatorList.fnArray[i];
            const args = operatorList.argsArray[i];

            // Transform operations
            if (fn === pdfjsLib.OPS.transform) {
                transformMatrix = args;
            }

            // Image operations
            if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintJpegXObject) {
                const imgName = args[0];

                // Calculate image bounds from transform matrix
                const x = transformMatrix[4];
                const y = viewport.height - transformMatrix[5] - Math.abs(transformMatrix[3]);
                const width = Math.abs(transformMatrix[0]);
                const height = Math.abs(transformMatrix[3]);

                images.push({
                    id: `page${pageNum}_img${images.length}`,
                    pageNum,
                    name: imgName,
                    x,
                    y,
                    width,
                    height,
                    // Normalize coordinates for pdf-lib
                    pdfLibCoords: {
                        x: transformMatrix[4],
                        y: transformMatrix[5],
                        width: Math.abs(transformMatrix[0]),
                        height: Math.abs(transformMatrix[3]),
                    }
                });

                // Reset transform
                transformMatrix = [1, 0, 0, 1, 0, 0];
            }
        }
    }

    return images;
}

/**
 * PDF'den belirtilen görselleri siler (üzerini örterek)
 * @param {Uint8Array|ArrayBuffer} pdfData - Orijinal PDF
 * @param {Array} imagesToRemove - Silinecek görsellerin koordinatları
 * @param {Object} options - Seçenekler
 * @returns {Promise<Uint8Array>} Düzenlenmiş PDF
 */
export async function removeImages(pdfData, imagesToRemove, options = {}) {
    const {
        fillColor = { r: 1, g: 1, b: 1 }, // Default: white
        addBorder = false,
    } = options;

    const safeData = preparePdfData(pdfData);
    const pdfDoc = await PDFDocument.load(safeData);

    for (const img of imagesToRemove) {
        const pageIndex = img.pageNum - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { x, y, width, height } = img.pdfLibCoords;

        // Draw a rectangle over the image to "remove" it
        page.drawRectangle({
            x,
            y,
            width,
            height,
            color: rgb(fillColor.r, fillColor.g, fillColor.b),
            borderWidth: addBorder ? 1 : 0,
            borderColor: addBorder ? rgb(0.8, 0.8, 0.8) : undefined,
        });
    }

    return await pdfDoc.save();
}

/**
 * PDF'deki tüm görselleri siler
 * @param {ArrayBuffer} pdfData - Orijinal PDF
 * @param {Object} options - Seçenekler
 * @returns {Promise<Uint8Array>} Düzenlenmiş PDF
 */
export async function removeAllImages(pdfData, options = {}) {
    const images = await detectImages(pdfData);
    return await removeImages(pdfData, images, options);
}

/**
 * Belirli bir sayfadaki görselleri siler
 * @param {ArrayBuffer} pdfData - Orijinal PDF  
 * @param {number} pageNum - Sayfa numarası (1-indexed)
 * @param {Object} options - Seçenekler
 * @returns {Promise<Uint8Array>} Düzenlenmiş PDF
 */
export async function removeImagesFromPage(pdfData, pageNum, options = {}) {
    const allImages = await detectImages(pdfData);
    const pageImages = allImages.filter(img => img.pageNum === pageNum);
    return await removeImages(pdfData, pageImages, options);
}

/**
 * Koordinat bazlı görsel silme - kullanıcının seçtiği alan
 * @param {Uint8Array|ArrayBuffer} pdfData - Orijinal PDF
 * @param {number} pageNum - Sayfa numarası
 * @param {Object} rect - {x, y, width, height} koordinatları
 * @param {Object} options - Seçenekler
 * @returns {Promise<Uint8Array>} Düzenlenmiş PDF
 */
export async function removeRegion(pdfData, pageNum, rect, options = {}) {
    const {
        fillColor = { r: 1, g: 1, b: 1 },
    } = options;

    const safeData = preparePdfData(pdfData);
    const pdfDoc = await PDFDocument.load(safeData);
    const pages = pdfDoc.getPages();
    const page = pages[pageNum - 1];

    if (!page) {
        throw new Error(`Sayfa ${pageNum} bulunamadı`);
    }

    page.drawRectangle({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        color: rgb(fillColor.r, fillColor.g, fillColor.b),
    });

    return await pdfDoc.save();
}
