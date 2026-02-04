import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout';
import FileDropzone from './components/FileDropzone';
import PDFViewer from './components/PDFViewer';
import GlassCard from './components/GlassCard';
import ImageRemovalTool from './components/ImageRemovalTool';
import ExportTool from './components/ExportTool';
import TextEditTool from './components/TextEditTool';
import { Download, FileText, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('view');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [selection, setSelection] = useState(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const handleFileSelect = async (file) => {
    if (!file) {
      setPdfFile(null);
      setPdfData(null);
      setPdfInfo(null);
      return;
    }

    setPdfFile(file);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    setPdfData(uint8Array);
    setSelection(null);
    setRightPanelOpen(true); // Auto-open panel when PDF loads
  };

  const handlePdfLoaded = (info) => {
    setPdfInfo(info);
    setCurrentPage(1);
  };

  const handlePdfUpdate = (newPdfData) => {
    const uint8Array = newPdfData instanceof Uint8Array
      ? newPdfData
      : new Uint8Array(newPdfData);
    setPdfData(uint8Array);
    setSelection(null);
  };

  const handleDownloadPdf = () => {
    if (!pdfData) return;

    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfFile?.name?.replace('.pdf', '_edited.pdf') || 'edited.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPdfFile(null);
    setPdfData(null);
    setPdfInfo(null);
    setCurrentPage(1);
    setSelection(null);
  };

  const handleSelectionChange = (sel) => {
    setSelection(sel);
  };

  const clearSelection = () => {
    setSelection(null);
  };

  const selectionEnabled = activeTab === 'edit-text' || activeTab === 'remove-images';

  const renderContent = () => {
    if (!pdfData) {
      return (
        <div className="h-full flex items-center justify-center p-12">
          <div className="max-w-3xl w-full">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-5xl font-bold text-gradient mb-6">
                Project Nebula
              </h1>
              <p className="text-gray-400 text-xl">
                Gizlilik odaklı, güçlü PDF düzenleme platformu
              </p>
            </motion.div>

            <FileDropzone onFileSelect={handleFileSelect} />

            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-gray-500 flex items-center justify-center gap-3">
                <span className="status-dot online"></span>
                Tüm işlemler tarayıcınızda gerçekleşir - %100 Güvenli
              </p>
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex">
        {/* Main PDF Viewer - Takes full width when panel closed */}
        <div className={`flex-1 transition-all duration-300 ${rightPanelOpen ? 'mr-4' : 'mr-0'}`}>
          <div className="h-full flex flex-col">
            {/* PDF Info Bar */}
            <GlassCard className="mb-4 p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-100 truncate max-w-md">
                    {pdfFile?.name || 'PDF Dosyası'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {pdfInfo?.numPages || 0} sayfa • Sayfa {currentPage}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadPdf}
                  className="px-5 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center gap-2 font-medium"
                  title="PDF İndir"
                >
                  <Download className="w-5 h-5" />
                  <span>İndir</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="px-5 py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 font-medium"
                  title="Yeni Dosya"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Yeni Dosya</span>
                </motion.button>
              </div>
            </GlassCard>

            {/* PDF Viewer */}
            <div className="flex-1 min-h-0">
              <PDFViewer
                pdfSource={pdfData}
                onPageSelect={setCurrentPage}
                onPdfLoaded={handlePdfLoaded}
                selectionEnabled={selectionEnabled}
                onSelectionChange={handleSelectionChange}
                selection={selection}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Collapsible */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 420, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <div className="h-full w-[420px] overflow-auto">
                <AnimatePresence mode="wait">
                  {activeTab === 'view' && (
                    <motion.div
                      key="view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <GlassCard className="p-8 text-center">
                        <h3 className="text-xl font-semibold text-gray-200 mb-3">
                          PDF Görüntüleyici
                        </h3>
                        <p className="text-gray-400">
                          PDF dosyanızı görüntüleyin, yakınlaştırın ve sayfalar arasında gezinin.
                        </p>
                      </GlassCard>
                    </motion.div>
                  )}

                  {activeTab === 'remove-images' && (
                    <motion.div
                      key="remove-images"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <ImageRemovalTool
                        pdfData={pdfData}
                        onPdfUpdate={handlePdfUpdate}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'edit-text' && (
                    <motion.div
                      key="edit-text"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <TextEditTool
                        pdfData={pdfData}
                        currentPage={currentPage}
                        selection={selection}
                        pageHeight={pdfInfo?.pageHeight}
                        onPdfUpdate={handlePdfUpdate}
                        onClearSelection={clearSelection}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'export-image' && (
                    <motion.div
                      key="export-image"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <ExportTool
                        pdfData={pdfData}
                        currentPage={currentPage}
                        totalPages={pdfInfo?.numPages || 0}
                        exportType="image"
                      />
                    </motion.div>
                  )}

                  {activeTab === 'export-word' && (
                    <motion.div
                      key="export-word"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <ExportTool
                        pdfData={pdfData}
                        exportType="word"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Panel Button */}
        <motion.button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed right-4 top-1/2 -translate-y-1/2 p-3 glass-card rounded-xl shadow-lg z-50"
          title={rightPanelOpen ? 'Paneli Gizle' : 'Paneli Göster'}
        >
          {rightPanelOpen ? (
            <ChevronRight className="w-5 h-5 text-purple-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-purple-400" />
          )}
        </motion.button>
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
