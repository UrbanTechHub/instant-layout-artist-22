
import React from 'react';
import { ChevronRight } from 'lucide-react';

export type ConnectionStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
};

interface LoadingModalProps {
  isOpen: boolean;
  steps: ConnectionStep[];
  currentStep: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, steps, currentStep }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-[#1E1E2F] p-6 flex flex-col items-center">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-white animate-pulse delay-75"></div>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-150"></div>
          </div>
          <p className="text-white text-lg">Connecting to Blockchain..</p>
        </div>
        
        <div className="bg-white rounded-b-xl max-h-64 overflow-y-auto">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`border-b border-gray-200 py-2 px-3 flex items-center ${
                step.status === 'active' ? 'bg-gray-50' : ''
              } ${step.status === 'error' ? 'bg-red-50' : ''}`}
            >
              <ChevronRight className={`mr-2 w-4 h-4 ${
                step.status === 'active' ? 'text-cyan-500' : 
                step.status === 'completed' ? 'text-green-500' : 
                step.status === 'error' ? 'text-red-500' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${
                step.status === 'active' ? 'text-black font-medium' : ''
              } ${step.status === 'completed' ? 'text-green-600' : ''
              } ${step.status === 'error' ? 'text-red-600' : ''
              } ${step.status === 'pending' ? 'text-gray-600' : ''
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
