import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { getCurrentUser } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  applicationName: "apty",
  title: { default: "apty", template: "%s · apty" },
  description: "Chores, lists, and meal prep for the apartment.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "apty" },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1815" },
  ],
};

// Sets the theme class before first paint to avoid a flash.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('apty-theme');
    var dark = stored ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${fraunces.variable} antialiased`}>
        <ServiceWorkerRegister />
        <AppShell user={{ name: user.name ?? "You", email: user.email, color: user.color }}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
