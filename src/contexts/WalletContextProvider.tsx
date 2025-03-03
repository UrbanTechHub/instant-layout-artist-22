
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Use multiple mainnet fallbacks for better reliability
  const endpoint = useMemo(() => 
    "https://api.mainnet-beta.solana.com",
    []
  );
  
  const config = useMemo(() => ({
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 120000, // Increase timeout to 2 minutes
    disableRetryOnRateLimit: false,
    wsEndpoint: "wss://api.mainnet-beta.solana.com", // WebSocket endpoint for better connection
    httpHeaders: { // Add custom headers to reduce rate limit issues
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
