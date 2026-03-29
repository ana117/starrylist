import { StarGroup, StarItem } from '@/lib/types';

export interface SyncPayload {
  items: StarItem[];
  groups: StarGroup[];
}

interface PushResult {
  requiresOverwriteConfirmation: boolean;
}

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

  return requestJson<PushResult>('/api/sync/push', {
    id,
    payload,
    allowOverwrite,
  });
}

export async function pullDataFromSupabase(password: string): Promise<SyncPayload> {
  const id = await deriveSyncId(password);

  return requestJson<SyncPayload>('/api/sync/pull', { id });
}