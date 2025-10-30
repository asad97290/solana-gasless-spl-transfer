

"use client"

import React, { useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import * as web3 from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
const Home: React.FC = () => {

  const { publicKey: address, wallet,signTransaction } = useWallet();
  const token = new web3.PublicKey("DtQSKSJB4oNYKg3doEjAkkT1C7sPqJp6vaPs68KGEm1j")
  const DEVNET_RPC = "https://api.devnet.solana.com";
  const connectionID = new web3.Connection(DEVNET_RPC, "confirmed");

  // State for form inputs
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState("");
  const [error, setError] = useState("");



  const createTransferSPL = async () => {
    if (!address || !signTransaction) {
      setError("Please connect your wallet first");
      return;
    }

    if (!recipient) {
      setError("Please enter recipient address");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");
    setTxSignature("");

    try {
      // Validate recipient address
      const recipientPubkey = new web3.PublicKey(recipient);

      // Get sender's token account
      const senderTokenAccount = await getAssociatedTokenAddress(
        token,
        address
      );

      // Get recipient's token account
      const recipientTokenAccount = await getAssociatedTokenAddress(
        token,
        recipientPubkey
      );

      // Check if recipient token account exists
      const recipientAccountInfo = await connectionID.getAccountInfo(recipientTokenAccount);

      // Create transaction
      const transaction = new Transaction();

      // If recipient token account doesn't exist, create it
      if (!recipientAccountInfo) {
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          address, // payer (user will sign, but fee payer will actually pay)
          recipientTokenAccount,
          recipientPubkey,
          token
        );
        transaction.add(createATAInstruction);
      }

      // Add SPL token transfer instruction
      // Convert amount to smallest unit (assuming 9 decimals for this token)
      const amountInSmallestUnit = parseFloat(amount) * Math.pow(10, 6);

      const transferInstruction = createTransferInstruction(
        senderTokenAccount,    // source
        recipientTokenAccount, // destination
        address,              // owner of source account
        amountInSmallestUnit  // amount in smallest unit
      );

      transaction.add(transferInstruction);

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connectionID.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = new web3.PublicKey("CrepGjpjjaHiXEPhEw2rLywEtjgR9sRvL3LfUrPQq9im");

      // User signs the transaction
      const signedTransaction = await signTransaction(transaction)
      // Serialize the signed transaction
      const serializedTransaction = signedTransaction.serialize({
        requireAllSignatures: false, // Allow partial signatures
        verifySignatures: false,
      });

      // Send to backend API
      const response = await fetch("/api/gasless", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction: Array.from(serializedTransaction), // Convert to array for JSON
          blockhash: blockhash,
          lastValidBlockHeight: lastValidBlockHeight,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Transaction failed");
      }

      setTxSignature(result.signature);
      setAmount("");
      setRecipient("");

    } catch (err: any) {
      console.error("Transfer error:", err);
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  }



 
  const WalletMultiButton = dynamic(
    () =>
      import("@solana/wallet-adapter-react-ui").then(
        (mod) => mod.WalletMultiButton
      ),
    { ssr: false }
  );
  return (
    <main className="">
      <div className="container">
        <h4 className="text-white font-Goose text-[48px] text-center header [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]">
        GasLess SPL token Transfer
        </h4>
        <div className="max-w-[540px] max-sm:bg-primary max-sm:rounded-[10px] max-sm:border-2 max-sm:border-black  w-full mx-auto relative  py-10 max-[500px]:py-4 max-[500px]:px-6 ps-8 pr-9">

          <WalletMultiButton />

          {/* recipient address */}
          <div className="mt-5">
            <div>
              <p className="font-semibold text-base flex items-center gap-2">
                Recipient Address:
                <BsInfoCircle className="text-white/70 text-lg" />
              </p>
            </div>
            <input
              placeholder="Enter Solana address"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="bg-Secondry mt-3 raffle-input outline-none border placeholder:text-[#FFFFFF4D] border-black rounded-[10px] h-[62px] px-5 w-full"
            />
          </div>

          {/* amount  */}
          <div className="mt-5">
            <div>
              <p className="font-semibold text-base flex items-center gap-2">
                Amount:
                <BsInfoCircle className="text-white/70 text-lg" />
              </p>
            </div>
            <input
              placeholder="0.00"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-Secondry mt-3 raffle-input outline-none border placeholder:text-[#FFFFFF4D] border-black rounded-[10px] h-[62px] px-5 w-full"
            />
          </div>

          {/* error message */}
          {error && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500 rounded-[10px]">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* success message */}
          {txSignature && (
            <div className="mt-3 p-3 bg-green-500/20 border border-green-500 rounded-[10px]">
              <p className="text-green-500 text-sm">Transaction successful!</p>
              <a
                href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm underline break-all"
              >
                View on Solscan
              </a>
            </div>
          )}

          {/* submit  */}
          <div className="relative isolate w-fit mx-auto mt-5">

            <button
              className="w-[218px] h-[56px] rounded-[5px] bg-[#BF00A3] border-[2.8px] border-black text-white font-Goose text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => createTransferSPL()}
              disabled={loading}
            >
              {loading ? "Processing..." : "submit"}
            </button>
            <div className="w-[218px] h-[56px] bg-black rounded-[5px] absolute top-1 -right-1 z-[-1]" />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
