import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Post = {
  id: string;
  name: string;
  message: string;
  image_url: string | null;
  created_at: string;
};

export type NewPost = {
  name: string;
  message: string;
  photo: File | null;
};

export const MAX_MESSAGE = 280;
export const MAX_NAME = 40;
export const FEED_LIMIT = 50;
export const PHOTO_BUCKET = "wall-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Null until the two Supabase env vars are set (see README). */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

function client(): SupabaseClient {
  if (!supabase) throw new Error("Supabase isn't configured. Add the keys to .env.local.");
  return supabase;
}

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await client()
    .from("posts")
    .select("id, name, message, image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error) throw error;
  return data;
}

export async function createPost({ name, message, photo }: NewPost): Promise<Post> {
  const db = client();
  let image_url: string | null = null;

  if (photo) {
    const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(PHOTO_BUCKET).upload(path, photo, {
      contentType: photo.type,
      cacheControl: "31536000",
    });
    if (error) throw new Error("The photo didn't upload. Try a smaller JPG or PNG.");
    image_url = db.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await db
    .from("posts")
    .insert({ name: name.trim(), message: message.trim(), image_url })
    .select("id, name, message, image_url, created_at")
    .single();

  if (error) throw error;
  return data;
}

/** Calls `onPost` whenever anyone shares a new post. Returns an unsubscribe function. */
export function subscribeToPosts(onPost: (post: Post) => void): () => void {
  const db = client();
  const channel = db
    .channel("wall-posts")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) =>
      onPost(payload.new as Post),
    )
    .subscribe();

  return () => {
    db.removeChannel(channel);
  };
}
