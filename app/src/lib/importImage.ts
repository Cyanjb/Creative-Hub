import { putBlob, registerAssetUrl, readImageSize } from '../store/assetDb';
import { makeAsset } from './factories';
import type { Asset } from '../store/types';

/**
 * Take a File (from drop or file picker) into the asset store.
 * Blob goes to IndexedDB; the returned Asset record goes to the board JSON.
 */
export async function importImageFile(file: File, projectId: string, category = 'reference'): Promise<Asset> {
  const asset = makeAsset(projectId, {
    name: file.name.replace(/\.[^.]+$/, ''),
    mime: file.type || 'image/png',
    kind: 'upload',
    category,
  });

  await putBlob(asset.id, file);
  const url = URL.createObjectURL(file);
  registerAssetUrl(asset.id, url);

  const { width, height } = await readImageSize(url);
  asset.width = width;
  asset.height = height;
  return asset;
}

/**
 * Register a remote image URL as an asset. We deliberately do NOT fetch and
 * cache the bytes: many image hosts block cross-origin reads, and a failed
 * fetch would lose an image that displays perfectly well via <img src>.
 */
export async function importImageUrl(url: string, projectId: string, category = 'reference'): Promise<Asset> {
  const name = (() => {
    try {
      const p = new URL(url).pathname.split('/').filter(Boolean).pop();
      return p ? p.replace(/\.[^.]+$/, '') : 'image';
    } catch {
      return 'image';
    }
  })();

  const asset = makeAsset(projectId, { name, url, kind: 'url', category });
  registerAssetUrl(asset.id, url);
  const { width, height } = await readImageSize(url);
  asset.width = width;
  asset.height = height;
  return asset;
}

/** Fit an image's intrinsic size into a sane card size on the canvas. */
export function fitCardSize(w: number, h: number, max = 360): { w: number; h: number } {
  if (!w || !h) return { w: max, h: Math.round(max * 0.5625) };
  const scale = Math.min(max / w, max / h, 1);
  // Small images still deserve a usable card.
  const s = w * scale < 160 && h * scale < 160 ? Math.min(max / w, max / h) : scale;
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

export function filesFromDrop(dt: DataTransfer): File[] {
  const out: File[] = [];
  if (dt.items) {
    for (const item of Array.from(dt.items)) {
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f && f.type.startsWith('image/')) out.push(f);
      }
    }
  } else {
    for (const f of Array.from(dt.files)) {
      if (f.type.startsWith('image/')) out.push(f);
    }
  }
  return out;
}
