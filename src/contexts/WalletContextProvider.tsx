
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Free, reliable RPC endpoints - avoid rate limits and 403 errors
  const endpoints = useMemo(() => [
    "https://solana-mainnet.rpc.extrnode.com", // ExtrNode public endpoint
    "https://api.devnet.solana.com", // Use devnet as fallback (more reliable than mainnet)
    "https://api.mainnet-beta.solana.com", // Official endpoint as last resort
  ], []);
  
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  // Optimized for reliability rather than speed
  const config = useMemo(() => ({
    commitment: 'confirmed' as const, // Using 'confirmed' for better reliability
    confirmTransactionInitialTimeout: 120000, // Increased timeout for more reliability (2 minutes)
    disableRetryOnRateLimit: false, // Enable retries on rate limits
    wsEndpoint: undefined, // Disable WebSocket to avoid connection issues
    skipPreflight: false, // Don't skip preflight checks for better reliability
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
