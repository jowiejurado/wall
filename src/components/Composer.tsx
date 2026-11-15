"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { createPost, MAX_MESSAGE, MAX_NAME, MAX_PHOTO_BYTES, type Post } from "@/lib/posts";
import styles from "./Wall.module.css";

const NAME_KEY = "wall-name";

type Props = {
  owner: string;
  onPosted: (post: Post) => void;
  disabled: boolean;
};

export function Composer({ owner, onPosted, disabled }: Props) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const ids = useId();

  // Remember the visitor's name between posts and visits.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved value on mount
      if (saved) setName(saved);
    } catch {
      // Storage blocked: they just type it again.
    }
  }, []);

  // Free the preview's object URL when it changes or the form unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const remaining = MAX_MESSAGE - message.length;
  const hasContent = message.trim().length > 0 || photo !== null;
  const canShare = !disabled && !sending && name.trim().length > 0 && hasContent && remaining >= 0;

  function pickPhoto(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn’t an image. Pick a JPG, PNG, WebP or GIF.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("That photo is over 5 MB. Pick a smaller one.");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    setPhoto(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!canShare) return;

    setSending(true);
    setError(null);
    try {
      const post = await createPost({ name, message, photo });
      onPosted(post);
      setMessage("");
      clearPhoto();
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        // Not saved for next time; posting still worked.
      }
      messageRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error && err.message.includes("photo") ? err.message : "Your post didn’t go through. Try again.");
    } finally {
      setSending(false);
    }
  }

  // Ctrl/Cmd + Enter shares, like most chat boxes.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSubmit();
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <label className={styles.srOnly} htmlFor={`${ids}-message`}>
        Write on {owner}’s wall
      </label>
      <textarea
        ref={messageRef}
        id={`${ids}-message`}
        className={styles.message}
        placeholder={`Write something to ${owner.split(" ")[0]}…`}
        value={message}
        maxLength={MAX_MESSAGE}
        rows={3}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-describedby={`${ids}-count`}
      />

      {preview && (
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={preview} alt="Photo to attach" />
          <button type="button" className={styles.removePhoto} onClick={clearPhoto} aria-label="Remove photo">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      )}

      <div className={styles.composerBar}>
        <label className={styles.nameField}>
          <span>From</span>
          <input
            type="text"
            value={name}
            maxLength={MAX_NAME}
            placeholder="Your name"
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
            required
          />
        </label>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className={styles.srOnly}
          id={`${ids}-photo`}
          onChange={(e) => pickPhoto(e.target.files?.[0])}
          disabled={disabled}
          tabIndex={-1}
        />
        <button type="button" className={styles.photoButton} onClick={() => fileRef.current?.click()} disabled={disabled}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 6.5h3l1.5-2h5L14 6.5h3v9H3z" />
            <circle cx="10" cy="11" r="2.8" />
          </svg>
          {photo ? "Change photo" : "Photo"}
        </button>

        <span
          id={`${ids}-count`}
          className={styles.count}
          data-low={remaining <= 20 || undefined}
          aria-label={`${remaining} characters left`}
        >
          {remaining}
        </span>

        <button type="submit" className={styles.share} disabled={!canShare}>
          {sending ? "Sharing…" : "Share"}
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
