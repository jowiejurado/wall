"use client";

import { FaceSmileIcon, GifIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { prepareImage } from "@/lib/image";
import { createPost, MAX_MESSAGE, MAX_NAME, MAX_PHOTO_BYTES, PhotoUploadError, type Gif, type Post } from "@/lib/posts";
import { Avatar } from "./Avatar";
import { CharCounter } from "./CharCounter";
import { GifPicker } from "./GifPicker";
import styles from "./Composer.module.css";

const EmojiPanel = dynamic(() => import("./EmojiPanel"), {
  ssr: false,
  loading: () => <div className={styles.panelLoading}>Loading emoji…</div>,
});

const NAME_KEY = "wall-name";
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Media = { kind: "photo"; file: File; preview: string } | { kind: "gif"; gif: Gif } | null;
type Panel = "emoji" | "gif" | null;

type Props = {
  owner: string;
  onPosted: (post: Post) => void;
  disabled: boolean;
};

/** Counts characters the way Postgres does (code points), so an emoji counts as one. */
const lengthOf = (text: string) => [...text].length;

export function Composer({ owner, onPosted, disabled }: Props) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<Media>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justShared, setJustShared] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const ids = useId();
  const firstName = owner.split(" ")[0];

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

  // Grow the textarea with its content instead of scrolling inside it.
  useLayoutEffect(() => {
    const el = messageRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  // Free the photo preview's object URL when it's replaced or removed.
  useEffect(() => {
    if (media?.kind !== "photo") return;
    const url = media.preview;
    return () => URL.revokeObjectURL(url);
  }, [media]);

  // Close an open picker on Escape or a click outside the composer.
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setPanel(null);
    const onDown = (e: PointerEvent) => {
      if (!formRef.current?.contains(e.target as Node)) setPanel(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [panel]);

  const used = lengthOf(message);
  const hasContent = message.trim().length > 0 || media !== null;
  const canShare = !disabled && !sending && hasContent && used <= MAX_MESSAGE;

  async function attachPhoto(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("That file type isn’t supported. Use a JPG, PNG, WebP or GIF.");
      return;
    }
    const prepared = await prepareImage(file);
    if (prepared.size > MAX_PHOTO_BYTES) {
      setError("That image is over 5 MB. Pick a smaller one.");
      return;
    }
    setMedia({ kind: "photo", file: prepared, preview: URL.createObjectURL(prepared) });
    setPanel(null);
  }

  function removeMedia() {
    setMedia(null);
    if (fileRef.current) fileRef.current.value = "";
    messageRef.current?.focus();
  }

  function insertEmoji(emoji: string) {
    const el = messageRef.current;
    const at = caret.current ?? el?.selectionStart ?? message.length;
    const next = message.slice(0, at) + emoji + message.slice(at);
    setMessage(next);
    caret.current = at + emoji.length;
    requestAnimationFrame(() => {
      el?.setSelectionRange(caret.current!, caret.current!);
    });
  }

  function togglePanel(next: Panel) {
    caret.current = messageRef.current?.selectionStart ?? null;
    setPanel((current) => (current === next ? null : next));
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!canShare) return;

    if (!name.trim()) {
      setError("Add your name so people know who wrote this.");
      nameRef.current?.focus();
      return;
    }

    setSending(true);
    setError(null);
    setPanel(null);
    try {
      const post = await createPost({
        name,
        message,
        photo: media?.kind === "photo" ? media.file : null,
        gif: media?.kind === "gif" ? media.gif : null,
      });
      onPosted(post);
      setMessage("");
      setMedia(null);
      if (fileRef.current) fileRef.current.value = "";
      setJustShared(true);
      setTimeout(() => setJustShared(false), 2200);
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        // Not saved for next time; posting still worked.
      }
    } catch (err) {
      setError(err instanceof PhotoUploadError ? err.message : "Your post didn’t go through. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSubmit();
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const file = [...event.clipboardData.files].find((f) => f.type.startsWith("image/"));
    if (file) {
      event.preventDefault();
      attachPhoto(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLFormElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) attachPhoto(event.dataTransfer.files[0]);
  }

  return (
    <form
      ref={formRef}
      className={styles.composer}
      onSubmit={handleSubmit}
      onDragOver={(e) => {
        if ([...e.dataTransfer.types].includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={handleDrop}
      data-dragging={dragging || undefined}
      aria-busy={sending}
    >
      <div className={styles.row}>
        <Avatar name={name} size={44} />

        <div className={styles.body}>
          <label className={styles.nameLine}>
            <span>Posting as</span>
            <input
              ref={nameRef}
              type="text"
              value={name}
              maxLength={MAX_NAME}
              placeholder="your name"
              autoComplete="name"
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              disabled={disabled}
              aria-invalid={error?.startsWith("Add your name") || undefined}
              size={Math.max(name.length, 9)}
            />
          </label>

          <label className={styles.srOnly} htmlFor={`${ids}-message`}>
            Write on {owner}’s wall
          </label>
          <textarea
            ref={messageRef}
            id={`${ids}-message`}
            className={styles.message}
            placeholder={`Say hi to ${firstName}… 👋`}
            value={message}
            rows={1}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onSelect={(e) => (caret.current = e.currentTarget.selectionStart)}
            disabled={disabled}
          />

          {media && (
            <div className={styles.attachment} data-kind={media.kind}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview or GIPHY CDN */}
              <img
                src={media.kind === "photo" ? media.preview : media.gif.url}
                alt={media.kind === "photo" ? "Photo to attach" : media.gif.title}
              />
              {media.kind === "gif" && <span className={styles.badge}>GIF</span>}
              <button type="button" className={styles.remove} onClick={removeMedia} aria-label={`Remove ${media.kind}`}>
                <XMarkIcon aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {panel && (
        <div className={styles.panel} role="dialog" aria-label={panel === "emoji" ? "Pick an emoji" : "Pick a GIF"}>
          {panel === "emoji" ? (
            <EmojiPanel onPick={insertEmoji} />
          ) : (
            <GifPicker
              onPick={(gif) => {
                setMedia({ kind: "gif", gif });
                setPanel(null);
                messageRef.current?.focus();
              }}
            />
          )}
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.tools}>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className={styles.srOnly}
            onChange={(e) => attachPhoto(e.target.files?.[0])}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            className={styles.tool}
            data-tone="mint"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            aria-label="Add a photo"
            title="Photo"
          >
            <PhotoIcon aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.tool}
            data-tone="grape"
            onClick={() => togglePanel("gif")}
            disabled={disabled}
            aria-label="Add a GIF"
            aria-expanded={panel === "gif"}
            title="GIF"
          >
            <GifIcon aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.tool}
            data-tone="sun"
            onClick={() => togglePanel("emoji")}
            disabled={disabled}
            aria-label="Add an emoji"
            aria-expanded={panel === "emoji"}
            title="Emoji"
          >
            <FaceSmileIcon aria-hidden="true" />
          </button>
        </div>

        <div className={styles.send}>
          <span className={styles.hint} aria-hidden="true">
            Ctrl + Enter
          </span>
          <CharCounter used={used} max={MAX_MESSAGE} />
          <button type="submit" className={styles.share} disabled={!canShare} data-done={justShared || undefined}>
            {sending ? (
              <>
                <span className={styles.spinner} aria-hidden="true" /> Sharing
              </>
            ) : justShared ? (
              "Shared!"
            ) : (
              "Share"
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {dragging && <div className={styles.dropzone}>Drop your photo here</div>}
    </form>
  );
}
