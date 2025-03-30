
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { toast } from '@/components/ui/use-toast';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Multiple mainnet RPC endpoints for better reliability
  const endpoints = useMemo(() => [
    "https://api.mainnet-beta.solana.com",
    "https://solana-mainnet.g.alchemy.com/v2/demo",
    "https://rpc.ankr.com/solana",
    "https://solana-api.projectserum.com", 
    "https://free.rpcpool.com",
  ], []);
  
  // State to track the current endpoint and connection status
  const [currentEndpoint, setCurrentEndpoint] = useState(endpoints[0]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Test connections and use the fastest one
  useEffect(() => {
    async function testConnections() {
      let fastestEndpoint = currentEndpoint;
      let fastestTime = Infinity;
      
      const testResults = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
          const startTime = performance.now();
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getHealth',
              }),
              signal: AbortSignal.timeout(3000), // 3 second timeout
            });
            
            if (response.ok) {
              const endTime = performance.now();
              const responseTime = endTime - startTime;
              console.log(`RPC ${endpoint} response time: ${responseTime}ms`);
              return { endpoint, responseTime };
            }
            throw new Error(`Endpoint ${endpoint} returned ${response.status}`);
          } catch (error) {
            console.warn(`Endpoint ${endpoint} check failed:`, error);
            return { endpoint, responseTime: Infinity };
          }
        })
      );
      
      testResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.responseTime < fastestTime) {
          fastestTime = result.value.responseTime;
          fastestEndpoint = result.value.endpoint;
        }
      });
      
      if (fastestEndpoint !== currentEndpoint) {
        console.log(`Switching to faster endpoint: ${fastestEndpoint}`);
        setCurrentEndpoint(fastestEndpoint);
      }
    }
    
    // Only run this if we've had a previous connection attempt
    if (connectionAttempts > 0) {
      testConnections();
    }
  }, [endpoints, connectionAttempts, currentEndpoint]);
  
  const config = useMemo(() => ({
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000, // Reduced from 120000 for faster feedback
    disableRetryOnRateLimit: false,
    wsEndpoint: undefined, // Don't use WebSocket for initial connection (faster)
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
  
  // Track when a wallet actually connects and increment the counter
  const onWalletConnected = useCallback(() => {
    setConnectionAttempts(prev => prev + 1);
  }, []);

  return (
    <ConnectionProvider endpoint={currentEndpoint} config={config}>
      <WalletProvider wallets={wallets} autoConnect onError={(error) => {
        console.error('Wallet error:', error);
        toast({
          title: "Wallet Connection Error",
          description: error.message || "Failed to connect wallet",
          variant: "destructive",
        });
      }}>
        <WalletModalProvider>
          {children}
          {/* Hidden component to track wallet connection */}
          <WalletConnectionTracker onConnected={onWalletConnected} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Helper component to track wallet connections
const WalletConnectionTracker: FC<{ onConnected: () => void }> = ({ onConnected }) => {
  const { connected } = useWallet();
  
  useEffect(() => {
    if (connected) {
      onConnected();
    }
  }, [connected, onConnected]);
  
  return null;
};

// Import at the top
import { useWallet } from '@solana/wallet-adapter-react';
