import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget Manager",
  description: "Manage your budget like a pro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
