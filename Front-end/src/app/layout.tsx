import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PlotFarm - Smart Farming & Plot Rental Platform',
  description: 'Nền tảng trực tuyến cho thuê ô đất canh tác và nông nghiệp thông minh - Team 4',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
