import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verifica catastale post-interventi",
  description: "Strumento guidato per orientare la verifica di aggiornamento catastale dopo interventi edilizi e impiantistici.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
