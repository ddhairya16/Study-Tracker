import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, FileText, X, MousePointer2, Pen, Highlighter, Type, MessageSquare, Eraser, Undo2, Redo2, Maximize2, Sun, Moon, Download, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { pdfjsLib } from '../../lib/pdfInit';
import { Canvas as FabricCanvas, PencilBrush, IText, Text } from 'fabric';
import { jsPDF } from 'jspdf';

export default function PDFViewer({ doc, pdf, onRequestReopen, onClose }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1.2);
  const [renderedPages, setRenderedPages] = useState([]);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInverted, setIsInverted] = useState(false);

  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  
  const fabricInstances = useRef(new Map());
  const historyStack = useRef([]);
  const redoStack = useRef([]);

  const { updatePageAnnotations, showToast } = useStore();

  useEffect(() => {
    if (!doc) {
      setRenderedPages([]);
      return;
    }
    let isSubscribed = true;
    setRenderedPages([1]);
    setTimeout(() => {
      if (isSubscribed) {
        const pages = Array.from({ length: doc.numPages }, (_, i) => i + 1);
        setRenderedPages(pages);
      }
    }, 100);
    return () => { isSubscribed = false; };
  }, [doc]);

  // Update all fabric instances when tool settings change
  useEffect(() => {
    fabricInstances.current.forEach(inst => {
      if (activeTool === 'pen' || activeTool === 'highlighter') {
        inst.isDrawingMode = true;
        inst.freeDrawingBrush = new PencilBrush(inst);
        inst.freeDrawingBrush.color = activeTool === 'highlighter' ? activeColor + '80' : activeColor;
        inst.freeDrawingBrush.width = activeTool === 'highlighter' ? 16 : brushSize;
        if (activeTool === 'highlighter') {
          inst.freeDrawingBrush.globalCompositeOperation = 'multiply';
        }
      } else {
        inst.isDrawingMode = false;
      }
      inst.selection = activeTool === 'select';
    });
  }, [activeTool, activeColor, brushSize]);

  const performUndo = useCallback(() => {
    const action = historyStack.current.pop();
    if (action) {
      redoStack.current.push(action);
      const { pageNum, prevState } = action;
      const inst = fabricInstances.current.get(pageNum);
      if (inst) {
        inst.isHistoryAction = true;
        inst.loadFromJSON(prevState).then(() => {
          inst.renderAll();
          inst.isHistoryAction = false;
          updatePageAnnotations(pdf.id, pageNum, inst.toJSON());
        });
      }
    }
  }, [pdf?.id, updatePageAnnotations]);

  const performRedo = useCallback(() => {
    const action = redoStack.current.pop();
    if (action) {
      historyStack.current.push(action);
      const { pageNum, nextState } = action;
      const inst = fabricInstances.current.get(pageNum);
      if (inst) {
        inst.isHistoryAction = true;
        inst.loadFromJSON(nextState).then(() => {
          inst.renderAll();
          inst.isHistoryAction = false;
          updatePageAnnotations(pdf.id, pageNum, inst.toJSON());
        });
      }
    }
  }, [pdf?.id, updatePageAnnotations]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      
      const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
      const isRedo = (e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y');
      
      if (isUndo) { e.preventDefault(); performUndo(); }
      if (isRedo) { e.preventDefault(); performRedo(); }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);

  // Fullscreen tracking
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    const viewerEl = document.getElementById('pdf-viewer-container');
    if (!document.fullscreenElement) {
      if (viewerEl.requestFullscreen) viewerEl.requestFullscreen();
      else if (viewerEl.webkitRequestFullscreen) viewerEl.webkitRequestFullscreen();
      showToast("Press Escape to exit fullscreen", "info", 3000);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const pushHistory = useCallback((pageNum, prevState, nextState) => {
    historyStack.current.push({ pageNum, prevState, nextState });
    if (historyStack.current.length > 50) historyStack.current.shift();
    redoStack.current = [];
  }, []);

  const exportCurrentPage = async () => {
    if (!doc) return;
    // Find currently visible page. Rough estimate: center of scroll area
    const scrollEl = containerRef.current;
    if (!scrollEl) return;
    
    let currentPageNum = 1;
    const pageWrappers = scrollEl.querySelectorAll('.page-wrapper');
    for (const wrapper of pageWrappers) {
      const rect = wrapper.getBoundingClientRect();
      const scrollRect = scrollEl.getBoundingClientRect();
      if (rect.top >= scrollRect.top - rect.height/2 && rect.top <= scrollRect.bottom) {
        currentPageNum = parseInt(wrapper.getAttribute('data-page'), 10);
        break;
      }
    }

    const pageWrapper = document.getElementById(`page-${currentPageNum}`);
    if (!pageWrapper) {
      showToast("Cannot find current page", "error");
      return;
    }

    showToast("Exporting page...", "info");
    const pdfCanvas = pageWrapper.querySelector('.pdf-canvas');
    const fabricInst = fabricInstances.current.get(currentPageNum);
    
    const merged = document.createElement('canvas');
    merged.width = pdfCanvas.width;
    merged.height = pdfCanvas.height;
    const ctx = merged.getContext('2d');
    
    // Draw PDF
    ctx.drawImage(pdfCanvas, 0, 0);
    
    // Draw Fabric
    if (fabricInst) {
      const fabricCanvasEl = fabricInst.getElement();
      ctx.drawImage(fabricCanvasEl, 0, 0);
    }
    
    const link = document.createElement('a');
    link.download = `${pdf?.name || 'document'}-page${currentPageNum}-annotated.png`;
    link.href = merged.toDataURL('image/png');
    link.click();
    showToast("Export complete", "success");
  };

  const exportFullPdf = async () => {
    if (!doc) return;
    showToast("Exporting full PDF... This may take a minute", "info", 5000);
    try {
      const outPdf = new jsPDF({ orientation: 'portrait', unit: 'px' });
      
      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const vp = page.getViewport({ scale: 1.5 }); // High quality render
        
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        
        const merged = document.createElement('canvas');
        merged.width = canvas.width;
        merged.height = canvas.height;
        const ctx = merged.getContext('2d');
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvas, 0, 0);
        
        const fabricInst = fabricInstances.current.get(pageNum);
        if (fabricInst) {
          // Temporarily scale fabric to match export viewport
          const oldZoom = fabricInst.getZoom();
          fabricInst.setZoom(1.5 / scale);
          const fCanvas = fabricInst.toCanvasElement();
          ctx.drawImage(fCanvas, 0, 0);
          fabricInst.setZoom(oldZoom);
        }
        
        const imgData = merged.toDataURL('image/jpeg', 0.9);
        if (pageNum > 1) outPdf.addPage([vp.width, vp.height], 'p');
        else outPdf.internal.pageSize = { width: vp.width, height: vp.height };
        
        outPdf.addImage(imgData, 'JPEG', 0, 0, vp.width, vp.height);
      }
      
      outPdf.save(`${pdf?.name || 'document'}-annotated.pdf`);
      showToast("PDF Export complete", "success");
    } catch (err) {
      console.error(err);
      showToast("PDF Export failed", "error");
    }
  };

  if (!doc) {
    return (
      <div className="pdf-pending-overlay">
        <div className="pending-content glass">
          <FileText size={48} className="mb-4 text-accent" style={{ margin: '0 auto 16px', color: 'var(--accent-vivid)' }} />
          <h2 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            {pdf?.name || 'Unknown PDF'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '300px', lineHeight: '1.5' }}>
            Your file stays on your device — we just need you to point us to it again to access its contents securely.
          </p>
          <button className="primary-btn" onClick={onRequestReopen}>
            Open File
          </button>
        </div>
      </div>
    );
  }

  const presetColors = ['#000000', '#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];

  return (
    <div id="pdf-viewer-container" className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="pdf-toolbar glass" style={{ flexDirection: 'column', alignItems: 'stretch', padding: 0 }}>
        {!isFullscreen && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="icon-btn" onClick={() => setShowThumbnails(prev => !prev)} style={{ padding: '6px', background: showThumbnails ? 'var(--bg-active)' : 'transparent', borderRadius: '6px', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>
                <FileText size={18} />
              </button>
              <span className="pdf-title">{pdf?.name}</span>
            </div>
            <div className="zoom-controls">
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))}><ZoomOut size={16} /></button>
              <span>{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(3, s + 0.2))}><ZoomIn size={16} /></button>
              
              <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 8px' }} />
              <button onClick={toggleFullscreen} title="Fullscreen"><Maximize2 size={16} /></button>
              <button onClick={() => setIsInverted(p => !p)} title="Dark Mode (Invert)">
                {isInverted ? <Sun size={16}/> : <Moon size={16}/>}
              </button>
              <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 8px' }} />
              <button onClick={() => onClose && onClose(1)} title="Close"><X size={16} /></button>
            </div>
          </div>
        )}
        
        {/* Annotation Toolbar */}
        <div className="annotation-toolbar">
          <ToolBtn icon={MousePointer2} label="Select" active={activeTool === 'select'} onClick={() => setActiveTool('select')} />
          <ToolBtn icon={Pen} label="Pen" active={activeTool === 'pen'} onClick={() => setActiveTool('pen')} />
          <ToolBtn icon={Highlighter} label="Highlighter" active={activeTool === 'highlighter'} onClick={() => setActiveTool('highlighter')} />
          <ToolBtn icon={Type} label="Text" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
          <ToolBtn icon={MessageSquare} label="Comment" active={activeTool === 'comment'} onClick={() => setActiveTool('comment')} />
          <ToolBtn icon={Eraser} label="Eraser" active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} />
          
          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 8px' }} />
          
          <ToolBtn icon={Undo2} label="Undo" onClick={performUndo} />
          <ToolBtn icon={Redo2} label="Redo" onClick={performRedo} />

          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 8px' }} />

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {presetColors.map(c => (
              <button 
                key={c}
                onClick={() => setActiveColor(c)}
                style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: activeColor === c ? '2px solid var(--accent-vivid)' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
              />
            ))}
            <input 
              type="color" 
              value={activeColor} 
              onChange={e => setActiveColor(e.target.value)} 
              style={{ width: 24, height: 24, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', marginLeft: '4px' }}
            />
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 8px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Size</span>
            <input 
              type="range" 
              min="1" max="30" 
              value={brushSize} 
              onChange={e => setBrushSize(parseInt(e.target.value))}
              style={{ width: 80 }}
            />
            <div style={{ width: brushSize, height: brushSize, borderRadius: '50%', background: activeColor, minWidth: 2, minHeight: 2 }} />
          </div>

          <div style={{ flex: 1 }} />
          <ToolBtn icon={ImageIcon} label="Export Page (PNG)" onClick={exportCurrentPage} />
          <ToolBtn icon={Download} label="Export Full PDF" onClick={exportFullPdf} />
          {isFullscreen && (
            <button onClick={toggleFullscreen} style={{ background:'transparent', border:'1px solid var(--border-subtle)', color:'var(--text-primary)', padding:'4px 12px', borderRadius:6, cursor:'pointer', marginLeft: 8 }}>
              Exit Fullscreen
            </button>
          )}
        </div>
      </div>
      
      <div className="pdf-body">
        {showThumbnails && !isFullscreen && (
          <div className="pdf-thumbnails glass">
            {renderedPages.map(pageNum => (
              <Thumbnail 
                key={`thumb-${pageNum}`} 
                pdf={doc} 
                pageNum={pageNum} 
                isInverted={isInverted}
                onClick={() => {
                  const el = document.getElementById(`page-${pageNum}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        )}
        
        <div className="pdf-scroll-area" ref={containerRef}>
          {renderedPages.map(pageNum => (
            <PDFPage 
              key={`${pageNum}-${scale}`} 
              pdf={doc} 
              pageNum={pageNum} 
              scale={scale} 
              fileMeta={pdf}
              activeTool={activeTool}
              activeColor={activeColor}
              brushSize={brushSize}
              isInverted={isInverted}
              fabricInstances={fabricInstances}
              pushHistory={pushHistory}
            />
          ))}
        </div>
      </div>

      <style>{`
        .pdf-viewer-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: var(--bg-panel);
          overflow: hidden;
        }
        #pdf-viewer-container.fullscreen {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 99999;
          background: #0a0a0a;
          border-radius: 0;
        }
        .pdf-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .pdf-thumbnails {
          width: 200px;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-right: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }
        .thumbnail-item {
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 2px solid transparent;
          transition: border-color 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .thumbnail-item:hover {
          border-color: var(--accent-vivid);
        }
        .thumbnail-label {
          font-size: 11px;
          color: var(--text-muted);
          padding-bottom: 4px;
        }
        .pdf-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-card);
          z-index: 100;
        }
        .pdf-title {
          font-weight: 500;
          color: var(--text-primary);
        }
        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary);
        }
        .zoom-controls button {
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .zoom-controls button:hover {
          background: var(--bg-subtle);
        }
        .annotation-toolbar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: var(--bg-panel);
          border-bottom: 1px solid var(--border-subtle);
          flex-wrap: wrap;
        }
        .ann-tool-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: background 150ms, color 150ms;
        }
        .ann-tool-btn:hover {
          background: rgba(255,255,255,0.08);
          color: var(--text-primary);
        }
        .ann-tool-btn.active {
          background: var(--accent-vivid);
          color: #000;
        }
        .pdf-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          background: var(--bg-base);
        }
        .pdf-pending-overlay {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          background: var(--bg-base);
        }
        .pending-content {
          padding: 48px;
          border-radius: 24px;
          text-align: center;
          max-width: 400px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.2);
        }
        .pdf-canvas.inverted {
          filter: invert(1) hue-rotate(180deg);
        }
      `}</style>
    </div>
  );
}

function ToolBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button className={`ann-tool-btn ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      <Icon size={18} />
    </button>
  );
}

