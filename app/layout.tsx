import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Staged — Approval, compiled into capability",
  description:
    "Turn one human-edited diff into a 60-second, empty-input WebMCP commit tool bound to the exact reviewed snapshot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={geistSans.variable + " " + geistMono.variable + " antialiased"}
      >
        {children}
      </body>
    </html>
  );
}
