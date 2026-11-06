import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KaVa — KASSEP Field Survey Platform",
  description: "KASSEP Household Pregnancy and Outcome Assessment (DMAF Kano State)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const params = new URLSearchParams(window.location.search);
                const urlTheme = params.get('theme');
                const storedTheme = localStorage.getItem('theme');
                if (urlTheme === 'dark' || (!urlTheme && storedTheme === 'dark')) {
                  document.documentElement.classList.add('dark');
                } else if (urlTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
