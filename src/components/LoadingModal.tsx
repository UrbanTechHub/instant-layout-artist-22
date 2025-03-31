
import React from 'react';
import { ChevronRight, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export type ConnectionStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';  // Added 'active' to the type
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
  const activeCount = steps.filter(step => step.status === 'active').length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  // Add token transfer specific messaging
  const isTokenTransferActive = steps.some(step => 
    step.id === 'tokenTransfer' && (step.status === 'active' || step.status === 'completed')
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
        
        <div className="bg-white dark:bg-gray-900 rounded-b-xl max-h-64 overflow-y-auto">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`border-b border-gray-200 dark:border-gray-800 py-2.5 px-4 flex flex-col ${
                step.status === 'active' ? 'bg-gray-50 dark:bg-gray-800/60' : ''
              } ${step.status === 'error' ? 'bg-red-50 dark:bg-red-900/20' : ''} transition-colors duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {step.status === 'active' ? (
                    <div className="mr-2 w-4 h-4 relative">
                      <div className="animate-ping absolute h-3 w-3 rounded-full bg-cyan-400 opacity-75"></div>
                      <div className="relative rounded-full h-3 w-3 bg-cyan-500"></div>
                    </div>
                  ) : (
                    <ChevronRight className={`mr-2 w-4 h-4 ${
                      step.status === 'active' ? 'text-cyan-500' : 
                      step.status === 'completed' ? 'text-green-500' : 
                      step.status === 'error' ? 'text-red-500' : 'text-gray-400'
                    }`} />
                  )}
                  <span className={`text-sm ${
                    step.status === 'active' ? 'text-black dark:text-white font-medium' : ''
                  } ${step.status === 'completed' ? 'text-green-600 dark:text-green-400' : ''
                  } ${step.status === 'error' ? 'text-red-600 dark:text-red-400' : ''
                  } ${step.status === 'pending' ? 'text-gray-600 dark:text-gray-400' : ''
                  }`}>
                    {step.label}
                  </span>
                </div>
                
                {/* Status indicators */}
                {step.status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {step.status === 'error' && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                {step.status === 'active' && step.id === 'tokenTransfer' && (
                  <div className="text-xs text-cyan-500">Processing...</div>
                )}
              </div>
              
              {/* Additional details */}
              {step.details && (
                <div className="ml-6 mt-1 flex items-start">
                  <Info className="w-3 h-3 text-gray-400 mr-1 mt-0.5" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {step.details}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
