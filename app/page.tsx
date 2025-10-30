"use client"

import React, { useEffect, useState } from "react";
import * as web3 from "@solana/web3.js";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import { WalletMultiButton } from "@/src/components/ConnectWalletBtn";

const Home: React.FC = () => {
  if(!process.env.NEXT_PUBLIC_TOKEN_MINT || !process.env.NEXT_PUBLIC_FEE_PAYER_ADDRESS){
   return <div>Env not configured</div>
  }
  const token_mint = new web3.PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT)
  const fee_payer = new web3.PublicKey(process.env.NEXT_PUBLIC_FEE_PAYER_ADDRESS)
  const { publicKey, signTransaction } = useWallet();
  const {connection} = useConnection()

  // State for form inputs
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [decimals, setDecimals] = useState(9);
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState("");
  const [error, setError] = useState("");

  useEffect(()=>{
    async function fetchUserTokenBalanceAndDecimals() {
      if(publicKey && token_mint && connection){
      const data = await connection.getParsedTokenAccountsByOwner(publicKey!,{mint:token_mint})
      setTokenBalance(data.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount)
      setDecimals(data.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.decimals)
      }
    }
    fetchUserTokenBalanceAndDecimals()
  },[publicKey,txSignature])

  const createTransferSPL = async () => {
    if(amount > tokenBalance){
      setError("Insufficient token balance")
      return
    }
    if (!publicKey || !signTransaction) {
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
        token_mint,
        publicKey
      );

      // Get recipient's token account
      const recipientTokenAccount = await getAssociatedTokenAddress(
        token_mint,
        recipientPubkey
      );

      // Check if recipient token account exists
      const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);

      // Create transaction
      const transaction = new Transaction();

      // If recipient token account doesn't exist, create it
      if (!recipientAccountInfo) {
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          fee_payer, // payer (user will sign, but fee payer will actually pay)
          recipientTokenAccount,
          recipientPubkey,
          token_mint
        );
        transaction.add(createATAInstruction);
      }
      // Add SPL token transfer instruction
      // Convert amount to smallest unit (assuming 6 decimals for this token)
      const amountInSmallestUnit = parseFloat(amount) * Math.pow(10, decimals);

      const transferInstruction = createTransferInstruction(
        senderTokenAccount,    // source
        recipientTokenAccount, // destination
        publicKey,              // owner of source account
        amountInSmallestUnit  // amount in smallest unit
      );

      transaction.add(transferInstruction);

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = new web3.PublicKey(fee_payer);

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

  return (
    <main className="">
      <div className="container">
        <h4 className="text-white font-Goose text-[48px] text-center header [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]">
        GasLess SPL token Transfer
        </h4>
        <div className="max-w-[540px] max-sm:bg-primary max-sm:rounded-[10px] max-sm:border-2 max-sm:border-black  w-full mx-auto relative  py-10 max-[500px]:py-4 max-[500px]:px-6 ps-8 pr-9">

           <p className="font-semibold text-base flex items-center gap-2">
              Wallet:
              <WalletMultiButton />
              </p>

          {/* recipient address */}
          <div className="mt-5">
            <div>
              <p className="font-semibold text-base flex items-center gap-2">
                Recipient Address:
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
          <div>
            <span>Token Balance:</span>
            <span>{tokenBalance}</span>
          </div>

          {/* amount  */}
          <div className="mt-5">
            <div>
              <p className="font-semibold text-base flex items-center gap-2">
                Amount:
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
