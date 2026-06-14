import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MaintenanceProvider } from "@/components/MaintenanceProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bahria Orchard | Localized Social Media & Utility Platform",
  description: "A secure, hyper-local peer-to-peer social ecosystem and marketplace designed exclusively for the residents of Bahria Orchard.",
};

type Theme = "light" | "dark";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the theme from cookie to prevent client-side SSR layout flashes
  const cookieStore = await cookies();
  const theme = (cookieStore.get("theme")?.value || "light") as Theme;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${theme} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: theme }}
    >
      <head>
        {/* Blocking script to immediately set the user's preferred theme color class before first render paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = document.cookie.match(/theme=([^;]+)/)?.[1] || 'light';
                document.documentElement.classList.add(theme);
                document.documentElement.classList.remove(theme === 'dark' ? 'light' : 'dark');
                document.documentElement.style.colorScheme = theme;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body 
        suppressHydrationWarning
        className="min-h-full bg-white text-slate-900 dark:bg-black dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200 antialiased"
      >
        <ThemeProvider initialTheme={theme}>
          <MaintenanceProvider>
            {children}
          </MaintenanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
