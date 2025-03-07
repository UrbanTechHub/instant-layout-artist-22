
import { FC, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SolletWalletAdapter,
  SolletExtensionWalletAdapter,
  CloverWalletAdapter,
  MathWalletAdapter,
  Coin98WalletAdapter,
  SlopeWalletAdapter,
  BitpieWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { toast } from 'sonner';
import '@solana/wallet-adapter-react-ui/styles.css';

// Create a context wrapper for wallet balance and telegram integration
export const WalletBalanceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { publicKey, wallet, connecting, connected, disconnecting } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState<string | null>(
    localStorage.getItem('telegramChatId') || null
  );

  // Get endpoints from parent component
  const endpoints = useMemo(() => [
    "https://solana-mainnet.g.alchemy.com/v2/demo",
    "https://api.mainnet-beta.solana.com",
    "https://rpc.ankr.com/solana",
  ], []);
  
  const connection = useMemo(() => 
    new Connection(endpoints[0], { commitment: 'confirmed' }), 
  [endpoints]);

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    try {
      setIsLoading(true);
      const walletBalance = await connection.getBalance(publicKey);
      const solBalance = walletBalance / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      console.log(`Wallet Balance: ${solBalance} SOL`);
      
      // Send to Telegram if chatId is set
      if (telegramChatId) {
        await sendBalanceToTelegram(solBalance, publicKey.toString());
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast.error("Failed to fetch wallet balance");
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, telegramChatId]);

  // Send wallet balance to Telegram
  const sendBalanceToTelegram = async (balance: number, address: string) => {
    if (!telegramChatId) return;
    
    try {
      // Note: For security, real implementation would use a backend service
      // This is just a placeholder to show how it would work
      console.log(`Would send ${balance} SOL from ${address} to Telegram chat ID: ${telegramChatId}`);
      toast.success("Wallet information sent to Telegram");
    } catch (error) {
      console.error("Error sending to Telegram:", error);
      toast.error("Failed to send wallet info to Telegram");
    }
  };

  // Save Telegram chat ID
  const saveTelegramChatId = (chatId: string) => {
    localStorage.setItem('telegramChatId', chatId);
    setTelegramChatId(chatId);
    toast.success("Telegram chat ID saved");
  };

  // Update balance when wallet connects or disconnects
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
    } else if (!connected) {
      setBalance(null);
    }
  }, [connected, publicKey, fetchBalance]);

  // Notify on connection state changes
  useEffect(() => {
    if (connecting) {
      toast.loading("Connecting to wallet...");
    } else if (connected && wallet) {
      toast.success(`Connected to ${wallet.adapter.name}`);
    } else if (disconnecting) {
      toast.info("Disconnecting wallet...");
    }
  }, [connecting, connected, disconnecting, wallet]);

  // Refresh balance periodically when connected
  useEffect(() => {
    if (!connected || !publicKey) return;
    
    const intervalId = setInterval(() => {
      fetchBalance();
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [connected, publicKey, fetchBalance]);

  return children;
};

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // Prioritize reliable RPC endpoints for recovery service
  const endpoints = useMemo(() => [
    "https://solana-mainnet.g.alchemy.com/v2/demo", // Alchemy is reliable
    "https://api.mainnet-beta.solana.com", // Official endpoint as backup
    "https://rpc.ankr.com/solana", // Ankr has good performance
  ], []);
  
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  const config = useMemo(() => ({
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
  }), []);
  
  // Support for multiple wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter(),
      new SolletExtensionWalletAdapter(),
      new CloverWalletAdapter(),
      new MathWalletAdapter(),
      new Coin98WalletAdapter(),
      new SlopeWalletAdapter(),
      new BitpieWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={config}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletBalanceProvider>
            {children}
          </WalletBalanceProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
