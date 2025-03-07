
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
import { FALLBACK_ENDPOINTS } from '@/utils/walletUtils';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Use the fallback endpoints from walletUtils
  const endpoints = useMemo(() => FALLBACK_ENDPOINTS, []);
  
  // Use mainnet endpoint first for proper balance fetching
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
