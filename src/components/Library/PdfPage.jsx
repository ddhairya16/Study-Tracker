// src/components/Library/PdfPage.jsx
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { pdfjsLib } from '../../lib/pdfInit';
import { Canvas, PencilBrush, IText, FabricObject } from 'fabric';

const PdfPage = forwardRef(({ doc, pageNumber, scale, drawingMode, strokeColor, strokeWidth, savedJSON }, ref) => {
  const pdfCanvasRef = useRef(null);
  const fabricCanvasElRef = useRef(null);
  const fcRef = useRef(null); // fabric.Canvas instance
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const fc = fcRef.current;
      if (!fc) return;
      // Don't intercept if user is typing in a text object
      const active = fc.getActiveObject();
      if (active && active.type === 'i-text' && active.isEditing) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = fc.getActiveObjects();
        if (selected.length === 0) return;
        e.preventDefault();
        snapshot();
        selected.forEach(obj => fc.remove(obj));
        fc.discardActiveObject();
        fc.renderAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => setIsNearViewport(entries[0].isIntersecting),
      { rootMargin: "100% 0px" }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    undo() {
      const fc = fcRef.current;
      if (!fc || historyRef.current.length === 0) return;
      redoRef.current.push(JSON.stringify(fc.toJSON()));
      const prev = historyRef.current.pop();
      fc.loadFromJSON(prev, () => fc.renderAll());
    },
    redo() {
      const fc = fcRef.current;
      if (!fc || redoRef.current.length === 0) return;
      historyRef.current.push(JSON.stringify(fc.toJSON()));
      const next = redoRef.current.pop();
      fc.loadFromJSON(next, () => fc.renderAll());
    },
    getJSON() {
      return fcRef.current ? JSON.stringify(fcRef.current.toJSON()) : null;
    },
    loadJSON(json) {
      const fc = fcRef.current;
      if (!fc || !json) return;
      fc.loadFromJSON(json, () => fc.renderAll());
      historyRef.current = [];
      redoRef.current = [];
    },
    clear() {
      const fc = fcRef.current;
      if (!fc) return;
      snapshot();
      fc.clear();
      fc.renderAll();
    },
    scrollIntoView(opts) {
      containerRef.current?.scrollIntoView(opts);
    }
  }));

  function snapshot() {
    const fc = fcRef.current;
    if (!fc) return;
    historyRef.current.push(JSON.stringify(fc.toJSON()));
    redoRef.current = [];
  }

  // Render PDF page
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    let renderTask = null;

    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const vp = page.getViewport({ scale });
        setSize({ width: vp.width, height: vp.height });

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;
        canvas.width = vp.width;
        canvas.height = vp.height;

        renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
        await renderTask.promise;
      } catch (e) {
        if (e.name !== 'RenderingCancelledException') console.error('PDF render:', e);
      }
    })();

    return () => { cancelled = true; renderTask?.cancel(); };
  }, [doc, pageNumber, scale]);

  // Initialize fabric.Canvas once size is known
  useEffect(() => {
    if (!isNearViewport || !size.width || !size.height || !fabricCanvasElRef.current) return;

    // Dispose previous instance
    if (fcRef.current) {
      fcRef.current.dispose();
      fcRef.current = null;
    }

    const fc = new Canvas(fabricCanvasElRef.current, {
      width: size.width,
      height: size.height,
      backgroundColor: null,
      selection: true,
    });

    FabricObject.prototype.cornerStyle = 'circle';
    FabricObject.prototype.cornerSize = 8;
    FabricObject.prototype.cornerColor = 'rgba(0, 212, 255, 0.8)';
    FabricObject.prototype.borderColor = 'rgba(0, 212, 255, 0.5)';
    FabricObject.prototype.transparentCorners = false;
    FabricObject.prototype.rotatingPointOffset = 20;

    fcRef.current = fc;
    historyRef.current = [];
    redoRef.current = [];

    if (savedJSON) {
      fc.loadFromJSON(savedJSON, () => fc.renderAll());
    }

    // Track history
    fc.on('object:added', snapshot);
    fc.on('object:modified', snapshot);
    fc.on('object:removed', snapshot);

    return () => {
      fc.dispose();
      fcRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearViewport, size.width, size.height]);

  // React to tool changes
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;

    // Always reset
    fc.isDrawingMode = false;
    fc.selection = false;
    fc.off('mouse:down');
    fc.defaultCursor = 'default';
    fc.forEachObject(o => {
      o.selectable = false;
      o.evented = drawingMode === 'eraser';
    });

    if (drawingMode === 'pointer') {
      fc.selection = true;
      fc.defaultCursor = 'default';
      fc.forEachObject(o => { o.selectable = true; o.evented = true; });

    } else if (drawingMode === 'pen') {
      fc.isDrawingMode = true;
      fc.defaultCursor = 'crosshair';
      const brush = new PencilBrush(fc);
      brush.color = strokeColor || '#ffea00';
      brush.width = strokeWidth || 4;
      fc.freeDrawingBrush = brush;

    } else if (drawingMode === 'highlighter') {
      fc.isDrawingMode = true;
      fc.defaultCursor = 'crosshair';
      const brush = new PencilBrush(fc);
      brush.color = 'rgba(255, 234, 0, 0.3)';
      brush.width = 20;
      fc.freeDrawingBrush = brush;

    } else if (drawingMode === 'eraser') {
      fc.selection = false;
      fc.defaultCursor = 'cell';
      fc.forEachObject(o => { o.selectable = false; o.evented = true; });
      fc.on('mouse:down', (opt) => {
        if (opt.target) {
          snapshot();
          fc.remove(opt.target);
          fc.renderAll();
        }
      });

    } else if (drawingMode === 'text') {
      fc.isDrawingMode = false;
      fc.selection = true;
      fc.defaultCursor = 'text';
      fc.forEachObject(o => { o.selectable = true; o.evented = true; });

      const handleTextClick = (opt) => {
        // If clicked an existing i-text, enter editing
        if (opt.target && opt.target.type === 'i-text') {
          fc.setActiveObject(opt.target);
          opt.target.enterEditing();
          fc.renderAll();
          return;
        }
        // If clicked any other existing object, ignore
        if (opt.target) return;

        // Create new text at click position
        const pointer = fc.getPointer(opt.e);
        const textObj = new IText('', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 18,
          fill: strokeColor || '#00d4ff',
          fontFamily: 'sans-serif',
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          cursorColor: strokeColor || '#00d4ff',
          editingBorderColor: 'rgba(0,212,255,0.5)',
        });

        fc.add(textObj);
        fc.setActiveObject(textObj);
        fc.renderAll();

        // Must defer enterEditing slightly so fabric finishes adding the object
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            textObj.enterEditing();
            fc.renderAll();
          });
        });
      };

      fc.on('mouse:down', handleTextClick);
    }

    fc.renderAll();
  }, [drawingMode, strokeColor, strokeWidth]);

  return (
    <div ref={containerRef} data-page={pageNumber} style={{
      position: 'relative',
      width: size.width || 'auto',
      height: size.height || 'auto',
      backgroundColor: '#fff',
      boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
      margin: '0 auto',
      borderRadius: 2,
    }}>
      {/* PDF layer */}
      <canvas
        ref={pdfCanvasRef}
        style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'block' }}
      />
      {/* Fabric annotation layer — MUST be position absolute, same size, zIndex above PDF */}
      {size.width > 0 && (
        <canvas
          ref={fabricCanvasElRef}
          style={{ position: 'absolute', inset: 0, zIndex: 2 }}
        />
      )}
    </div>
  );
});

export default PdfPage;