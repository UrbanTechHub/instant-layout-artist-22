
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Using the most reliable public RPC endpoints for Solana mainnet
  const endpoints = useMemo(() => [
    "https://api.mainnet-beta.solana.com", // Official endpoint
    "https://solana-api.projectserum.com", // Project Serum endpoint
    "https://rpc.ankr.com/solana", // Ankr endpoint (with some rate limits)
    "https://solana.public-rpc.com", // Another public endpoint
  ], []);
  
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  const config = useMemo(() => ({
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
    httpHeaders: {
      "Content-Type": "application/json",
    },
  }), []);
  
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
