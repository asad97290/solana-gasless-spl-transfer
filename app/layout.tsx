import type { Metadata } from "next";
import { Exo, Galindo } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "@/src/providers/WalletProvider";

const exo = Exo({ subsets: ["latin"] });

const galindo = Galindo({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-galindo",
});

export const metadata: Metadata = {
  title: "GasLess SPL token Transfer",
  description: "GasLess SPL token Transfer",
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
          {children}
        </WalletContextProvider>

      </body>
    </html>
  );
}
