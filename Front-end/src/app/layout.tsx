import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlotFarm",
  description: "Nền tảng quản lý nông trại thông minh và cho thuê đất trồng.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
