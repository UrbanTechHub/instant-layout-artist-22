
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
    "https://solana-mainnet.g.alchemy.com/v2/demo",
    "https://rpc.ankr.com/solana",
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com", 
    "https://free.rpcpool.com",
    "https://solana.public-rpc.com",
    "https://mainnet.rpcpool.com",
    "https://ssc-dao.genesysgo.net",
  ], []);
  
  // Use the first endpoint as default, fallbacks are handled in walletUtils.ts
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  const config = useMemo(() => ({
    commitment: 'confirmed' as const, // Use 'confirmed' for balance accuracy and speed
    confirmTransactionInitialTimeout: 60000, // Reduce timeout to 1 minute
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
