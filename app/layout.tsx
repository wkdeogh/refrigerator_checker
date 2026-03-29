import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomTabBar } from "@/app/_components/bottom-tab-bar";
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
  title: "우리집 냉장고 소비기한",
  description: "식품 소비기한을 등록하고 임박 순으로 관리하는 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-100 pb-24">
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
