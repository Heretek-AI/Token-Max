import { useCallback, useState } from 'react';

/** Read the hash route's query string. */
function readHashParams(): URLSearchParams {
  const hash = window.location.hash;
  const qStart = hash.indexOf('?');
  return new URLSearchParams(qStart >= 0 ? hash.slice(qStart + 1) : '');
}

/** Write/patch hash query params (null removes) without adding history entries. */
function writeHashParams(patch: Record<string, string | number | null>) {
  const params = readHashParams();
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined) params.delete(k);
    else params.set(k, String(v));
  }
  const qs = params.toString();
  const base = window.location.hash.split('?')[0] || '#/';
  const url = new URL(window.location.href);
  url.hash = qs ? `${base}?${qs}` : base;
  window.history.replaceState(null, '', url.toString());
}

/**
 * URL-synced state: reads from the hash query string first, falls back to the
 * last locally persisted value, then to `default`. Writes update the hash
 * query (shareable) and localStorage (restore). Lives under HashRouter
 * invariants — no server-side interpretation needed.
 */
export function useQueryState<T extends string | number | boolean>(
  key: string,
  defaultValue: T
): [T, (v: T) => void] {
  const storageKey = `tm-${key}`;

  const parse = (raw: string | null): T | undefined => {
    if (raw === null || raw === '') return undefined;
    if (typeof defaultValue === 'number') {
      const n = Number(raw);
      return (Number.isFinite(n) ? n : undefined) as T | undefined;
    }
    if (typeof defaultValue === 'boolean') {
      return (raw === 'true' || raw === '1') as T;
    }
    return raw as T;
  };

  const [value, setValue] = useState<T>(() => {
    try {
      const fromUrl = parse(readHashParams().get(key));
      if (fromUrl !== undefined) return fromUrl;
      const stored = localStorage.getItem(storageKey);
      const fromStorage = stored !== null ? parse(stored) : undefined;
      if (fromStorage !== undefined) return fromStorage;
    } catch {
      /* storage/URL unavailable — keep default */
    }
    return defaultValue;
  });

  const update = useCallback(
    (v: T) => {
      setValue(v);
      try {
        writeHashParams({ [key]: v === defaultValue ? null : String(v) });
      } catch {
        /* URL manipulation optional */
      }
      try {
        localStorage.setItem(storageKey, String(v));
      } catch {
        /* storage optional */
      }
    },
    [key, storageKey, defaultValue]
  );

  return [value, update];
}
