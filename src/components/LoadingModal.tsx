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
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 pointer-events-none">
      {/* Completely hidden loading modal with minimal visual footprint */}
    </div>
  );
};

export default LoadingModal;
