import type { Metadata } from "next";
import {
  DM_Sans,
  Geist,
  Geist_Mono,
  Hanken_Grotesk,
  Inter,
  JetBrains_Mono,
  Libre_Franklin,
  Source_Serif_4,
} from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import DeployWatcher from "@/components/DeployWatcher";
import { StoreThemeProvider } from "@/components/StoreThemeProvider";
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

const adminDisplay = Hanken_Grotesk({
  variable: "--font-admin-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const adminBody = Inter({
  variable: "--font-admin-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const adminMono = JetBrains_Mono({
  variable: "--font-admin-mono",
  subsets: ["latin"],
  weight: ["500"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${storeClassic.variable} ${storeModern.variable} ${storeElegant.variable} ${adminDisplay.variable} ${adminBody.variable} ${adminMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('store_theme');document.documentElement.setAttribute('data-store-theme',t==='dark'?'dark':'light');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <StoreThemeProvider>
          <CartProvider>{children}</CartProvider>
        </StoreThemeProvider>
        <DeployWatcher />
      </body>
    </html>
  );
}
