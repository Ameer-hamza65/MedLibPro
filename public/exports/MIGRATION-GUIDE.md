# Migration Guide: Lovable Cloud → Your Own Supabase

## Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API

## Step 2: Run the Schema SQL
1. Open SQL Editor in your Supabase Dashboard
2. Paste and run the contents of `SUPABASE-FULL-EXPORT.sql`
3. This creates all tables, enums, functions, triggers, RLS policies, and storage

## Step 3: Deploy Edge Functions
Copy the two edge function folders to your local Supabase CLI project:
```
supabase/functions/gemini-ai/index.ts
supabase/functions/parse-pdf/index.ts
```

Deploy them:
```bash
supabase functions deploy gemini-ai --no-verify-jwt
supabase functions deploy parse-pdf --no-verify-jwt
```

## Step 4: Set Edge Function Secrets
```bash
supabase secrets set LOVABLE_API_KEY=<your-lovable-api-key>
# Or replace with your own Gemini API key and update the edge function URLs
```

**Important:** The edge functions currently use `https://ai.gateway.lovable.dev/v1/chat/completions`. To use your own AI provider, update the fetch URLs in both edge functions to point to your preferred API (e.g., Google AI Studio, OpenAI, etc.).

## Step 5: Update Frontend Environment
Create a `.env` file in your project root:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=YOUR-PROJECT-ID
```

## Step 6: Configure Auth
In Supabase Dashboard → Authentication → Providers:
- Enable **Email** provider
- Toggle **Auto-confirm email** ON for demo, OFF for production
- Set **Site URL** to your domain
- Add redirect URLs

## Step 7: Storage
The SQL export creates the `book-files` bucket. Verify it exists in Storage section.

## Step 8: Migrate Data (Optional)
Export your existing data from Lovable Cloud and import it:
- Use Cloud View → Database → Tables → Export for each table
- Import via Supabase Dashboard → Table Editor → Import CSV

## Architecture Notes
- All AI calls go through edge functions (not client-side)
- RLS policies use `SECURITY DEFINER` helper functions to avoid recursion
- `platform_roles` table is separate from profile roles (security best practice)
- Every new user auto-gets `platform_admin` role via trigger (change for production!)
