import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import "./globals.css";

// Self-hosted woff2 files (src/app/fonts) so dev/build never hits the
// network — next/font/google broke behind TLS-intercepting AV/proxies
// ("unable to verify the first certificate"). Variable families ship a
// single wght-axis file; Archivo Black and Bebas Neue are static 400.
const geistSans = localFont({
  variable: "--font-geist-sans",
  src: "./fonts/geist-latin-wght-normal.woff2",
  display: "swap",
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  src: "./fonts/geist-mono-latin-wght-normal.woff2",
  display: "swap",
});

const archivoBlack = localFont({
  variable: "--font-archivo-black",
  src: "./fonts/archivo-black-latin-400-normal.woff2",
  weight: "400",
  display: "swap",
});

const jetbrainsMono = localFont({
  variable: "--font-jetbrains-mono",
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  display: "swap",
});

const bebasNeue = localFont({
  variable: "--font-bebas-neue",
  src: "./fonts/bebas-neue-latin-400-normal.woff2",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GymTimer Pro",
  description: "Temporizador de entrenamientos para gimnasio, sin backend.",
  applicationName: "GymTimer",
  appleWebApp: {
    capable: true,
    title: "GymTimer Pro",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
