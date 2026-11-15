import { NextResponse, type NextRequest } from "next/server";
import type { Gif } from "@/lib/posts";

// Proxies GIPHY so the API key stays on the server.
// GET /api/gifs          → trending
// GET /api/gifs?q=cats   → search

type GiphyImage = { url: string; webp?: string; width: string; height: string };
type GiphyItem = {
  id: string;
  title: string;
  images: { fixed_width: GiphyImage; downsized_medium?: GiphyImage; original: GiphyImage };
};

export async function GET(request: NextRequest) {
  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GIFs aren’t set up yet." }, { status: 503 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 50);
  const params = new URLSearchParams({ api_key: key, limit: "24", rating: "pg", bundle: "messaging_non_clips" });
  if (q) params.set("q", q);
  const endpoint = `https://api.giphy.com/v1/gifs/${q ? "search" : "trending"}?${params}`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: q ? 3600 : 600 } });
    if (!res.ok) throw new Error(`GIPHY responded ${res.status}`);
    const { data } = (await res.json()) as { data: GiphyItem[] };

    const gifs: Gif[] = data.map((item) => {
      const full = item.images.downsized_medium ?? item.images.original;
      return {
        id: item.id,
        title: item.title || "GIF",
        preview: item.images.fixed_width.webp || item.images.fixed_width.url,
        url: full.url,
        width: Number(full.width),
        height: Number(full.height),
      };
    });

    return NextResponse.json({ gifs });
  } catch {
    return NextResponse.json({ error: "Couldn’t reach GIPHY. Try again." }, { status: 502 });
  }
}
