import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import DeployWatcher from "@/components/DeployWatcher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Hatira Niyat | E-Ticaret',
  description: 'Hatira Niyat online magaza',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <DeployWatcher />
      </body>
    </html>
  );
}
