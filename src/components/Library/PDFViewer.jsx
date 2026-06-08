// src/components/Library/PDFViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import PdfPage from './PdfPage';
import {
  ZoomIn, ZoomOut, X,
  MousePointer2, PenTool, Eraser, Undo, Redo,
  Highlighter, Type, Trash2, Bookmark, PanelRight
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const COLORS = ['#ffea00', '#00d4ff', '#ff4d4d', '#4dff91', '#ff914d', '#ffffff'];
const STROKE_WIDTHS = [2, 4, 8];

export default function PDFViewer({ doc, pdf, onClose }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(pdf?.lastPage || 1);
  const [scale, setScale] = useState(1.5);
  const [drawingMode, setDrawingMode] = useState('pointer');
  const [strokeColor, setStrokeColor] = useState('#ffea00');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [showBookmarks, setShowBookmarks] = useState(false);

  console.log("Bookmarks:", pdf?.bookmarks);

  const { updatePageAnnotations, toggleBookmark } = useStore();
  
  // Use plain object keyed by page number
  const pageRefs = useRef({});
  const saveTimeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (doc) {
      setNumPages(doc.numPages);
      const startPage = pdf?.lastPage && pdf.lastPage <= doc.numPages ? pdf.lastPage : 1;
      setCurrentPage(startPage);
      hasScrolledRef.current = false; // Reset on new doc
    }
  }, [doc, pdf?.lastPage, pdf?.id]);

  // Initial scroll
  useEffect(() => {
    if (numPages > 0 && pdf?.lastPage && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      setTimeout(() => {
        pageRefs.current[pdf.lastPage]?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 100);
    }
  }, [numPages, pdf?.lastPage]);

  // Intersection Observer for Current Page & Saving
  useEffect(() => {
    if (numPages === 0 || !scrollContainerRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const pageStr = entry.target.getAttribute('data-page');
        if (!pageStr) return;
        const pageNum = parseInt(pageStr, 10);
        
        if (entry.isIntersecting) {
          setCurrentPage(pageNum);
        } else {
          // leaving view: save immediately
          const pageEl = pageRefs.current[pageNum];
          if (pageEl && pdf?.id) {
            const json = pageEl.getJSON();
            if (json) {
              updatePageAnnotations(pdf.id, pageNum, json);
            }
          }
        }
      });
    }, { threshold: 0.3, root: scrollContainerRef.current });

    const container = scrollContainerRef.current;
    const pages = container.querySelectorAll('.pdf-page-wrapper');
    pages.forEach(p => observer.observe(p));
    
    return () => observer.disconnect();
  }, [numPages, pdf?.id, updatePageAnnotations]);

  const saveCurrentPage = () => {
    if (!pdf?.id) return;
    const pageEl = pageRefs.current[currentPage];
    if (pageEl) {
      const json = pageEl.getJSON();
      if (json) {
        updatePageAnnotations(pdf.id, currentPage, json);
      }
    }
  };

  const scheduleSave = () => {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveCurrentPage, 1000);
  };

  const handleClose = () => {
    saveCurrentPage();
    onClose(currentPage);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        pageRefs.current[currentPage]?.undo();
      }
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'z') || e.key === 'y')) {
        e.preventDefault();
        pageRefs.current[currentPage]?.redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage]);

  const toolBtn = (mode, icon, title) => (
    <button
      className={`icon-btn ${drawingMode === mode ? 'active' : ''}`}
      onClick={() => setDrawingMode(mode)}
      title={title}
    >
      {icon}
    </button>
  );

  const isBookmarked = (pdf?.bookmarks || []).some(b => b.page === currentPage);
  
  const handleToggleBookmark = () => {
    if (pdf?.id) {
      toggleBookmark(pdf.id, currentPage, `Page ${currentPage}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--bg-base)' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 16px', borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0, zIndex: 10, background: 'var(--bg-panel)',
        flexWrap: 'wrap'
      }}>

        {/* Doc name */}
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
          {pdf?.name || 'Document'}
        </span>

        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

        {/* Drawing tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-card)', padding: 3, borderRadius: 8 }}>
          {toolBtn('pointer', <MousePointer2 size={15} />, 'Select / Move (V)')}
          {toolBtn('pen', <PenTool size={15} />, 'Pen (P)')}
          {toolBtn('highlighter', <Highlighter size={15} />, 'Highlighter (H)')}
          {toolBtn('text', <Type size={15} />, 'Text (T)')}
          {toolBtn('eraser', <Eraser size={15} />, 'Eraser — click to delete')}
        </div>

        {/* Color swatches */}
        {(drawingMode === 'pen' || drawingMode === 'text') && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 4 }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: c,
                  border: strokeColor === c ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer', padding: 0,
                  boxShadow: strokeColor === c ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                  transition: 'transform 0.1s',
                  transform: strokeColor === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}

        {/* Stroke width */}
        {drawingMode === 'pen' && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {STROKE_WIDTHS.map(w => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                style={{
                  width: 24, height: 24, borderRadius: 6, border: 'none',
                  background: strokeWidth === w ? 'var(--accent-subtle)' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <div style={{ width: 14, height: w, background: strokeColor, borderRadius: 99 }} />
              </button>
            ))}
          </div>
        )}

        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="icon-btn" onClick={() => pageRefs.current[currentPage]?.undo()} title="Undo (Ctrl+Z)"><Undo size={15} /></button>
          <button className="icon-btn" onClick={() => pageRefs.current[currentPage]?.redo()} title="Redo (Ctrl+Shift+Z)"><Redo size={15} /></button>
          <button className="icon-btn" onClick={() => pageRefs.current[currentPage]?.clear()} title="Clear current page annotations" style={{ color: 'var(--text-muted)' }}><Trash2 size={15} /></button>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Page status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', padding: '3px 8px', borderRadius: 8 }}>
          <span style={{ fontSize: 13, minWidth: 56, textAlign: 'center', color: 'var(--text-primary)', userSelect: 'none', fontWeight: 500 }}>
            {currentPage} / {numPages}
          </span>
          <button className="icon-btn" onClick={handleToggleBookmark} title="Bookmark Page">
            <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} color={isBookmarked ? 'var(--accent-vivid)' : 'currentColor'} />
          </button>
        </div>

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-card)', padding: 3, borderRadius: 8 }}>
          <button className="icon-btn" onClick={() => setScale(s => Math.max(0.5, s - 0.25))}><ZoomOut size={15} /></button>
          <span style={{ fontSize: 12, minWidth: 38, textAlign: 'center', color: 'var(--text-primary)', userSelect: 'none' }}>
            {Math.round(scale * 100)}%
          </span>
          <button className="icon-btn" onClick={() => setScale(s => Math.min(3, s + 0.25))}><ZoomIn size={15} /></button>
        </div>
        
        {/* Toggle Bookmarks Panel */}
        <button className={`icon-btn ${showBookmarks ? 'active' : ''}`} onClick={() => setShowBookmarks(p => !p)} title="Show Bookmarks Panel">
          <PanelRight size={16} />
        </button>

        {/* Close */}
        <button className="icon-btn" onClick={handleClose}><X size={16} /></button>
      </div>

      {/* ── Main Workspace ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* PDF Scroll Container */}
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            padding: '32px 24px', background: '#1a1a1a',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
          }}
          onMouseUp={scheduleSave}
          onKeyUp={scheduleSave}
        >
          {doc && numPages > 0 && Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
            <div 
              key={pageNum} 
              className="pdf-page-wrapper" 
              data-page={pageNum}
            >
              <PdfPage
                ref={el => { pageRefs.current[pageNum] = el; }}
                doc={doc}
                pageNumber={pageNum}
                scale={scale}
                drawingMode={drawingMode}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                savedJSON={pdf?.fabricAnnotations?.[String(pageNum)]}
              />
            </div>
          ))}
        </div>

        {/* bookmarks panel — always rendered, width animates */}
        <div style={{
          width: showBookmarks ? 220 : 0,
          overflow: 'hidden',
          transition: 'width 250ms ease',
          borderLeft: showBookmarks ? '1px solid var(--border-subtle)' : 'none',
          background: 'var(--bg-panel)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ width: 220, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Bookmarks</span>
            {(pdf?.bookmarks || []).length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>No bookmarks yet. Click the bookmark icon on any page.</p>
            )}
            {(pdf?.bookmarks || [])
              .sort((a, b) => a.page - b.page)
              .map(bm => (
                <div key={bm.page} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-card)', cursor: 'pointer' }}
                  onClick={() => pageRefs.current[bm.page]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <span style={{ fontSize: 11, color: 'var(--accent-vivid)', fontWeight: 700, minWidth: 28 }}>P{bm.page}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bm.label}</span>
                  <button onClick={e => { e.stopPropagation(); toggleBookmark(pdf.id, bm.page); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex' }}>
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </div>

      </div>

      <style>{`
        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-primary);
          padding: 5px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 120ms;
        }
        .icon-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
        .icon-btn.active { background: var(--accent-subtle); color: var(--accent-vivid); }
        .icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>
    </div>
  );
}