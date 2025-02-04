import { Settings, Menu } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-6 relative">
      {/* Top Navigation */}
      <nav className="flex justify-between items-center mb-20">
        {/* Logo */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 p-[2px]">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <span className="text-2xl font-bold text-cyan-400">π</span>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button className="circle-button">
            <Settings className="w-6 h-6 text-cyan-400" />
          </button>
          <button className="circle-button">
            <Menu className="w-6 h-6 text-cyan-400" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center gap-8 max-w-2xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold gradient-text leading-tight">
          Join The π Adventure
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-xl">
          Don't miss out! Click here to claim your exclusive π Token now and be part of the revolution!!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col w-full max-w-md gap-4 mt-4">
          <button className="glass-button text-cyan-400 py-4 px-8 rounded-xl text-xl font-semibold">
            Manual Connect
          </button>
          <button className="glass-button text-cyan-400 py-4 px-8 rounded-xl text-xl font-semibold">
            Connect Wallet
          </button>
        </div>
      </main>

      {/* Bottom Logo */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
        <div className="w-32 h-32 rounded-full bg-[#2A2F3F] flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-[#4B3979] flex items-center justify-center">
            <span className="text-5xl font-bold text-[#FFA500]">π</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;