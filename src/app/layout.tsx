import type { Metadata, Viewport } from "next";
import "./globals.css";
// Global styles imported above

export const metadata: Metadata = {
  title: "Cooking Planner",
  description: "Plan your weekly meals",
};

export const viewport: Viewport = {
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
      <body>{children}</body>
    </html>
  );
}
