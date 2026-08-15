import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VOWX | Custom Love Story Websites",
  description:
    "VOWX — custom, personalized love story websites crafted from your photos and memories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
