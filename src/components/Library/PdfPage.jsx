import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

export default function PdfPage({ doc, pageNumber, scale }) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const [viewport, setViewport] = useState(null);

  useEffect(() => {
    let renderTask = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (isCancelled) return;

        const vp = page.getViewport({ scale });
        setViewport(vp);

        // Render Canvas
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = vp.height;
        canvas.width = vp.width;

        const renderContext = {
          canvasContext: context,
          viewport: vp,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
        if (isCancelled) return;

        // Render Text Layer
        const textContent = await page.getTextContent();
        if (isCancelled) return;

        const textLayerDiv = textLayerRef.current;
        if (textLayerDiv) {
          textLayerDiv.innerHTML = '';
          pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: vp,
            textDivs: [],
          });
        }
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error("Error rendering page:", err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [doc, pageNumber, scale]);

  return (
    <div 
      className="pdf-page-wrapper" 
      style={{ 
        position: 'relative', 
        width: viewport ? viewport.width : 'auto', 
        height: viewport ? viewport.height : 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        backgroundColor: '#fff',
        margin: '0 auto'
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ display: 'block', width: '100%', height: '100%' }} 
      />
      
      {/* The text layer will perfectly overlay the canvas and allow user text selection */}
      <div 
        ref={textLayerRef} 
        className="textLayer" 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          opacity: 0.2, // Make text selection slightly visible/transparent
          lineHeight: 1 
        }} 
      />

      <style>{`
        /* Overrides to ensure textLayer handles selection but is invisible otherwise */
        .textLayer {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          opacity: 0.2; 
          line-height: 1.0;
        }
        .textLayer > span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .textLayer ::selection {
          background: rgba(0, 212, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
