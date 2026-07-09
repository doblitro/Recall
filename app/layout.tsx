import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import Providers from "./providers/Providers";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`min-h-full flex flex-col ${geist.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
