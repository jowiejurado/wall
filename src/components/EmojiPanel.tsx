"use client";

import EmojiPicker from "emoji-picker-react";

/** Loaded on demand (see Composer) so the picker's data isn't in the first page load. */
export default function EmojiPanel({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <EmojiPicker
      onEmojiClick={(data) => onPick(data.emoji)}
      colorScheme="light"
      width="100%"
      height={360}
      previewConfig={{ showPreview: false }}
      searchPlaceholder="Search emoji"
    />
  );
}
