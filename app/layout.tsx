import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";

import { LocaleProvider } from "../contexts/LocaleContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Minimalist Baby Tracker",
  description: "A modern, mobile-first baby tracking PWA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`bg-surface text-ink ${vazir.variable}`}
        suppressHydrationWarning
      >
        <LocaleProvider>
          <ThemeProvider>
            <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28 pt-6">
              {children}
            </div>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

