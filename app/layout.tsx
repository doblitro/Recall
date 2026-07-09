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

const title = "Recall";
const description = "Search everything you've ever connected.";

export const metadata: Metadata = {
  metadataBase: new URL("https://recall.juliennepanes.workers.dev"),
  title: {
    default: title,
    template: `%s · ${title}`,
  },

  description,

  applicationName: title,

  icons: {
    icon: "/icon.svg",
  },

  authors: [
    {
      name: "Julienne Panes",
    },
  ],

  creator: "Julienne Panes",

  keywords: [
    title,
    "Personal Search Engine",
    "Search",
    "Knowledge Management",
    "Google Drive",
    "Gmail",
    "GitHub",
    "Notion",
    "Productivity",
    "Full-Text Search",
  ],

  openGraph: {
    title: title,
    description,
    url: "https://recall.juliennepanes.workers.dev",
    siteName: title,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: title,
    description,
    images: ["/preview.png"],
  },
};

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
