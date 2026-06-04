import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, FileText, Trash2 } from 'lucide-react';
import PDFViewer from './PDFViewer';
import { saveFileHandle, getFileHandle, removeFileHandle } from '../../lib/fileHandleStore';
import { openPdfFromFile } from '../../lib/pdfLoader';

export default function LibraryView() {
  const { pdfs, addPdf, deletePdf, updatePdf, addRecentItem, activePdfId, setActivePdfId } = useStore();
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [lastOpenError, setLastOpenError] = useState(null);  const handleAddPdf = async () => {
    try {
      let file;
      const newPdfId = `pdf-${Date.now()}`;
      
      if (typeof window.showOpenFilePicker !== 'undefined') {
        const [handle] = await window.showOpenFilePicker({
          types: [{ 
            description: 'PDF Files', 
            accept: { 'application/pdf': ['.pdf'] } 
          }]
        });
        file = await handle.getFile();
        await saveFileHandle(newPdfId, handle);
      } else {
        file = await new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf';
          input.onchange = (e) => resolve(e.target.files[0]);
          input.click();
        });
      }

      if (!file) return;
      
      const objectUrl = URL.createObjectURL(file);
      
      const newPdf = {
        id: newPdfId,
        name: file.name.replace('.pdf', ''),
        subjectId: null,
        folderId: null,
        lastPage: 1,
        totalPages: 1, // Will be updated by viewer
        uploadedAt: new Date().toISOString(),
        annotations: []
      };
      
      addPdf(newPdf);
      setActivePdfId(newPdf.id);
      setActivePdfUrl(objectUrl);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to open PDF:', err);
    }
  };

  async function openAndLoadPdf(file, pdfId) {
    const objectUrl = URL.createObjectURL(file);
    setActivePdfUrl(objectUrl);
    
    // We get lastPage from the store
    const pdfRecord = useStore.getState().pdfs.find(p => p.id === pdfId);
    if (pdfRecord) {
      updatePdf(pdfId, { lastPage: pdfRecord.lastPage ?? 1 });
    }
  }

  async function handleReOpenFile(pdfRecord) {
    setLastOpenError(null);
    
    try {
      // Try stored IndexedDB handle first
      const handle = await getFileHandle(pdfRecord.id);
      
      if (handle) {
        let permission;
        try {
          permission = await handle.queryPermission({ mode: 'read' });
          if (permission === 'prompt') {
            permission = await handle.requestPermission({ mode: 'read' });
          }
        } catch (permErr) {
          console.warn('Permission check failed:', permErr);
          permission = 'denied';
        }
        
        if (permission === 'granted') {
          try {
            const file = await handle.getFile();
            await openAndLoadPdf(file, pdfRecord.id);
            setActivePdfId(pdfRecord.id);
            return; // success
          } catch (fileErr) {
            console.warn('Stored handle getFile failed:', fileErr);
            // Fall through to file picker
          }
        }
      }
    } catch (dbErr) {
      console.warn('IndexedDB lookup failed:', dbErr);
    }
    
    // Fallback: show file picker
    try {
      if (typeof window.showOpenFilePicker !== 'undefined') {
        const [newHandle] = await window.showOpenFilePicker({
          types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }]
        });
        const file = await newHandle.getFile();
        await saveFileHandle(pdfRecord.id, newHandle); // update stored handle
        await openAndLoadPdf(file, pdfRecord.id);
        setActivePdfId(pdfRecord.id);
      } else {
        // Fallback input
        const file = await new Promise(resolve => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf';
          input.onchange = e => resolve(e.target.files[0]);
          input.click();
        });
        if (file) {
          await openAndLoadPdf(file, pdfRecord.id);
          setActivePdfId(pdfRecord.id);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setLastOpenError('Could not open file. Please try again.');
        console.error('File picker failed:', err);
      }
    }
  }

  const handleOpenExistingPdf = async (pdfRecord) => {
    setActivePdfId(pdfRecord.id);
    setActivePdfUrl(null);
    await handleReOpenFile(pdfRecord);
  };

  React.useEffect(() => {
    if (activePdfId) {
      const activePdf = pdfs.find(p => p.id === activePdfId);
      if (activePdf) {
        addRecentItem({ id: activePdf.id, type: 'pdf', title: activePdf.name });
      }
    }
  }, [activePdfId, pdfs, addRecentItem]);

  const handleClose = (currentPage) => {
    if (activePdfUrl) {
      URL.revokeObjectURL(activePdfUrl);
    }
    const activePdf = pdfs.find(p => p.id === activePdfId);
    if (activePdf) {
      updatePdf(activePdf.id, { lastPage: currentPage });
    }
    setActivePdfUrl(null);
    setActivePdfId(null);
  };

  const activePdfMeta = pdfs.find(p => p.id === activePdfId);

  return (
    <div className="library-view">
      <div className="library-sidebar glass" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <div className="library-sidebar-header" style={{ padding: '0 32px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="text-xl">Library</h2>
          <button className="btn-secondary" onClick={handleAddPdf} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
            <Plus size={16} /> Add PDF
          </button>
        </div>
        <div className="pdf-list" style={{ padding: '12px 32px' }}>
          {pdfs.length === 0 ? (
            <p className="empty-text">No PDFs added yet.</p>
          ) : (
            pdfs.map(pdf => {
              const progress = pdf.totalPages ? Math.min(100, (pdf.lastPage / pdf.totalPages) * 100) : 0;
              return (
                <div 
                  key={pdf.id} 
                  className={`pdf-item ${activePdfId === pdf.id ? 'active' : ''}`}
                  onClick={() => handleOpenExistingPdf(pdf)}
                >
                  <FileText size={18} className="pdf-icon" />
                  <div className="pdf-info">
                    <span className="pdf-name">{pdf.name}</span>
                    <div className="pdf-progress-track">
                      <div className="pdf-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={async (e) => {
                      e.stopPropagation();
                      deletePdf(pdf.id);
                      await removeFileHandle(pdf.id);
                      if (activePdfId === pdf.id) setActivePdfId(null);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="library-main glass">
        {activePdfId ? (
          <PDFViewer 
            fileUrl={activePdfUrl} 
            pdf={activePdfMeta}
            onRequestReopen={() => handleReOpenFile(activePdfMeta)} 
            onClose={handleClose}
            lastOpenError={lastOpenError}
          />
        ) : (
          <div className="empty-state">
            <FileText size={40} style={{ opacity: 0.2 }} />
            <h3 className="text-md">Select or add a PDF</h3>
            <p className="text-sm text-muted">Your library is stored locally on your device.</p>
          </div>
        )}
      </div>

      <style>{`
        .library-view {
          display: flex;
          gap: 24px;
          height: 100%;
        }

        .library-sidebar {
          width: 300px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .library-sidebar-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-subtle);
        }

        .library-sidebar-header h2 {
          font-size: 20px;
          margin: 0;
          color: var(--text-primary);
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .add-btn:hover {
          background: var(--accent-vivid);
          color: #000;
          border-color: var(--accent-vivid);
        }

        .pdf-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pdf-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
          border: 1px solid transparent;
        }

        .pdf-item:hover {
          background: var(--bg-hover);
        }

        .pdf-item.active {
          background: var(--bg-subtle);
          border-color: var(--border-subtle);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .pdf-item .pdf-icon {
          color: var(--text-muted);
        }

        .pdf-item.active .pdf-icon {
          color: var(--accent-vivid);
        }

        .pdf-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .pdf-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .pdf-progress-track {
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 1.5px;
          overflow: hidden;
          width: 100%;
        }
        
        .pdf-progress-fill {
          height: 100%;
          background: var(--accent-vivid);
          border-radius: 1.5px;
          transition: width 0.3s;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          opacity: 0;
          transition: all 0.2s;
        }

        .pdf-item:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: #e74c3c;
          background: rgba(231, 76, 60, 0.1);
        }

        .empty-text {
          color: var(--text-muted);
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
        }

        .library-main {
          flex: 1;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .empty-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
        }

        .empty-icon {
          color: var(--border-subtle);
        }

        .empty-main h3 {
          font-size: 20px;
          margin: 0;
          color: var(--text-primary);
        }

        .empty-main p {
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
