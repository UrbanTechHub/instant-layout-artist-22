
import React from 'react';

interface LoadingStateProps {
  isLoading: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl p-6 flex flex-col items-center shadow-2xl max-w-sm w-full mx-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse delay-75"></div>
          <div className="w-3 h-3 rounded-full bg-cyan-300 animate-pulse delay-150"></div>
        </div>
        
        <p className="text-white text-lg mt-4 font-medium">Connecting Wallet</p>
        <p className="text-gray-400 text-sm mt-2">Please confirm in your wallet</p>
      </div>
    </div>
  );
};

export default LoadingState;
