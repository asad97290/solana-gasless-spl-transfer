import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";

const DEVNET_RPC = "https://api.devnet.solana.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transaction: serializedTxArray, blockhash, lastValidBlockHeight } = body;

    // Validate input
    if (!serializedTxArray || !Array.isArray(serializedTxArray)) {
      return NextResponse.json(
        { error: "Invalid transaction data" },
        { status: 400 }
      );
    }

    // Get fee payer wallet from environment variable
    const feePayerPrivateKey = process.env.FEE_PAYER_PRIVATE_KEY;
    if (!feePayerPrivateKey) {
      console.error("FEE_PAYER_PRIVATE_KEY not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create fee payer keypair from private key
    let feePayerKeypair: Keypair;
    try {
      const privateKeyBytes = bs58.decode(feePayerPrivateKey);
      feePayerKeypair = Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
      console.error("Failed to decode fee payer private key:", error);
      return NextResponse.json(
        { error: "Invalid fee payer configuration" },
        { status: 500 }
      );
    }

    // Deserialize the transaction
    const transactionBuffer = Buffer.from(serializedTxArray);
    const transaction = Transaction.from(transactionBuffer);

    transaction.feePayer = feePayerKeypair.publicKey;

    // Update blockhash if provided
    if (blockhash) {
      transaction.recentBlockhash = blockhash;
    }

    if (lastValidBlockHeight) {
      transaction.lastValidBlockHeight = lastValidBlockHeight;
    }

    // Validate transaction contains SPL token transfer
    const hasTokenTransfer = transaction.instructions.some((ix) => {
      const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      return ix.programId.toBase58() === TOKEN_PROGRAM_ID;
    });

    if (!hasTokenTransfer) {
      return NextResponse.json(
        { error: "Transaction must contain SPL token transfer instruction" },
        { status: 400 }
      );
    }



    // Create connection
    const connection = new Connection(DEVNET_RPC, "confirmed");

    // Verify fee payer has enough SOL for fees
    const balance = await connection.getBalance(feePayerKeypair.publicKey);
    const minBalance = 5000; // 0.000005 SOL minimum
    if (balance < minBalance) {
      console.error(`Fee payer balance too low: ${balance} lamports`);
      return NextResponse.json(
        { error: "Insufficient fee payer balance" },
        { status: 500 }
      );
    }

    // Sign transaction with fee payer
    transaction.partialSign(feePayerKeypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      }
    );

    // Wait for confirmation (optional - you can also just return signature immediately)
    await connection.confirmTransaction(
      {
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      },
      "confirmed"
    );

    console.log("Transaction sent successfully:", signature);

    return NextResponse.json(
      {
        success: true,
        signature,
        message: "Transaction sent successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing gasless transaction:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process transaction",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
