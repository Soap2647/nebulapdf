/**
 * PDF verisi için yardımcı fonksiyonlar
 * ArrayBuffer detached olma sorununu önlemek için kullanılır
 */

/**
 * PDF verisini pdf.js veya pdf-lib için uygun formata dönüştürür
 * @param {Uint8Array|ArrayBuffer} pdfData - PDF verisi
 * @returns {ArrayBuffer} Yeni bir ArrayBuffer kopyası
 */
export function preparePdfData(pdfData) {
    if (pdfData instanceof Uint8Array) {
        // Uint8Array'den yeni bir kopya oluştur ve ArrayBuffer olarak döndür
        return pdfData.slice().buffer;
    }
    if (pdfData instanceof ArrayBuffer) {
        // ArrayBuffer için Uint8Array üzerinden kopya oluştur
        return new Uint8Array(pdfData).slice().buffer;
    }
    // Diğer durumlar için olduğu gibi döndür
    return pdfData;
}

/**
 * PDF verisini Uint8Array olarak alır (saklama için)
 * @param {Uint8Array|ArrayBuffer} pdfData - PDF verisi
 * @returns {Uint8Array} Uint8Array kopyası
 */
export function toUint8Array(pdfData) {
    if (pdfData instanceof Uint8Array) {
        return new Uint8Array(pdfData);
    }
    if (pdfData instanceof ArrayBuffer) {
        return new Uint8Array(pdfData);
    }
    return pdfData;
}
