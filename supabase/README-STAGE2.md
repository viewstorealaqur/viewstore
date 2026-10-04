# MobiGear — Stage 2 Setup Guide

This document explains the manual steps needed to connect a Supabase **development** project to the storefront. Do **not** use a production Supabase project for development or testing.

---

## Prerequisites

- A Supabase account (supabase.com)
- Supabase CLI installed: `npm install -g supabase`
- Node 20+ and npm

---

## 1. Create a development Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) → **New project**
2. Choose a region close to you
3. Write down a strong database password (you won't need it in env files, but keep it safe)
4. **Do not** use this project for anything real yet — it is the dev project

---

## 2. Get your API credentials

In the Supabase dashboard → **Settings → API**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (safe to expose; RLS must protect data) |

Do not add a secret key to this storefront. The application does not need elevated database access. Copy `.env.example` to `.env.local` and fill in the URL, publishable key, and owner UUID after creating the owner account:

```bash
cp .env.example .env.local
# then edit .env.local with real values
```

`.env.local` is in `.gitignore` and will never be committed.

---

## 3. Apply the migrations

Option A — Supabase CLI (recommended):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Option B — Supabase SQL editor (manual):

Copy and run each migration file in order in the Supabase SQL editor:

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_storage.sql`

---

## 4. Create the owner account

> **Why this works the way it does:** The authorized owner is identified by a row in the `owners` table. Add that row yourself in the Supabase SQL editor after inviting the owner; never expose an endpoint that lets a user edit this table.

1. In Supabase dashboard → **Authentication → Users** → **Invite user** (or Add user)
2. Create exactly one user with the owner's email address
3. Copy that user's UUID from the users table
4. Run the following SQL in the Supabase SQL editor (with your real UUID):

```sql
-- Replace the UUID below with the owner's real auth user UUID
INSERT INTO public.owners (user_id)
VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
```

5. Set the same owner UUID as `OWNER_USER_ID` in `.env.local`. This is a server-only identifier, not a password. RLS still independently checks the `owners` table for database access.

---

## 5. Disable public sign-up

> **Why:** If sign-up is enabled, anyone can create an account. They cannot grant themselves owner access (the `owners` table blocks that), but there is no reason to allow unnecessary accounts.

In Supabase dashboard → **Authentication → Providers → Email**:

- Toggle **"Enable email sign-ups"** to **OFF**
- This means only pre-created users (invited by you) can log in

---

## 6. Configure the storage bucket

The `0003_storage.sql` migration creates the bucket via SQL. You should also verify the following in the Supabase dashboard → **Storage → product-images → Bucket Settings**:

| Setting | Value |
|---|---|
| Public bucket | ✅ On (images are publicly viewable) |
| File size limit | 5 MB (5242880 bytes) |
| Allowed MIME types | `image/jpeg, image/png, image/webp` |

---

## 7. Run the security tests

Once the migrations are applied to a local Supabase instance:

```bash
npx supabase start
npx supabase db reset   # applies all migrations from scratch
npx supabase test db    # runs supabase/tests/rls_security.sql via pgTAP
```

Expected output: **28 tests passed, 0 failed**

---

## 8. Verify the storefront still builds

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three must pass with zero errors before moving to Stage 3.

---

## Security checklist before Stage 3

- [ ] RLS enabled on all 4 tables: `products`, `product_images`, `store_settings`, `owners`
- [ ] `FORCE ROW LEVEL SECURITY` on all 4 tables
- [ ] Anonymous users can only read published products and store_settings
- [ ] No Supabase secret/service-role key is used by the storefront
- [ ] Public sign-up is disabled in Supabase dashboard
- [ ] Owner account created by admin invite, not self-registration
- [ ] Owner row inserted manually through the Supabase SQL editor, not via user action
- [ ] `product-images` bucket: public read, owner-only write
- [ ] Bucket file size limit: 5 MB
- [ ] Bucket MIME types: jpeg, png, webp only
