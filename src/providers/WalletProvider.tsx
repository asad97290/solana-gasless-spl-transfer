'use client'

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { Cluster, clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css"; // Import default styles

const WalletContextProvider = ({ children }: {
  children: React.ReactNode,
}) => {
  if(!process.env.NEXT_PUBLIC_NETWORK){
    throw new Error("NEXT_PUBLIC_NETWORK env is not set")
  }
  const network = clusterApiUrl(process.env.NEXT_PUBLIC_NETWORK as Cluster); // Use 'mainnet-beta' for production

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};


export default WalletContextProvider;
