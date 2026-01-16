import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://focusmask.app"),
  title: "Focus Mask | Focus on what matters",
  description:
    "Eliminate distractions and focus on specific areas of your screen. The ultimate browser extension for deep work and concentration.",
  openGraph: {
    title: "Focus Mask | Focus on what matters",
    description:
      "Eliminate distractions and focus on specific areas of your screen.",
    url: "https://focusmask.app",
    siteName: "Focus Mask",
    images: [
      {
        url: "/og-image.jpg", // Placeholder
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} font-sans antialiased text-text-main`}
      >
        {children}
      </body>
    </html>
  );
}
