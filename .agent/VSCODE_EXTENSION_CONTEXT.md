
# VS Code Extension Developer Context

This document outlines the context required for building a VS Code extension that interacts with the `Jervi Counts Example` backend.

## 1. Objective
The extension should track developer activity (time spent coding, languages used) and sync this data to the Supabase backend. It needs to handle authentication to ensure data is attributed to the correct user.

## 2. Authentication Strategy
The extension acts as a client that must be authenticated to write to the database, at least we get the username or email of the currely authenticated github user

## 3. Data Schema & Requirements

The extension needs to populate two main tables.

### A. `daily_totals`
Tracks the total `focused_seconds` for a user on a given day.
- **Constraints**: One row per `user_id` per `day`.
- **Logic**: The extension should likely UPSERT (insert or update) this row, incrementing the time or identifying the new total.

**Schema:**
```typescript
interface DailyTotal {
  user_id: string;      // (UUID) Handled by Auth
  day: string;          // (Date) YYYY-MM-DD
  focused_seconds: number; 
  source: string;       // Default: 'vscode'
}
```

### B. `daily_language_totals`
Tracks time split by language (e.g., TypeScript, Python).
- **Constraints**: One row per `user_id` per `day` per `language`.

**Schema:**
```typescript
interface DailyLanguageTotal {
  user_id: string;      // (UUID) Handled by Auth
  day: string;          // (Date) YYYY-MM-DD
  language: string;     // e.g. 'typescript'
  focused_seconds: number;
}
```

## 4. Syncing Logic (Recommended)

Since calculating "focused time" involves debouncing user activity (detecting idle time), the extension should:
1.  **Local Tracking**: Maintain a local counter of active seconds (e.g., in memory or local storage).
2.  **Heartbeat/Batch Sync**: Every X minutes (e.g., 5 or 15 mins), send the *accumulated* time to the server.
    - *Crucial*: Send the *increment* (delta) since the last sync, OR handle strict total synchronization if logic permits. Simple incrementing is often safer against race conditions if multiple VS Code windows are open.

## 5. API Interaction

The extension should utilize the Supabase JS Client (or raw HTTP REST calls) to perform an **RPC** (Remote Procedure Call) or direct Table Insert if RLS permits.

**Preferred Pattern (RPC):**
Creating a Postgres function `increment_focus_time` is safer than raw updates.

```sql
-- Example RPC (Server Side)
create or replace function increment_focus_time(
  p_day date,
  p_seconds int,
  p_language text
)
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Update Daily Total
  insert into daily_totals (user_id, day, focused_seconds)
  values (auth.uid(), p_day, p_seconds)
  on conflict (user_id, day)
  do update set focused_seconds = daily_totals.focused_seconds + excluded.focused_seconds;

  -- 2. Update Language Total
  if p_language is not null then
    insert into daily_language_totals (user_id, day, language, focused_seconds)
    values (auth.uid(), p_day, p_language, p_seconds)
    on conflict (user_id, day, language)
    do update set focused_seconds = daily_language_totals.focused_seconds + excluded.focused_seconds;
  end if;
end;
$$;
```

**VS Code Implementation:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supaUrl, supaKey, {
  global: { headers: { Authorization: `Bearer ${userAccessToken}` } }
})

// Sync function
async function syncTime(seconds: number, language: string) {
  const day = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase.rpc('increment_focus_time', {
    p_day: day,
    p_seconds: seconds,
    p_language: language
  });
  
  if (error) console.error('Sync failed', error);
}
```
