
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Ultra-optimized RPC endpoints prioritizing speed and reliability
  const endpoints = useMemo(() => [
    "https://api.mainnet-beta.solana.com", // Official endpoint as primary (most reliable)
    "https://solana-mainnet.g.alchemy.com/v2/demo", // Alchemy 
    "https://rpc.ankr.com/solana", // Ankr as backup
  ], []);
  
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  // Optimized for reliability and successful wallet data fetching
  const config = useMemo(() => ({
    commitment: 'confirmed' as const, // Using 'confirmed' for better reliability
    confirmTransactionInitialTimeout: 60000, // Increased timeout for more reliability
    disableRetryOnRateLimit: false,
    wsEndpoint: "wss://api.mainnet-beta.solana.com",
    skipPreflight: false, // Don't skip preflight for better reliability
    httpHeaders: {
      "Content-Type": "application/json",
    },
  }), []);
  
  // Preload wallet adapter for faster connection
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={config}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
