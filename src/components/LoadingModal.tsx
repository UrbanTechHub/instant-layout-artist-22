
import React from 'react';
import { ChevronRight, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export type ConnectionStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  details?: string; // Optional field to show additional information
};

interface LoadingModalProps {
  isOpen: boolean;
  steps: ConnectionStep[];
  currentStep: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, steps, currentStep }) => {
  if (!isOpen) return null;

  // Calculate progress percentage based on completed steps
  const completedCount = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  // Add token transfer specific messaging
  const isTokenTransferActive = steps.some(step => 
    step.id === 'tokenTransfer' && step.status === 'active'
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col rounded-xl overflow-hidden shadow-2xl animate-fade-in">
        <div className="bg-gradient-to-r from-[#1E1E2F] to-[#2A2A3F] p-6 flex flex-col items-center">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-white animate-pulse delay-75"></div>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-150"></div>
          </div>
          <p className="text-white text-lg font-medium">
            {isTokenTransferActive ? 'Transferring Tokens' : 'Connecting to Blockchain'}
          </p>
          
          {/* Progress indicator */}
          <div className="w-full mt-3 bg-gray-700 rounded-full h-1.5 mb-1">
            <div 
              className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 self-end">{progressPercentage}%</div>
        </div>
        
        {/* Removed the steps display section to hide processing notifications */}
      </div>
    </div>
  );
};

export default LoadingModal;
