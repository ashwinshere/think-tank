import type { Metadata } from "next";
import { Source_Serif_4, Manrope } from "next/font/google";
import "./globals.css";

const display = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "ThinkTank AI — Learn by thinking, not just by getting answers",
  description:
    "Autonomous AI learning peers that collaborate with you to solve problems and build critical thinking.",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-body bg-paper text-ink`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
