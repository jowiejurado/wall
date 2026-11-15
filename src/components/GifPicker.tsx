"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import type { Gif } from "@/lib/posts";
import styles from "./Composer.module.css";

type State =
  | { kind: "loading" }
  | { kind: "ready"; gifs: Gif[] }
  | { kind: "error"; message: string };

const SUGGESTIONS = ["hello", "thank you", "congrats", "coffee", "coding", "lol"];

export function GifPicker({ onPick }: { onPick: (gif: Gif) => void }) {
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [state, setState] = useState<State>({ kind: "loading" });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show loading while the new search runs
    setState({ kind: "loading" });
    fetch(`/api/gifs${term ? `?q=${encodeURIComponent(term)}` : ""}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn’t load GIFs.");
        setState({ kind: "ready", gifs: body.gifs });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setState({ kind: "error", message: err.message });
      });
    return () => controller.abort();
  }, [term]);

  return (
    <div className={styles.gifPicker}>
      <label className={styles.gifSearch}>
        <MagnifyingGlassIcon aria-hidden="true" />
        <span className={styles.srOnly}>Search GIFs</span>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search GIPHY"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {!query && (
        <div className={styles.gifChips}>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setQuery(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className={styles.gifResults} aria-live="polite" aria-busy={state.kind === "loading"}>
        {state.kind === "loading" && (
          <div className={styles.gifGrid}>
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className={styles.gifSkeleton} />
            ))}
          </div>
        )}
        {state.kind === "error" && <p className={styles.gifNote}>{state.message}</p>}
        {state.kind === "ready" && state.gifs.length === 0 && (
          <p className={styles.gifNote}>No GIFs for “{term}”. Try another word.</p>
        )}
        {state.kind === "ready" && state.gifs.length > 0 && (
          <div className={styles.gifGrid}>
            {state.gifs.map((gif) => (
              <button key={gif.id} type="button" className={styles.gifItem} onClick={() => onPick(gif)} title={gif.title}>
                {/* eslint-disable-next-line @next/next/no-img-element -- GIPHY CDN animation */}
                <img src={gif.preview} alt={gif.title} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <p className={styles.giphy}>Powered by GIPHY</p>
    </div>
  );
}
