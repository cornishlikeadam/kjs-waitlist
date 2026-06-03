import type { Metadata } from "next";
import { Rubik_Bubbles, Space_Grotesk } from "next/font/google";
import "./globals.css";

const rubikBubbles = Rubik_Bubbles({
  weight: "400",
  variable: "--font-bubbles",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KJ's Waitlist",
  description: "GO ON A DATE WITH KJ?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rubikBubbles.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