function Thumbnail({ pdf, pageNum, isInverted, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let renderTask;
    let isSubscribed = true;
    if (!pdf) return;

    const render = async () => {
      try {
        const page = await pdf.getPage(pageNum);
        if (!isSubscribed) return;
        const vp = page.getViewport({ scale: 0.2 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        canvas.width = vp.width;
        canvas.height = vp.height;
        renderTask = page.render({ canvasContext: context, viewport: vp });
        await renderTask.promise;
      } catch (e) {
        if (e.name !== 'RenderingCancelledException') {
          console.error(e);
        }
      }
    };
    render();
    return () => {
      isSubscribed = false;
      if (renderTask) renderTask.cancel();
    };
  }, [pdf, pageNum]);

  return (
    <div className="thumbnail-item" onClick={onClick}>
      <canvas ref={canvasRef} className={isInverted ? 'inverted' : ''} style={{ background: '#fff', display: 'block', width: '100%', filter: isInverted ? 'invert(1) hue-rotate(180deg)' : 'none' }} />
      <span className="thumbnail-label">{pageNum}</span>
    </div>
  );
}

function PDFPage({ pdf, pageNum, scale, fileMeta, activeTool, activeColor, brushSize, isInverted, fabricInstances, pushHistory }) {
  const canvasRef = useRef(null);
  const fabricContainerRef = useRef(null);
  const containerRef = useRef(null);
  const textLayerRef = useRef(null);
  
  const [viewport, setViewport] = useState(null);
  const [commentPopover, setCommentPopover] = useState(null); // { x, y, pin }
  const [commentDraft, setCommentDraft] = useState("");
  
  const { updatePageAnnotations } = useStore();
  const lastStateRef = useRef(null);
  
  // Refs to avoid stale closures in fabric events
  const activeToolRef = useRef(activeTool);
  const activeColorRef = useRef(activeColor);
  const brushSizeRef = useRef(brushSize);
  
  useEffect(() => {
    activeToolRef.current = activeTool;
    activeColorRef.current = activeColor;
    brushSizeRef.current = brushSize;
  }, [activeTool, activeColor, brushSize]);

  useEffect(() => {
    let renderTask;
    let isSubscribed = true;

    const renderPage = async () => {
      try {
        if (!pdf) return;
        const page = await pdf.getPage(pageNum);
        if (!isSubscribed) return;
        
        const vp = page.getViewport({ scale });
        setViewport(vp);
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(vp.width * outputScale);
        canvas.height = Math.floor(vp.height * outputScale);
        canvas.style.width = Math.floor(vp.width) + "px";
        canvas.style.height =  Math.floor(vp.height) + "px";

        if (containerRef.current) {
          containerRef.current.style.width = Math.floor(vp.width) + "px";
          containerRef.current.style.height = Math.floor(vp.height) + "px";
        }

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        renderTask = page.render({
          canvasContext: context,
          transform: transform,
          viewport: vp,
        });
        
        await renderTask.promise;
        if (!isSubscribed) return;
        
        const textContent = await page.getTextContent();
        if (!isSubscribed) return;
        
        const textLayerDiv = textLayerRef.current;
        if (textLayerDiv) {
          textLayerDiv.innerHTML = '';
          const textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: vp,
          });
          await textLayer.render();
        }

        if (!fabricContainerRef.current) return;
        fabricContainerRef.current.innerHTML = ''; 
        const fabricCanvasEl = document.createElement('canvas');
        fabricCanvasEl.width = Math.floor(vp.width);
        fabricCanvasEl.height = Math.floor(vp.height);
        fabricCanvasEl.style.cssText = `
          position: absolute;
          top: 0; left: 0;
          width: ${vp.width}px;
          height: ${vp.height}px;
          z-index: 4;
          pointer-events: auto;
        `;
        fabricContainerRef.current.appendChild(fabricCanvasEl);

        const fabricInst = new FabricCanvas(fabricCanvasEl, {
          isDrawingMode: false,
          selection: true,
          preserveObjectStacking: true,
        });

        fabricInstances.current.set(pageNum, fabricInst);

        const savedJson = fileMeta?.fabricAnnotations?.[String(pageNum)];
        if (savedJson) {
          await fabricInst.loadFromJSON(savedJson);
          lastStateRef.current = savedJson;
        } else {
          lastStateRef.current = fabricInst.toJSON();
        }

        const saveState = () => {
          if (fabricInst.isHistoryAction) return;
          const currentJson = fabricInst.toJSON();
          pushHistory(pageNum, lastStateRef.current, currentJson);
          lastStateRef.current = currentJson;
          updatePageAnnotations(fileMeta.id, pageNum, currentJson);
        };

        fabricInst.on('object:added', saveState);
        fabricInst.on('object:modified', saveState);
        fabricInst.on('object:removed', saveState);

        let isMouseDown = false;
        
        fabricInst.on('mouse:down', (opt) => {
          isMouseDown = true;
          const tool = activeToolRef.current;
          
          if (tool === 'text') {
            if (opt.target) return; // Don't spawn text on top of another object
            const pointer = fabricInst.getPointer(opt.e);
            const textObj = new IText('Type here...', {
              left: pointer.x,
              top: pointer.y,
              fontSize: brushSizeRef.current * 4 + 10, // Base 14px + brush scaling
              fill: activeColorRef.current,
              fontFamily: 'Inter, sans-serif',
              editable: true,
            });
            fabricInst.add(textObj);
            fabricInst.setActiveObject(textObj);
            textObj.enterEditing();
            textObj.selectAll();
            fabricInst.requestRenderAll();
          } else if (tool === 'comment') {
            if (opt.target) {
              if (opt.target.data?.type === 'comment') {
                setCommentDraft(opt.target.data.text || '');
                setCommentPopover({ x: opt.e.clientX, y: opt.e.clientY, pin: opt.target });
              }
              return;
            }
            const pointer = fabricInst.getPointer(opt.e);
            const commentObj = new Text('💬', {
              left: pointer.x - 12,
              top: pointer.y - 12,
              fontSize: 24,
              selectable: true,
              hoverCursor: 'pointer',
              data: { type: 'comment', text: '' }
            });
            fabricInst.add(commentObj);
            setCommentDraft("");
            setCommentPopover({ x: opt.e.clientX, y: opt.e.clientY, pin: commentObj });
          }
        });

        fabricInst.on('mouse:up', () => {
          isMouseDown = false;
        });

        fabricInst.on('mouse:move', (opt) => {
          if (activeToolRef.current !== 'eraser' || !isMouseDown) return;
          const pointer = fabricInst.getPointer(opt.e);
          const objects = fabricInst.getObjects();
          const toRemove = objects.filter(obj => {
            const bound = obj.getBoundingRect();
            return (
              pointer.x >= bound.left &&
              pointer.x <= bound.left + bound.width &&
              pointer.y >= bound.top &&
              pointer.y <= bound.top + bound.height
            );
          });
          toRemove.forEach(obj => fabricInst.remove(obj));
          if (toRemove.length > 0) fabricInst.requestRenderAll();
        });

        const handleKeyDown = (e) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeObj = fabricInst.getActiveObject();
            if (activeObj && !activeObj.isEditing) {
              fabricInst.remove(activeObj);
            }
          }
        };
        
        fabricContainerRef.current.tabIndex = 0;
        fabricContainerRef.current.addEventListener('keydown', handleKeyDown);

        if (activeToolRef.current === 'pen' || activeToolRef.current === 'highlighter') {
          fabricInst.isDrawingMode = true;
          fabricInst.freeDrawingBrush = new PencilBrush(fabricInst);
          fabricInst.freeDrawingBrush.color = activeToolRef.current === 'highlighter' ? activeColorRef.current + '80' : activeColorRef.current;
          fabricInst.freeDrawingBrush.width = activeToolRef.current === 'highlighter' ? 16 : brushSizeRef.current;
        } else {
          fabricInst.isDrawingMode = false;
        }

      } catch (e) {
        if (e.name !== 'RenderingCancelledException') {
          console.error(e);
        }
      }
    };
    
    renderPage();
    return () => {
      isSubscribed = false;
      if (renderTask) renderTask.cancel();
    };
  }, [pdf, pageNum, scale, fileMeta?.id]);

  const isDrawingMode = ['pen', 'highlighter', 'text', 'eraser', 'comment'].includes(activeTool);

  const saveComment = () => {
    if (commentPopover && commentPopover.pin) {
      commentPopover.pin.set('data', { type: 'comment', text: commentDraft });
      const inst = fabricInstances.current.get(pageNum);
      if (inst) {
        inst.fire('object:modified', { target: commentPopover.pin });
      }
    }
    setCommentPopover(null);
  };

  return (
    <div 
      id={`page-${pageNum}`}
      data-page={pageNum}
      ref={containerRef}
      className={`page-wrapper ${isDrawingMode ? 'drawing-mode' : ''}`}
      style={{ position: 'relative', width: viewport?.width, height: viewport?.height, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
    >
      <canvas ref={canvasRef} className={`pdf-canvas ${isInverted ? 'inverted' : ''}`} style={{ position: 'relative', zIndex: 1 }} />
      <div className="text-layer" ref={textLayerRef}></div>
      <div ref={fabricContainerRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 4, width: '100%', height: '100%' }}></div>
      
      {commentPopover && createPortal(
        <div style={{
          position: 'fixed',
          left: Math.min(commentPopover.x, window.innerWidth - 240),
          top: commentPopover.y,
          zIndex: 99999,
          background: 'rgba(20,20,20,0.97)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          padding: 12,
          width: 220,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}>
          <textarea
            autoFocus
            placeholder="Add a comment..."
            style={{ width:'100%', height:80, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, color:'#fff', padding:8, resize:'none', fontSize:13, outline:'none' }}
            value={commentDraft}
            onChange={e => setCommentDraft(e.target.value)}
          />
          <div style={{ display:'flex', gap:8, marginTop:8, justifyContent:'flex-end' }}>
            <button onClick={() => setCommentPopover(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:12 }}>Cancel</button>
            <button onClick={saveComment} style={{ background:'var(--accent-vivid)', border:'none', borderRadius:4, color:'#000', padding:'4px 12px', cursor:'pointer', fontWeight:600, fontSize:12 }}>Save</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
