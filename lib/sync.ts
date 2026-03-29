import { StarGroup, StarItem } from '@/lib/types';

export interface SyncPayload {
  items: StarItem[];
  groups: StarGroup[];
}

interface PushResult {
  requiresOverwriteConfirmation: boolean;
  updatedAt: string | null;
}

interface PullResult {
  payload: SyncPayload;
  updatedAt: string | null;
}

interface SyncStatusResult {
  exists: boolean;
  updatedAt: string | null;
}

export interface StoredSyncMeta {
  id: string;
  lastUpdatedAt: string | null;
}

const SYNC_META_STORAGE_KEY = 'starSyncMeta';

function getEnv(name: string): string {
  const envMap: Record<string, string | undefined> = {
    NEXT_PUBLIC_SYNC_HASH_KEY: process.env.NEXT_PUBLIC_SYNC_HASH_KEY,
  };

  const value = envMap[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getSyncHashKey(): string {
  return getEnv('NEXT_PUBLIC_SYNC_HASH_KEY');
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function requestJson<T>(url: string, payload: object): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => null)) as
    | { error?: string; data?: T }
    | null;

  if (!response.ok) {
    throw new Error(json?.error || 'Sync request failed');
  }

  return (json?.data as T) ?? (json as T);
}

function saveSyncMeta(meta: StoredSyncMeta): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SYNC_META_STORAGE_KEY, JSON.stringify(meta));
}

export function getStoredSyncMeta(): StoredSyncMeta | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(SYNC_META_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSyncMeta>;
    if (typeof parsed.id !== 'string' || !parsed.id) {
      return null;
    }

    return {
      id: parsed.id,
      lastUpdatedAt: typeof parsed.lastUpdatedAt === 'string' ? parsed.lastUpdatedAt : null,
    };
  } catch {
    return null;
  }
}

function toTimestamp(value: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function checkRemoteSyncFreshness(): Promise<{
  hasNewer: boolean;
  remoteUpdatedAt: string | null;
}> {
  const meta = getStoredSyncMeta();
  if (!meta) {
    return { hasNewer: false, remoteUpdatedAt: null };
  }

  const status = await requestJson<SyncStatusResult>('/api/sync/status', {
    id: meta.id,
  });

  if (!status.exists) {
    return { hasNewer: false, remoteUpdatedAt: null };
  }

  const hasNewer = toTimestamp(status.updatedAt) > toTimestamp(meta.lastUpdatedAt);
  return {
    hasNewer,
    remoteUpdatedAt: status.updatedAt,
  };
}

export async function deriveSyncId(password: string): Promise<string> {
  if (!password.trim()) {
    throw new Error('Password is required');
  }

  const key = getSyncHashKey();
  const material = `${key}::${password}`;
  const encoded = new TextEncoder().encode(material);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return toHex(new Uint8Array(hashBuffer));
}

export async function pushDataToSupabase(
  password: string,
  payload: SyncPayload,
  allowOverwrite: boolean
): Promise<PushResult> {
  const id = await deriveSyncId(password);

  const result = await requestJson<PushResult>('/api/sync/push', {
    id,
    payload,
    allowOverwrite,
  });

  if (!result.requiresOverwriteConfirmation) {
    saveSyncMeta({
      id,
      lastUpdatedAt: result.updatedAt,
    });
  }

  return result;
}

export async function pullDataFromSupabase(password: string): Promise<SyncPayload> {
  const id = await deriveSyncId(password);

  const result = await requestJson<PullResult>('/api/sync/pull', { id });

  saveSyncMeta({
    id,
    lastUpdatedAt: result.updatedAt,
  });

  return result.payload;
}