import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { preparePdfData } from './pdfHelper';

// PDF.js worker setup - yerel dosya kullan
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * PDF'den metin içeriğini çıkarır
 * @param {Uint8Array|ArrayBuffer} pdfData - PDF dosyası
 * @returns {Promise<Array>} Sayfa bazlı metin içerikleri
 */
export async function extractTextFromPdf(pdfData) {
    const safeData = preparePdfData(pdfData);
    const pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
    const pages = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const textItems = textContent.items.map(item => ({
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height,
            fontSize: Math.abs(item.transform[0]) || 12,
        }));

        // Satırları grupla
        const lines = groupTextIntoLines(textItems);

        pages.push({
            pageNum,
            lines,
            rawItems: textItems,
        });
    }

    return pages;
}

/**
 * Metin öğelerini satırlara gruplar
 * @param {Array} items - Metin öğeleri
 * @returns {Array} Satırlar
 */
function groupTextIntoLines(items) {
    if (items.length === 0) return [];

    // Y koordinatına göre sırala (yukarıdan aşağıya)
    const sorted = [...items].sort((a, b) => b.y - a.y);

    const lines = [];
    let currentLine = [sorted[0]];
    let currentY = sorted[0].y;

    for (let i = 1; i < sorted.length; i++) {
        const item = sorted[i];
        // Aynı satırda kabul edilecek Y toleransı
        if (Math.abs(item.y - currentY) < 5) {
            currentLine.push(item);
        } else {
            // Satırı X'e göre sırala ve birleştir
            currentLine.sort((a, b) => a.x - b.x);
            lines.push({
                y: currentY,
                text: currentLine.map(i => i.text).join(' '),
                fontSize: Math.max(...currentLine.map(i => i.fontSize)),
            });
            currentLine = [item];
            currentY = item.y;
        }
    }

    // Son satırı ekle
    if (currentLine.length > 0) {
        currentLine.sort((a, b) => a.x - b.x);
        lines.push({
            y: currentY,
            text: currentLine.map(i => i.text).join(' '),
            fontSize: Math.max(...currentLine.map(i => i.fontSize)),
        });
    }

    return lines;
}

/**
 * PDF'i Word (DOCX) formatına dönüştürür
 * @param {ArrayBuffer} pdfData - PDF dosyası
 * @param {Object} options - Seçenekler
 * @returns {Promise<Blob>} DOCX blob
 */
export async function convertToDocx(pdfData, options = {}) {
    const {
        preserveFormatting = true,
        addPageBreaks = true,
    } = options;

    const pagesContent = await extractTextFromPdf(pdfData);
    const children = [];

    for (let i = 0; i < pagesContent.length; i++) {
        const page = pagesContent[i];

        // Sayfa numarası başlığı
        if (pagesContent.length > 1) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Sayfa ${page.pageNum}`,
                            bold: true,
                            size: 24,
                            color: '666666',
                        }),
                    ],
                    spacing: { after: 200 },
                })
            );
        }

        // Satırları paragraf olarak ekle
        for (const line of page.lines) {
            if (!line.text.trim()) continue;

            // Başlık tespiti (büyük font)
            const isHeading = line.fontSize > 16;

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: line.text,
                            bold: isHeading,
                            size: preserveFormatting ? Math.round(line.fontSize * 2) : 24,
                        }),
                    ],
                    heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
                    spacing: { after: 120 },
                })
            );
        }

        // Sayfa sonu ekle (son sayfa hariç)
        if (addPageBreaks && i < pagesContent.length - 1) {
            children.push(
                new Paragraph({
                    children: [],
                    pageBreakBefore: true,
                })
            );
        }
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    return blob;
}

/**
 * PDF'i Word olarak indirir
 * @param {ArrayBuffer} pdfData - PDF dosyası
 * @param {string} filename - Dosya adı
 * @param {Object} options - Seçenekler
 */
export async function downloadAsDocx(pdfData, filename = 'document', options = {}) {
    const blob = await convertToDocx(pdfData, options);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * PDF'den düz metin çıkarır
 * @param {ArrayBuffer} pdfData - PDF dosyası
 * @returns {Promise<string>} Tüm metin
 */
export async function extractPlainText(pdfData) {
    const pages = await extractTextFromPdf(pdfData);
    return pages
        .map(page => page.lines.map(line => line.text).join('\n'))
        .join('\n\n--- Sayfa Sonu ---\n\n');
}
