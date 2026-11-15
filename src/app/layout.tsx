import type { Metadata, Viewport } from "next";
import { Kalam } from "next/font/google";
import { profile } from "@/content/profile";
import "./globals.css";

const hand = Kalam({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: `${profile.name} · Wall`,
  description: `Write on ${profile.name}'s wall. A 2008-style Facebook wall built with Next.js and Supabase.`,
};

export const viewport: Viewport = {
  themeColor: "#3b5998",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={hand.variable}>
      <body>{children}</body>
    </html>
  );
}
