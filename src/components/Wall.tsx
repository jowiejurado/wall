"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPosts, subscribeToPosts, supabase, type Post } from "@/lib/posts";
import { Composer } from "./Composer";
import { PostItem } from "./PostItem";
import styles from "./Wall.module.css";

type Status = "loading" | "ready" | "error";

/** Newest first, no duplicates (our own post can arrive twice: from the insert and from Realtime). */
function merge(posts: Post[], incoming: Post): Post[] {
  if (posts.some((p) => p.id === incoming.id)) return posts;
  return [incoming, ...posts].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function Wall({ owner }: { owner: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<Status>(supabase ? "loading" : "error");
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setPosts(await fetchPosts());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  const addPost = useCallback((post: Post) => {
    setPosts((current) => merge(current, post));
    setFreshIds((current) => new Set(current).add(post.id));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from an external system
    load();
    return subscribeToPosts(addPost);
  }, [load, addPost]);

  return (
    <section className={styles.wall} aria-labelledby="wall-heading">
      <h2 id="wall-heading" className={styles.heading}>
        Wall
      </h2>

      <Composer owner={owner} onPosted={addPost} disabled={!supabase} />

      <div className={styles.feed} aria-live="polite" aria-busy={status === "loading"}>
        {status === "loading" && <p className={styles.note}>Loading the wall…</p>}

        {status === "error" && (
          <div className={styles.note} role="alert">
            {supabase ? (
              <>
                <p>The wall didn’t load. Check your connection and try again.</p>
                <button type="button" className={styles.retry} onClick={load}>
                  Try again
                </button>
              </>
            ) : (
              <p>
                This wall isn’t connected to a database yet. Add the Supabase URL and anon key to{" "}
                <code>.env.local</code> (see the README), then restart the dev server.
              </p>
            )}
          </div>
        )}

        {status === "ready" && posts.length === 0 && (
          <p className={styles.note}>Nothing here yet. Be the first to write on {owner}’s wall.</p>
        )}

        {status === "ready" && posts.length > 0 && (
          <ol className={styles.list}>
            {posts.map((post) => (
              <PostItem key={post.id} post={post} fresh={freshIds.has(post.id)} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
