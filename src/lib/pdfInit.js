import * as pdfjsLib from 'pdfjs-dist';

// Vite-compatible worker import
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

export { pdfjsLib };
