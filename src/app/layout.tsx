import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Archivo_Black, JetBrains_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
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
      { url: "/images/display.png", sizes: "any", type: "image/png" },
    ],
    apple: [
      { url: "/images/display.png", sizes: "any", type: "image/png" },
    ],
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
