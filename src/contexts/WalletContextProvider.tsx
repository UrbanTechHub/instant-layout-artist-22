
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { toast } from '@/components/ui/use-toast';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Simplified endpoint list - just use the most reliable ones
  const endpoint = useMemo(() => 
    "https://api.mainnet-beta.solana.com", 
  []);
  
  const config = useMemo(() => ({
    commitment: 'processed' as const, // Switch to processed for faster response
    confirmTransactionInitialTimeout: 30000, // Reduced from 60000 for faster feedback
  }), []);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={config}>
      <WalletProvider wallets={wallets} autoConnect onError={(error) => {
        console.error('Wallet error:', error);
        toast({
          title: "Connection Error",
          description: error.message || "Failed to connect wallet",
          variant: "destructive",
        });
      }}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
