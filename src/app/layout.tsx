import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/navigation/Sidebar";
import BottomNav from "@/components/navigation/BottomNav";
import NetworkStatus from "@/components/NetworkStatus";

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
        <NetworkStatus />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-h-screen p-4 md:p-8 md:ml-64">
            {children}
          </main>
        </div>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
