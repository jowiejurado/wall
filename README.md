# Wall

A 2008-style Facebook Wall. Visitors write a message (and optionally attach a photo), press **Share**, and it shows up at the top of the feed for everyone, live.

Built with React, Next.js and Supabase. Deployed on Vercel.

**Live:** _add your Vercel URL here_

## Features

- Write a message (up to 280 characters, with a live counter) and press **Share**, or Ctrl/Cmd + Enter
- Posts are saved in a Supabase `posts` table and the feed shows the latest 50, newest first
- New posts from anyone appear instantly without a refresh (Supabase Realtime)
- Optional photo on a post (Supabase Storage, images up to 5 MB)
- The visitor's name is remembered for next time
- Loading, empty and error states, and it works on phones

## How it works

| File | What it does |
| --- | --- |
| `supabase/setup.sql` | Creates the table, security rules, Realtime and the photo bucket |
| `src/lib/posts.ts` | All database calls: fetch posts, create a post (with photo upload), subscribe to new posts |
| `src/components/Wall.tsx` | Loads the feed, listens for new posts, merges them in without duplicates |
| `src/components/Composer.tsx` | The write box: name, message, photo, character count, Share |
| `src/components/PostItem.tsx` | One post, with "5 minutes ago" style times that keep updating |
| `src/content/profile.ts` | The wall owner's name, photo and info. Change it to make the wall yours |

### Security

There is no login, so the browser uses Supabase's public anon key. Row Level Security
lets visitors **read** and **add** posts only; there are no update or delete rules, so
nobody can edit or remove someone else's post. Visitors can only set `name`, `message`
and `image_url`; `id` and `created_at` always come from the database, so posts can't be
backdated or pinned to the top. Length limits are enforced in the database as well as
the form.

## Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste everything from `supabase/setup.sql`, and click **Run**.
3. Open **Project Settings → API** (or **Connect**) and copy the **Project URL** and the **anon public** key.

## Run it locally

```bash
cp .env.example .env.local   # then paste your URL and anon key into .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy on Vercel

Import the repo on Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
under **Environment Variables**, and click **Deploy**.
