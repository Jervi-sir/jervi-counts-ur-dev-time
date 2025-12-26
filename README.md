### seeding fake data
```
npx tsx db/seed.ts
```

### supabase queries
```
-- 1) function that runs with elevated privileges
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'preferred_username',
      new.raw_user_meta_data->>'login'
    ),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 2) trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
```


### Enable RLS
```
alter table public.profiles enable row level security;
alter table public.daily_totals enable row level security;
```

### Profiles policies
```
-- Everyone logged-in can read profiles (for leaderboard)
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

-- User can update their own profile
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

### Daily totals policies
```
-- Logged-in users can read totals (leaderboard)
create policy "daily_totals_select_authenticated"
on public.daily_totals for select
to authenticated
using (true);

-- User can insert/update their own totals
create policy "daily_totals_insert_own"
on public.daily_totals for insert
to authenticated
with check (auth.uid() = user_id);

create policy "daily_totals_update_own"
on public.daily_totals for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

```