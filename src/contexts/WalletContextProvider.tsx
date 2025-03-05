
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Ultra-optimized RPC endpoints prioritizing speed
  const endpoints = useMemo(() => [
    "https://solana-mainnet.g.alchemy.com/v2/demo", // Alchemy is typically fastest
    "https://rpc.ankr.com/solana", // Ankr has good performance
    "https://api.mainnet-beta.solana.com", // Official endpoint as fallback
  ], []);
  
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  // Even more optimized configuration for maximum speed
  const config = useMemo(() => ({
    commitment: 'processed' as const, // Using 'processed' for fastest confirmation
    confirmTransactionInitialTimeout: 8000, // Further reduced to 8s for faster response
    disableRetryOnRateLimit: false,
    wsEndpoint: "wss://api.mainnet-beta.solana.com",
    skipPreflight: true, // Skip preflight for much faster transactions
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
