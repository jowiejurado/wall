import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Post = {
  id: string;
  name: string;
  message: string;
  image_url: string | null;
  gif_url: string | null;
  created_at: string;
};

export type Gif = {
  id: string;
  title: string;
  /** Small animated preview for the picker grid. */
  preview: string;
  /** The version saved on the post. */
  url: string;
  width: number;
  height: number;
};

export type NewPost = {
  name: string;
  message: string;
  photo: File | null;
  gif: Gif | null;
};

export const MAX_MESSAGE = 280;
export const MAX_NAME = 40;
export const FEED_LIMIT = 50;
export const PHOTO_BUCKET = "wall-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const COLUMNS = "id, name, message, image_url, gif_url, created_at";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Null until the two Supabase env vars are set (see README). */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

function client(): SupabaseClient {
  if (!supabase) throw new Error("Supabase isn't configured. Add the keys to .env.local.");
  return supabase;
}

// Postgres "undefined column": the database predates GIFs (setup.sql not re-run yet).
const isMissingGifColumn = (error: { code?: string } | null) => error?.code === "42703";

export async function fetchPosts(): Promise<Post[]> {
  const query = (columns: string) =>
    client().from("posts").select(columns).order("created_at", { ascending: false }).limit(FEED_LIMIT);

  let { data, error } = await query(COLUMNS);
  if (isMissingGifColumn(error)) {
    // Keep the wall working on an older database; posts just have no GIFs.
    ({ data, error } = await query(COLUMNS.replace(", gif_url", "")));
  }
  if (error) throw error;
  return (data as unknown as Post[]).map((post) => ({ ...post, gif_url: post.gif_url ?? null }));
}

export class PhotoUploadError extends Error {}

export async function createPost({ name, message, photo, gif }: NewPost): Promise<Post> {
  const db = client();
  let image_url: string | null = null;

  if (photo) {
    const ext = photo.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(PHOTO_BUCKET).upload(path, photo, {
      contentType: photo.type,
      cacheControl: "31536000",
    });
    if (error) throw new PhotoUploadError("The photo didn’t upload. Try again, or pick a different one.");
    image_url = db.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const row = { name: name.trim(), message: message.trim(), image_url, ...(gif && { gif_url: gif.url }) };
  const insert = (columns: string) => db.from("posts").insert(row).select(columns).single();

  let { data, error } = await insert(COLUMNS);
  if (isMissingGifColumn(error) && !gif) {
    ({ data, error } = await insert(COLUMNS.replace(", gif_url", "")));
  }
  if (error) throw error;
  const post = data as unknown as Post;
  return { ...post, gif_url: post.gif_url ?? null };
}

/**
 * Calls `onPost` whenever anyone shares a new post, and `onLive` when the
 * live connection comes up or drops. Returns an unsubscribe function.
 */
export function subscribeToPosts(onPost: (post: Post) => void, onLive?: (live: boolean) => void): () => void {
  const db = client();
  const channel = db
    .channel("wall-posts")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) =>
      onPost({ ...(payload.new as Post), gif_url: (payload.new as Partial<Post>).gif_url ?? null }),
    )
    .subscribe((status) => onLive?.(status === "SUBSCRIBED"));

  return () => {
    db.removeChannel(channel);
  };
}
