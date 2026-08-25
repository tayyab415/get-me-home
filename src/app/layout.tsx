import type { Metadata } from "next";
import { Big_Shoulders_Display, Fraunces, Noto_Sans_Devanagari } from "next/font/google";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import "./globals.css";

const display = Big_Shoulders_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-ticket",
  weight: ["400", "600", "700"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Get Me Home — independent hackathon prototype",
  description:
    "Independent hackathon prototype of a citizen train journey. Mock data only. Not affiliated with IRCTC or Indian Railways.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${fraunces.variable} ${notoDevanagari.variable}`}
    >
      <body>
        <PrototypeBanner />
        {children}
      </body>
    </html>
  );
}
