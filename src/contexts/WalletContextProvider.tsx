
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Prioritize fastest and most reliable RPC endpoints
  const endpoints = useMemo(() => [
    "https://solana-mainnet.g.alchemy.com/v2/demo", // Alchemy is often faster
    "https://rpc.ankr.com/solana", // Ankr has good performance
    "https://api.mainnet-beta.solana.com", // Official endpoint as fallback
    "https://ssc-dao.genesysgo.net", // GenesysGo is often reliable
    "https://solana-api.projectserum.com",
    "https://free.rpcpool.com",
    "https://solana.public-rpc.com",
    "https://mainnet.rpcpool.com",
  ], []);
  
  const endpoint = useMemo(() => endpoints[0], [endpoints]);
  
  const config = useMemo(() => ({
    commitment: 'processed' as const, // Using 'processed' for fastest confirmation
    confirmTransactionInitialTimeout: 15000, // Reduced to 15000ms (15s) for much faster timeouts
    disableRetryOnRateLimit: false,
    wsEndpoint: "wss://api.mainnet-beta.solana.com",
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
