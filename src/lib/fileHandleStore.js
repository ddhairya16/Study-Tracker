const DB_NAME = 'studytracker-filehandles';
const STORE_NAME = 'handles';

export async function saveFileHandle(pdfId, fileHandle) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id: pdfId, handle: fileHandle });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFileHandle(pdfId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(pdfId);
    req.onsuccess = () => resolve(req.result?.handle ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function removeFileHandle(pdfId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(pdfId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
