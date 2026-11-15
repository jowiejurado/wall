"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/lib/posts";
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

  return (
    <li className={styles.post} data-fresh={fresh || undefined}>
      <p className={styles.author}>{post.name}</p>
      {post.message && <p className={styles.text}>{post.message}</p>}
      {post.image_url && (
        <a href={post.image_url} target="_blank" rel="noreferrer" className={styles.photo}>
          {/* eslint-disable-next-line @next/next/no-img-element -- user photos of unknown size, already served from Supabase's CDN */}
          <img src={post.image_url} alt={`Photo shared by ${post.name}`} loading="lazy" />
        </a>
      )}
      <time className={styles.time} dateTime={post.created_at} title={full.format(new Date(post.created_at))} suppressHydrationWarning>
        {timeAgo(post.created_at, now)}
      </time>
    </li>
  );
}
