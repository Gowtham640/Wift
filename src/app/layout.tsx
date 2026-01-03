import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { registerSW } from "./sw-register";

// Register SW immediately at module level
if (typeof window !== 'undefined') {
  registerSW();
}

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Track your fitness journey with ease",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
