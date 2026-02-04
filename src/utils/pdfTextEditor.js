import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * PDF üzerine metin ekler
 * @param {ArrayBuffer} pdfData - PDF dosyası
 * @param {number} pageNum - Sayfa numarası (1-indexed)
 * @param {string} text - Eklenecek metin
 * @param {Object} position - {x, y} koordinatları
 * @param {Object} options - Stil seçenekleri
 * @returns {Promise<Uint8Array>} Düzenlenmiş PDF
 */
export async function addText(pdfData, pageNum, text, position, options = {}) {
    const {
        fontSize = 12,
        color = { r: 0, g: 0, b: 0 },
        fontType = 'Helvetica', // Helvetica, TimesRoman, Courier
    } = options;

    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    const page = pages[pageNum - 1];

    if (!page) {
        throw new Error(`Sayfa ${pageNum} bulunamadı`);
    }

    // Font seçimi
    let font;
    switch (fontType) {
        case 'TimesRoman':
            font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            break;
        case 'Courier':
            font = await pdfDoc.embedFont(StandardFonts.Courier);
            break;
        default:
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    page.drawText(text, {
        x: position.x,
        y: position.y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
    });

    return await pdfDoc.save();
}

/**
 * PDF'deki belirli bir alanı maskeler (metin silme için)
 * @param {ArrayBuffer} pdfData - PDF dosyası
 * @param {number} pageNum - Sayfa numarası
 * @param {Object} rect - {x, y, width, height} koordinatları
 * @param {Object} options - Seçenekler
 * @returns {Promise<Uint8Array>} Düzenlenmiş PDF
 */
export async function maskArea(pdfData, pageNum, rect, options = {}) {
    const {
        fillColor = { r: 1, g: 1, b: 1 }, // Varsayılan beyaz
    } = options;

    const pdfDoc = await PDFDocument.load(pdfData);
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

/**
 * Metni maskeler ve yerine yeni metin yazar
 * @param {ArrayBuffer} pdfData - PDF dosyası
 * @param {number} pageNum - Sayfa numarası
 * @param {Object} rect - Maskelenecek alan
 * @param {string} newText - Yeni metin
 * @param {Object} options - Seçenekler
 * @returns {Promise<Uint8Array>} Düzenlenmiş PDF
 */
export async function replaceText(pdfData, pageNum, rect, newText, options = {}) {
    const {
        fontSize = 12,
        textColor = { r: 0, g: 0, b: 0 },
        backgroundColor = { r: 1, g: 1, b: 1 },
        fontType = 'Helvetica',
        padding = 2,
    } = options;

    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    const page = pages[pageNum - 1];

    if (!page) {
        throw new Error(`Sayfa ${pageNum} bulunamadı`);
    }

    // Font embed
    let font;
    switch (fontType) {
        case 'TimesRoman':
            font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            break;
        case 'Courier':
            font = await pdfDoc.embedFont(StandardFonts.Courier);
            break;
        default:
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // Önce alanı maskele
    page.drawRectangle({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        color: rgb(backgroundColor.r, backgroundColor.g, backgroundColor.b),
    });

    // Yeni metni yaz
    page.drawText(newText, {
        x: rect.x + padding,
        y: rect.y + padding,
        size: fontSize,
        font,
        color: rgb(textColor.r, textColor.g, textColor.b),
    });

    return await pdfDoc.save();
}

/**
 * Çoklu metin alanı ekler
 * @param {ArrayBuffer} pdfData - PDF dosyası
 * @param {Array} textItems - [{pageNum, text, position, options}]
 * @returns {Promise<Uint8Array>} Düzenlenmiş PDF
 */
export async function addMultipleTexts(pdfData, textItems) {
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();

    // Fontları bir kere yükle
    const fonts = {
        Helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
        TimesRoman: await pdfDoc.embedFont(StandardFonts.TimesRoman),
        Courier: await pdfDoc.embedFont(StandardFonts.Courier),
    };

    for (const item of textItems) {
        const { pageNum, text, position, options = {} } = item;
        const {
            fontSize = 12,
            color = { r: 0, g: 0, b: 0 },
            fontType = 'Helvetica',
        } = options;

        const page = pages[pageNum - 1];
        if (!page) continue;

        const font = fonts[fontType] || fonts.Helvetica;

        page.drawText(text, {
            x: position.x,
            y: position.y,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
        });
    }

    return await pdfDoc.save();
}
