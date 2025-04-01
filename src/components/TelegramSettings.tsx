
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

export const TelegramSettings = () => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved credentials on mount
    const savedBotToken = localStorage.getItem('TELEGRAM_BOT_TOKEN');
    const savedChatId = localStorage.getItem('TELEGRAM_CHAT_ID');
    if (savedBotToken) setBotToken(savedBotToken);
    if (savedChatId) setChatId(savedChatId);
  }, []);

  const handleSave = () => {
    if (!botToken || !chatId) {
      toast({
        title: "Error",
        description: "Please fill in both fields",
        variant: "destructive",
      });
      return;
    }

    // Simple validation
    if (!botToken.includes(':')) {
      toast({
        title: "Error",
        description: "Bot token appears to be invalid. It should contain a colon (:)",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('TELEGRAM_BOT_TOKEN', botToken);
    localStorage.setItem('TELEGRAM_CHAT_ID', chatId);
    
    toast({
      title: "Success",
      description: "Telegram settings saved successfully",
    });
  };

  return (
    <div className="p-6 min-h-screen bg-background">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-cyan-400 hover:text-cyan-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      </div>
      
      <div className="space-y-6 p-6 border rounded-lg max-w-md mx-auto mt-4 bg-card shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Telegram Settings</h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Bot Token</label>
          <Input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="Enter your Telegram bot token"
            className="border-gray-300"
          />
          <p className="text-xs text-gray-500">Create a bot with @BotFather on Telegram and copy the token here</p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Chat ID</label>
          <Input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="Enter your Telegram chat ID"
            className="border-gray-300"
          />
          <p className="text-xs text-gray-500">Use @userinfobot on Telegram to get your chat ID</p>
        </div>
        
        <Button onClick={handleSave} className="w-full bg-cyan-500 hover:bg-cyan-600">
          Save Settings
        </Button>
        
        <div className="mt-8 p-4 bg-muted rounded-md">
          <h3 className="text-sm font-medium mb-2">How to set up:</h3>
          <ol className="text-xs text-gray-500 list-decimal ml-4 space-y-1">
            <li>Open Telegram and search for @BotFather</li>
            <li>Send /newbot and follow instructions to create a bot</li>
            <li>Copy the API token and paste it above</li>
            <li>Start your bot by searching for it and clicking Start</li>
            <li>Use @userinfobot to get your chat ID</li>
            <li>Save settings and return to the main page</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
