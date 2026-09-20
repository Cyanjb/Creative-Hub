import { useEffect, useState } from 'react';
import { peekAssetUrl, resolveAssetUrl } from '../store/assetDb';

/**
 * Resolve an asset id to a displayable URL.
 * Returns the cached value synchronously on re-render so images don't flash
 * when a component remounts (which the canvas does constantly).
 */
export function useAssetUrl(assetId: string | null | undefined, fallback?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    assetId ? peekAssetUrl(assetId) ?? fallback ?? null : fallback ?? null,
  );

  useEffect(() => {
    if (!assetId) {
      setUrl(fallback ?? null);
      return;
    }
    const cached = peekAssetUrl(assetId);
    if (cached) {
      setUrl(cached);
      return;
    }
    let live = true;
    resolveAssetUrl(assetId).then((u) => {
      if (live) setUrl(u ?? fallback ?? null);
    });
    return () => {
      live = false;
    };
  }, [assetId, fallback]);

  return url;
}
