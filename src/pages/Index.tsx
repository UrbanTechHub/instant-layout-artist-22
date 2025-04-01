
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Menu } from "lucide-react";
import LoadingState from '@/components/LoadingState';

const Index = () => {
  const { publicKey, connecting, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const [isConnecting, setIsConnecting] = useState(false);

  // Simplified connection handler
  const handleWalletConnected = async () => {
    if (!connected || !publicKey || isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      toast({
        title: "Connected",
        description: "Your wallet has been connected successfully.",
      });
      
      // Request wallet connection permissions here
      // This approach is much faster since we're not doing multiple operations
      
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      handleWalletConnected();
    }
  }, [connected, publicKey]);

  return (
    <div className="min-h-screen bg-background p-6 relative">
      {/* Simple loading indicator instead of the modal with steps */}
      <LoadingState isLoading={connecting || isConnecting} />
      
      <nav className="flex justify-between items-center mb-20">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 p-[2px]">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <span className="text-2xl font-bold text-cyan-400">π</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button className="circle-button">
            <Menu className="w-6 h-6 text-cyan-400" />
          </button>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center gap-8 max-w-2xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold gradient-text leading-tight">
          Join The π Adventure
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-xl">
          Don't miss out! Click here to claim your exclusive π Token now and be part of the revolution!
        </p>

        <div className="flex flex-col items-center w-full max-w-md gap-4 mt-4">
          <div className="flex justify-center w-full">
            <WalletMultiButton 
              className="glass-button text-cyan-400 py-4 px-8 rounded-xl text-xl font-semibold" 
            />
          </div>
        </div>

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
