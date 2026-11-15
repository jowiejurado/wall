"use client";

import { ArrowPathIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
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
  const [live, setLive] = useState(false);

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
    return subscribeToPosts(addPost, setLive);
  }, [load, addPost]);

  const firstName = owner.split(" ")[0];

  return (
    <section className={styles.wall} aria-labelledby="wall-heading">
      <h2 id="wall-heading" className={styles.srOnly}>
        {firstName}’s wall
      </h2>

      <Composer owner={owner} onPosted={addPost} disabled={!supabase} />

      <div className={styles.feedHead}>
        <h3>Wall posts</h3>
        {live && (
          <span className={styles.live} title="New posts appear here automatically">
            <span className={styles.liveDot} aria-hidden="true" />
            Live
          </span>
        )}
      </div>

      <div aria-live="polite" aria-busy={status === "loading"}>
        {status === "loading" && (
          <ol className={styles.list} aria-label="Loading posts">
            {[0, 1, 2].map((i) => (
              <li key={i} className={`${styles.post} ${styles.skeleton}`}>
                <span className={styles.skelAvatar} />
                <span className={styles.skelLines}>
                  <span />
                  <span />
                  <span />
                </span>
              </li>
            ))}
          </ol>
        )}

        {status === "error" && (
          <div className={styles.state} role="alert">
            {supabase ? (
              <>
                <p className={styles.stateTitle}>The wall didn’t load</p>
                <p>Check your connection and try again.</p>
                <button type="button" className={styles.retry} onClick={load}>
                  <ArrowPathIcon aria-hidden="true" /> Try again
                </button>
              </>
            ) : (
              <>
                <p className={styles.stateTitle}>Not connected yet</p>
                <p>
                  Add the Supabase URL and anon key to <code>.env.local</code> (see the README), then restart the dev
                  server.
                </p>
              </>
            )}
          </div>
        )}

        {status === "ready" && posts.length === 0 && (
          <div className={styles.state}>
            <ChatBubbleLeftRightIcon className={styles.stateIcon} aria-hidden="true" />
            <p className={styles.stateTitle}>The wall is empty</p>
            <p>Be the first to write on {firstName}’s wall.</p>
          </div>
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
