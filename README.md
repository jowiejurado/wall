# Wall

A 2008-style Facebook Wall, rebuilt with today's tools. Visitors write a message, add a photo, GIF or emoji, press **Share**, and it shows up at the top of the feed for everyone, live.

Built with React, Next.js and Supabase. Deployed on Vercel.

**Live:** https://wall.jowiejurado.dev · **Portfolio:** https://www.jowiejurado.dev

## Features

- Write a message and press **Share** (or Ctrl/Cmd + Enter)
- 280-character limit with a counter ring that turns amber near the end and red when over; emoji count as one character, the same as the database
- Attach a **photo** inline, like Facebook or X: pick one, drag it onto the box, or paste it. Big photos are resized in the browser before upload
- Add a **GIF** from GIPHY search, or **emoji** from a picker that inserts at the cursor
- Posts are saved in a Supabase `posts` table and the feed shows the latest 50, newest first
- New posts from anyone appear instantly without a refresh (Supabase Realtime), with a "Live" badge while connected
- Colour avatars per name, "5 minutes ago" times that keep updating, and the visitor's name is remembered
- Loading skeletons, empty and error states, keyboard-friendly, and it works on phones

## How it works

| File | What it does |
| --- | --- |
| `supabase/setup.sql` | Creates the table, security rules, Realtime and the photo bucket. Safe to re-run |
| `src/lib/posts.ts` | All database calls: fetch posts, create a post (photo upload or GIF), subscribe to new posts |
| `src/lib/image.ts` | Shrinks large photos before upload |
| `src/app/api/gifs/route.ts` | Server route that searches GIPHY, so the API key never reaches the browser |
| `src/components/Wall.tsx` | Loads the feed, listens for new posts, merges them in without duplicates |
| `src/components/Composer.tsx` | The write box: name, message, inline photo/GIF, emoji, counter, Share |
| `src/components/PostItem.tsx` | One post |
| `src/content/profile.ts` | The wall owner's name, photo and info. Change it to make the wall yours |

### Security

There is no login, so the browser uses Supabase's public anon key. Row Level Security
lets visitors **read** and **add** posts only; there are no update or delete rules, so
nobody can edit or remove someone else's post. Visitors can only set `name`, `message`,
`image_url` and `gif_url`; `id` and `created_at` always come from the database, so posts
can't be backdated or pinned to the top. The database also enforces the length limits,
only accepts photo URLs from this project's bucket and GIF URLs from GIPHY, and allows
one photo or one GIF per post.

## Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste everything from `supabase/setup.sql`, and click **Run**.
   Already set up from an earlier version? Run it again to add GIF support.
3. Open **Project Settings → API** (or **Connect**) and copy the **Project URL** and the **anon public** key.

## GIFs (optional)

Create a free app at [developers.giphy.com](https://developers.giphy.com) (choose **API**) and put the key in
`GIPHY_API_KEY`. Without it, everything else works and the GIF picker says GIFs aren't set up.

## Run it locally

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy on Vercel

Import the repo on Vercel, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`GIPHY_API_KEY` under **Environment Variables**, and click **Deploy**.
