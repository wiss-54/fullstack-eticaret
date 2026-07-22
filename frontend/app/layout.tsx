import type { Metadata } from "next";
import { DM_Sans, Geist, Geist_Mono, Libre_Franklin, Source_Serif_4 } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
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

const storeClassic = Libre_Franklin({
  variable: "--font-store-classic",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const storeModern = DM_Sans({
  variable: "--font-store-modern",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const storeElegant = Source_Serif_4({
  variable: "--font-store-elegant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: 'EticaretShop | E-Ticaret',
  description: 'EticaretShop online magaza',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} ${storeClassic.variable} ${storeModern.variable} ${storeElegant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <CartProvider>
          {children}
        </CartProvider>
        <DeployWatcher />
      </body>
    </html>
  );
}
