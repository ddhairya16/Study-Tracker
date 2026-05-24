import { pdfjsLib } from './pdfInit.js';

export async function openPdfFromFile(file) {
  // Use object URL for streaming — faster than ArrayBuffer
  const objectUrl = URL.createObjectURL(file);
  try {
    const doc = await pdfjsLib.getDocument(objectUrl).promise;
    return { doc, objectUrl }; // caller must revoke objectUrl when done
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}
