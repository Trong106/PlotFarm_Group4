import type { Metadata } from 'next';
import './globals.css';
import ToastContainer from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'PlotFarm - Smart Farming & Plot Rental Platform',
  description: 'Nền tảng trực tuyến cho thuê ô đất canh tác và nông nghiệp thông minh',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        <AuthProvider>
          <ToastContainer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
