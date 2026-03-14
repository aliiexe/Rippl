import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Rippl — Your team, one signal away.",
  description:
    "Rippl is a universal group communication and event command center for organizers, community leads, and team managers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={inter.variable}
        suppressHydrationWarning
      >
        <body className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] antialiased font-sans">
          {children}
          <ToasterProvider />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
