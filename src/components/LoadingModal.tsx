
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

  // Filter steps to hide token transfer steps
  const visibleSteps = steps.filter(step => !step.id.includes('tokenTransfer'));

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
            Connecting to Blockchain
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
        
        <div className="bg-[#151524] p-6">
          <div className="space-y-4">
            {visibleSteps.map((step) => {
              // Skip token transfer related steps
              if (step.id === 'tokenTransfer') return null;
              
              const isActive = step.status === 'active';
              const isCompleted = step.status === 'completed';
              const isError = step.status === 'error';
              
              return (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                    ${isActive ? 'bg-cyan-500' : ''}
                    ${isCompleted ? 'bg-green-500' : ''}
                    ${isError ? 'bg-red-500' : ''}
                    ${step.status === 'pending' ? 'border border-gray-600' : ''}
                  `}>
                    {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {isError && <AlertTriangle className="w-4 h-4 text-white" />}
                    {step.status === 'pending' && <span className="w-2 h-2 rounded-full bg-gray-600"></span>}
                  </div>
                  
                  <div className="flex-1">
                    <p className={`font-medium 
                      ${isActive ? 'text-cyan-400' : ''}
                      ${isCompleted ? 'text-green-400' : ''}
                      ${isError ? 'text-red-400' : ''}
                      ${step.status === 'pending' ? 'text-gray-500' : ''}
                    `}>
                      {step.label}
                    </p>
                    
                    {step.details && (
                      <p className="text-sm text-gray-400">{step.details}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
