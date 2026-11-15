"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/lib/posts";
import { Avatar } from "./Avatar";
import styles from "./Wall.module.css";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const full = new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" });

function timeAgo(iso: string, now: number): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  if (Math.abs(seconds) < 45) return "just now";
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(Math.round(seconds / 60), "minute");
}

/** Re-renders once a minute so "2 minutes ago" stays true. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export function PostItem({ post, fresh }: { post: Post; fresh: boolean }) {
  const now = useNow();
  const media = post.image_url ?? post.gif_url;

  return (
    <li className={styles.post} data-fresh={fresh || undefined}>
      <Avatar name={post.name} size={44} />
      <div className={styles.postBody}>
        <p className={styles.meta}>
          <span className={styles.author}>{post.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.created_at} title={full.format(new Date(post.created_at))} suppressHydrationWarning>
            {timeAgo(post.created_at, now)}
          </time>
        </p>
        {post.message && <p className={styles.text}>{post.message}</p>}
        {media && (
          <a href={media} target="_blank" rel="noreferrer" className={styles.media} data-gif={post.gif_url ? true : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user media of unknown size from Supabase / GIPHY CDNs */}
            <img src={media} alt={post.gif_url ? `GIF shared by ${post.name}` : `Photo shared by ${post.name}`} loading="lazy" />
            {post.gif_url && <span className={styles.badge}>GIF</span>}
          </a>
        )}
      </div>
    </li>
  );
}
