
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Multiple mainnet RPC endpoints for better reliability
  const endpoints = useMemo(() => [
    "https://api.mainnet-beta.solana.com",
    "https://solana-mainnet.g.alchemy.com/v2/demo",
    "https://solana-api.projectserum.com", 
    "https://rpc.ankr.com/solana",
    "https://free.rpcpool.com",
  ], []);
  
  // Use the first endpoint as default, fallbacks are handled in walletUtils.ts
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  const config = useMemo(() => ({
    commitment: 'confirmed' as const, // Use 'confirmed' for better balance reliability
    confirmTransactionInitialTimeout: 180000, // Increase timeout to 3 minutes
    disableRetryOnRateLimit: false,
    wsEndpoint: "wss://api.mainnet-beta.solana.com", // WebSocket endpoint
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
