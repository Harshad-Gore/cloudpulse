import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const plusJakarta = localFont({
  src: [
    { path: "../public/fonts/plus-jakarta-sans-400.ttf", weight: "400" },
    { path: "../public/fonts/plus-jakarta-sans-500.ttf", weight: "500" },
    { path: "../public/fonts/plus-jakarta-sans-600.ttf", weight: "600" },
    { path: "../public/fonts/plus-jakarta-sans-700.ttf", weight: "700" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: [
    { path: "../public/fonts/jetbrains-mono-400.ttf", weight: "400" },
    { path: "../public/fonts/jetbrains-mono-500.ttf", weight: "500" },
    { path: "../public/fonts/jetbrains-mono-600.ttf", weight: "600" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CloudPulse | Kubernetes Workload & Container Telemetry",
  description: "Containerized Next.js workload monitor for Docker and Kubernetes deployment.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
