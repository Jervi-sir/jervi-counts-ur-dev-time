// Supabase Edge Function: pushToDb
// Deploy this to: supabase/functions/pushToDb/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PendingSyncData {
  day: string;
  focusedSeconds: number;
  totalSeconds: number; // Total time VS Code was open (regardless of focus)
  languageBreakdown: Record<string, number>;
  source: string;
}

interface SyncPayload {
  username: string; // CHANGED: using username instead of email/userId
  data: PendingSyncData[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 2. Parse Request
    const payload: SyncPayload = await req.json()
    const { username, data } = payload

    if (!username) {
      throw new Error('Username is required')
    }

    console.log(`Processing sync for user: ${username}, ${data.length} days`)

    // 3. Resolve Username -> UUID
    let supabaseUserId: string | null = null;

    // A. Check if profile already exists with this username
    const { data: existingProfile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existingProfile) {
      supabaseUserId = existingProfile.id;
    } else {
      // B. If no profile, we need to create a User to get a valid UUID.
      // We'll generate a dummy email for consistency: username@extension.app
      // This ensures compatibility if profiles is linked to auth.users
      const dummyEmail = `${username}@jervi-extension.local`;

      // Check if auth user exists (edge case where profile was deleted but auth user remains)
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuth = users.find(u => u.email === dummyEmail);

      if (existingAuth) {
        supabaseUserId = existingAuth.id;
      } else {
        // Create new Auth User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: dummyEmail,
          email_confirm: true,
          user_metadata: { source: 'vscode_extension', original_username: username }
        });

        if (createError) throw createError;
        supabaseUserId = newUser.user.id;
        console.log(`Created new Auth user for ${username}: ${supabaseUserId}`);
      }
    }

    if (!supabaseUserId) {
      throw new Error(`Could not resolve UUID for username ${username}`);
    }

    // 4. Upsert Profile
    // We update the profile to ensure the username is set/claimed
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: supabaseUserId, // UUID
        username: username,
        full_name: username, // Default full name to username
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile upsert warning:', profileError)
    }

    // 5. Insert Time Data
    const results = {
      dailyTotals: 0,
      languageTotals: 0,
      errors: [] as string[]
    }

    for (const dayData of data) {
      const { day, focusedSeconds, totalSeconds, languageBreakdown, source } = dayData

      // --- 1. Daily Totals (Accumulate) ---
      // Fetch existing counts to add to them
      const { data: existingDaily } = await supabaseAdmin
        .from('daily_totals')
        .select('focused_seconds, total_seconds')
        .eq('user_id', supabaseUserId)
        .eq('day', day)
        .maybeSingle()

      const currentFocused = (existingDaily?.focused_seconds || 0) + focusedSeconds
      const currentTotal = (existingDaily?.total_seconds || 0) + totalSeconds

      // Upsert daily_totals
      const { error: dailyError } = await supabaseAdmin
        .from('daily_totals')
        .upsert({
          user_id: supabaseUserId, // UUID
          day: day,
          focused_seconds: currentFocused,
          total_seconds: currentTotal,
          source: source || 'vscode',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,day'
        })

      if (dailyError) {
        console.error('Daily totals error:', dailyError)
        results.errors.push(`Daily: ${dailyError.message}`)
      } else {
        results.dailyTotals++
      }

      // --- 2. Language Totals (Accumulate) ---
      if (Object.keys(languageBreakdown).length > 0) {
        // Fetch existing languages for this user+day to accumulate
        const { data: existingLangs } = await supabaseAdmin
          .from('daily_language_totals')
          .select('language, focused_seconds')
          .eq('user_id', supabaseUserId)
          .eq('day', day)

        const existingLangMap = new Map<string, number>()
        if (existingLangs) {
          existingLangs.forEach((r: any) => existingLangMap.set(r.language, r.focused_seconds))
        }

        const langUpserts = []
        for (const [language, seconds] of Object.entries(languageBreakdown)) {
          if (seconds > 0) {
            const previousSeconds = existingLangMap.get(language) || 0
            langUpserts.push({
              user_id: supabaseUserId, // UUID
              day: day,
              language: language,
              focused_seconds: previousSeconds + seconds, // Add new time to existing
              updated_at: new Date().toISOString()
            })
          }
        }

        if (langUpserts.length > 0) {
          const { error: langBatchError } = await supabaseAdmin
            .from('daily_language_totals')
            .upsert(langUpserts, {
              onConflict: 'user_id,day,language'
            })

          if (langBatchError) {
            results.errors.push(`Language Batch Error: ${langBatchError.message}`)
          } else {
            results.languageTotals += langUpserts.length
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        username: username,
        uuid: supabaseUserId,
        processed: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
