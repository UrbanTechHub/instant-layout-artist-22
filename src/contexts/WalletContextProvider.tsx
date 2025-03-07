
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Use reliable public Solana mainnet RPC endpoints that don't require API keys
  const endpoints = useMemo(() => [
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com", 
    "https://rpc.ankr.com/solana",
    "https://solana.public-rpc.com"
  ], []);
  
  // Cycle through endpoints if one fails
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  // Optimized connection configuration
  const config = useMemo(() => ({
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
    skipPreflight: false,
    wsEndpoint: undefined, // Disable WebSocket to avoid connection issues
    httpHeaders: {
      "Content-Type": "application/json"
    },
  }), []);
  
  // Support multiple wallets for better user experience
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter()
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
