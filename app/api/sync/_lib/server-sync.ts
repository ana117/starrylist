import { createClient } from '@supabase/supabase-js';
import { StarGroup, StarItem } from '@/lib/types';

export interface SyncPayload {
  items: StarItem[];
  groups: StarGroup[];
}

interface PushInput {
  id: string;
  payload: SyncPayload;
  allowOverwrite: boolean;
}

interface PullInput {
  id: string;
}

interface StatusInput {
  id: string;
}

interface PushResult {
  requiresOverwriteConfirmation: boolean;
  updatedAt: string | null;
}

interface PullResult {
  payload: SyncPayload;
  updatedAt: string | null;
}

interface StatusResult {
  exists: boolean;
  updatedAt: string | null;
}

function getRequiredEnv(name: string): string {
  const envMap: Record<string, string | undefined> = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_SYNC_TABLE: process.env.SUPABASE_SYNC_TABLE,
  };

  const value = envMap[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = getRequiredEnv('SUPABASE_SECRET_KEY');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getSyncTableName(): string {
  return getRequiredEnv('SUPABASE_SYNC_TABLE');
}

export function parsePushInput(body: unknown): PushInput {
  const b = body as Partial<PushInput>;

  if (typeof b?.id !== 'string' || !b.id.trim()) {
    throw new Error('Invalid push payload: id is required');
  }

  const rawItems = b.payload?.items;
  const rawGroups = b.payload?.groups;

  if (!Array.isArray(rawItems) || !Array.isArray(rawGroups)) {
    throw new Error('Invalid push payload: payload.items and payload.groups must be arrays');
  }

  return {
    id: b.id,
    payload: {
      items: rawItems,
      groups: rawGroups,
    },
    allowOverwrite: Boolean(b.allowOverwrite),
  };
}

export function parsePullInput(body: unknown): PullInput {
  const b = body as Partial<PullInput>;
  if (typeof b?.id !== 'string' || !b.id.trim()) {
    throw new Error('Invalid pull payload: id is required');
  }

  return { id: b.id };
}

export function parseStatusInput(body: unknown): StatusInput {
  const b = body as Partial<StatusInput>;
  if (typeof b?.id !== 'string' || !b.id.trim()) {
    throw new Error('Invalid status payload: id is required');
  }

  return { id: b.id };
}

export async function handlePushSync(input: PushInput): Promise<PushResult> {
  const supabase = getSupabaseServerClient();
  const table = getSyncTableName();

  if (!input.allowOverwrite) {
    const { data: existingRow, error: checkError } = await supabase
      .from(table)
      .select('id')
      .eq('id', input.id)
      .maybeSingle();

    if (checkError) {
      throw new Error(checkError.message);
    }

    if (existingRow) {
      const { data: currentRow, error: currentRowError } = await supabase
        .from(table)
        .select('updated_at')
        .eq('id', input.id)
        .maybeSingle();

      if (currentRowError) {
        throw new Error(currentRowError.message);
      }

      return {
        requiresOverwriteConfirmation: true,
        updatedAt: (currentRow?.updated_at as string | undefined) ?? null,
      };
    }
  }

  const { data: upsertRow, error: upsertError } = await supabase
    .from(table)
    .upsert({ id: input.id, data: input.payload }, { onConflict: 'id' })
    .select('updated_at')
    .single();

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return {
    requiresOverwriteConfirmation: false,
    updatedAt: (upsertRow?.updated_at as string | undefined) ?? null,
  };
}

export async function handlePullSync(input: PullInput): Promise<PullResult> {
  const supabase = getSupabaseServerClient();
  const table = getSyncTableName();

  const { data, error } = await supabase
    .from(table)
    .select('data, updated_at')
    .eq('id', input.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !data.data) {
    throw new Error('No synced data found for this password');
  }

  const payload = data.data as Partial<SyncPayload>;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const groups = Array.isArray(payload.groups) ? payload.groups : [];

  return {
    payload: { items, groups },
    updatedAt: (data.updated_at as string | undefined) ?? null,
  };
}

export async function handleStatusSync(input: StatusInput): Promise<StatusResult> {
  const supabase = getSupabaseServerClient();
  const table = getSyncTableName();

  const { data, error } = await supabase
    .from(table)
    .select('updated_at')
    .eq('id', input.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      exists: false,
      updatedAt: null,
    };
  }

  return {
    exists: true,
    updatedAt: (data.updated_at as string | undefined) ?? null,
  };
}
