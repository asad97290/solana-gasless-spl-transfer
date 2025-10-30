import type { Metadata } from "next";
import { Exo, Galindo } from "next/font/google";
import "./globals.css";
// import AppKitProvider from "@/src/components/appkit";
import WalletContextProvider from "@/src/components/WalletProvider";
import { Toaster } from "react-hot-toast";

const exo = Exo({ subsets: ["latin"] });

const galindo = Galindo({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-galindo",
});

export const metadata: Metadata = {
  title: "",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${exo.className} ${galindo.variable}`}>
        <WalletContextProvider>
          <Toaster />
          {children}
        </WalletContextProvider>

      </body>
    </html>
  );
}
