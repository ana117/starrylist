# StarryList

StarryList is a local-first wishlist app with groups, links, priorities, raw JSON import/export, and password-based cloud sync to Supabase.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloud sync setup (Supabase)

Sync uses a password entered by the user. The client hashes `SYNC_HASH_KEY + password` in the browser, then uses the hash as the row `id`.
Database access runs through server routes (`/api/sync/push` and `/api/sync/pull`) using a Supabase service role key.

### 1) Create env file

Create `.env.local` from `.env.example` and set values:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (server only, **never** expose with `NEXT_PUBLIC_`)
- `NEXT_PUBLIC_SYNC_HASH_KEY`
- `SUPABASE_SYNC_TABLE` or `NEXT_PUBLIC_SUPABASE_SYNC_TABLE` (optional, defaults to `starry_sync`)

### 2) Create the table in Supabase

```sql
create table if not exists public.starry_sync (
	id text primary key,
	data jsonb not null
);
```

### 3) RLS recommendation

Keep RLS enabled on your sync table and avoid granting broad `anon` write policies.
Because requests go through your own server route with `SUPABASE_SECRET_KEY`, the browser no longer needs direct table access.

## Sync behavior

- **Push**: Writes local `{ items, groups }` to Supabase using hashed password as `id`.
- **Overwrite protection**: If data already exists for the same password hash, app asks for explicit overwrite confirmation.
- **Pull**: Replaces local data with remote data for that password hash.

## Quality checks

```bash
npm run lint
npm run build
```
