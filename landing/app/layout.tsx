import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChefIApp™",
  description: "Sistema operacional para restaurantes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
