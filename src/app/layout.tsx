import type { Metadata } from "next";
import Link from 'next/link';
import "./globals.css";

export const metadata: Metadata = {
  title: 'NutriSnap AI',
  description: '画像アップロードと栄養アドバイス',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head />
      <body>
        <header className="p-4 bg-gray-800 text-white">
          <nav className="max-w-6xl mx-auto flex space-x-4">
            <Link href="/" className="hover:underline">
              アップロード
            </Link>
            <Link href="/chat" className="hover:underline">
              チャット
            </Link>
            <Link href="/auth" className="hover:underline">
              認証
            </Link>
          </nav>
        </header>
        <main className="p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
