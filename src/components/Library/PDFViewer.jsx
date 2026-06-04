import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PdfPage from './PdfPage';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X, Maximize, Search } from 'lucide-react';

export default function PDFViewer({ doc, pdf, onClose }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(pdf?.lastPage || 1);
  const [scale, setScale] = useState(1.5);
  
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (doc) {
      setNumPages(doc.numPages);
      if (pdf?.lastPage && pdf.lastPage <= doc.numPages) {
        setCurrentPage(pdf.lastPage);
      } else {
        setCurrentPage(1);
      }
    }
  }, [doc, pdf]);

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(numPages, p + 1));
  const handleZoomIn = () => setScale(s => Math.min(3, s + 0.25));
  const handleZoomOut = () => setScale(s => Math.max(0.5, s - 0.25));

  // Render the visible pages (just the current one for now to keep it simple, but scrolling is possible later)
  
  return (
    <div className="pdf-viewer" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: 'var(--bg-base)' }}>
      {/* Toolbar */}
      <div className="pdf-toolbar glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, zIndex: 10 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            {pdf?.name || 'Document'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-panel)', padding: '4px', borderRadius: 8 }}>
            <button className="icon-btn" onClick={handlePrevPage} disabled={currentPage <= 1}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: 13, minWidth: 60, textAlign: 'center', color: 'var(--text-primary)' }}>
              {currentPage} / {numPages}
            </span>
            <button className="icon-btn" onClick={handleNextPage} disabled={currentPage >= numPages}><ChevronRight size={16} /></button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-panel)', padding: '4px', borderRadius: 8 }}>
            <button className="icon-btn" onClick={handleZoomOut}><ZoomOut size={16} /></button>
            <span style={{ fontSize: 13, minWidth: 40, textAlign: 'center', color: 'var(--text-primary)' }}>
              {Math.round(scale * 100)}%
            </span>
            <button className="icon-btn" onClick={handleZoomIn}><ZoomIn size={16} /></button>
          </div>
        </div>

        <div>
          <button className="icon-btn" onClick={() => onClose(currentPage)} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div 
        className="pdf-pages-container" 
        ref={containerRef}
        style={{ flex: 1, overflow: 'auto', padding: '24px 0', backgroundColor: '#1e1e1e', display: 'flex', justifyContent: 'center' }}
      >
        {doc && (
          <PdfPage 
            key={`${currentPage}-${scale}`}
            doc={doc} 
            pageNumber={currentPage} 
            scale={scale} 
          />
        )}
      </div>

      <style>{`
        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-primary);
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 150ms;
        }
        .icon-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }
        .icon-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
