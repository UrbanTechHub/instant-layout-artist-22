import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export const TelegramSettings = () => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');

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

    localStorage.setItem('TELEGRAM_BOT_TOKEN', botToken);
    localStorage.setItem('TELEGRAM_CHAT_ID', chatId);
    
    toast({
      title: "Success",
      description: "Telegram settings saved successfully",
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Telegram Settings</h2>
      <div className="space-y-2">
        <label className="text-sm font-medium">Bot Token</label>
        <Input
          type="password"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder="Enter your Telegram bot token"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Chat ID</label>
        <Input
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Enter your Telegram chat ID"
        />
      </div>
      <Button onClick={handleSave} className="w-full">
        Save Settings
      </Button>
    </div>
  );
};