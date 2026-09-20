/**
 * Asset blob storage.
 *
 * Board structure goes to localStorage (fast, synchronous, survives refresh),
 * but image bytes would blow through its ~5MB quota after two or three drops.
 * So blobs live in IndexedDB and the board JSON only ever stores an assetId.
 */

const DB_NAME = 'creative-hub-assets';
const DB_VERSION = 1;
const STORE = 'blobs';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBlob(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Object-URL cache. Components ask for an asset by id and get back a URL that
 * stays valid for the life of the page — revoking eagerly would break any
 * <img> still pointing at it, and the count is bounded by assets in a project.
 */
const urlCache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

export function peekAssetUrl(id: string): string | null {
  return urlCache.get(id) ?? null;
}

export function resolveAssetUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return Promise.resolve(cached);
  const inflight = pending.get(id);
  if (inflight) return inflight;

  const p = getBlob(id).then((blob) => {
    pending.delete(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(id, url);
    return url;
  });
  pending.set(id, p);
  return p;
}

/** Register an already-known URL (e.g. a remote image) under an asset id. */
export function registerAssetUrl(id: string, url: string) {
  urlCache.set(id, url);
}

export function forgetAssetUrl(id: string) {
  const url = urlCache.get(id);
  if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  urlCache.delete(id);
}

/** Read intrinsic dimensions so cards can be created at the right aspect. */
export function readImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 800, height: 450 });
    img.src = src;
  });
}
