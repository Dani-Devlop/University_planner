import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-ui-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-ui-mono",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-fa",
  subsets: ["arabic"],
});

/** Static-host asset prefix: GitHub Pages project site serves under /<repo>/, tgcloud at root */
const BP =
  process.env.NEXT_PUBLIC_TGCLOUD === "1"
    ? ""
    : process.env.NEXT_PUBLIC_STATIC === "1"
      ? "/University_planner"
      : "";

export const metadata: Metadata = {
  title: "WEEKLY//UNI — Terminal Schedule",
  description:
    "University schedule, markdown notes and exam tracker — deployed on a terminal aesthetic.",
  applicationName: "WEEKLY//UNI",
  manifest: `${BP}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    title: "WEEKLY//UNI",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: `${BP}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BP}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `${BP}/icons/icon-192.png`, sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${vazirmatn.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {/* Telegram Mini Apps SDK — loads everywhere, only active inside Telegram.
              When Serverless is present the app persists via tgcloud endpoints. */}
          <script src="https://telegram.org/js/telegram-web-app.js" async={false} />
          <script
            dangerouslySetInnerHTML={{
              __html:
                "if(window.Telegram&&window.Telegram.WebApp){try{window.Telegram.WebApp.ready();window.Telegram.WebApp.expand();" +
                "window.Telegram.WebApp.setHeaderColor&&window.Telegram.WebApp.setHeaderColor('#06080a');" +
                "window.Telegram.WebApp.setBackgroundColor&&window.Telegram.WebApp.setBackgroundColor('#06080a');" +
                "}catch(e){}}",
            }}
          />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
