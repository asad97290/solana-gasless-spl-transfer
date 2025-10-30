
import dynamic from "next/dynamic";


  export const WalletMultiButton = dynamic(
    () =>
      import("@solana/wallet-adapter-react-ui").then(
        (mod) => mod.WalletMultiButton
      ),
    { ssr: false }
  );