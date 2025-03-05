
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Use fastest RPC endpoints first
  const endpoints = useMemo(() => [
    "https://solana-mainnet.g.alchemy.com/v2/demo", // Alchemy is typically faster
    "https://rpc.ankr.com/solana", // Ankr has good performance
    "https://api.mainnet-beta.solana.com", // Official endpoint as fallback
  ], []);
  
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  // Highly optimized configuration for speed
  const config = useMemo(() => ({
    commitment: 'processed' as const, // Using 'processed' for fastest confirmation
    confirmTransactionInitialTimeout: 10000, // Reduced to 10s for faster response
    disableRetryOnRateLimit: false,
    wsEndpoint: "wss://api.mainnet-beta.solana.com",
    httpHeaders: {
      "Content-Type": "application/json",
    },
  }), []);
  
  // Preload wallet adapter
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
