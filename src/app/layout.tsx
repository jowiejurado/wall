import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { profile } from "@/content/profile";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(profile.site),
  title: `${profile.name} · Wall`,
  description: `Write on ${profile.name}'s wall. A 2008-style Facebook wall rebuilt with Next.js and Supabase.`,
  openGraph: {
    title: `Write on ${profile.name}'s wall`,
    description: "Leave a note, a photo or a GIF. Posts show up live.",
    images: [profile.photo],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
