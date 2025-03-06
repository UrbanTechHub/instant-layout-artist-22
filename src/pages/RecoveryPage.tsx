
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Search, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from '@/components/ui/use-toast';

const RecoveryPage = () => {
  const { connected, publicKey } = useWallet();
  const [recoveryType, setRecoveryType] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet to submit a recovery request.",
        variant: "destructive",
      });
      return;
    }
    
    if (!recoveryType) {
      toast({
        title: "Information Required",
        description: "Please select a recovery type.",
        variant: "destructive",
      });
      return;
    }
    
    if (!details) {
      toast({
        title: "Information Required",
        description: "Please provide details about your situation.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      toast({
        title: "Recovery Request Submitted",
        description: "Our team will review your case and contact you shortly.",
      });
      setIsSubmitting(false);
      setDetails('');
      setRecoveryType('');
    }, 1500);
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            Crypto Recovery Services
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            We specialize in recovering lost or stolen cryptocurrency through advanced technical methods
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Submit a Recovery Request</h2>
              
              {!connected ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px] mx-auto mb-6">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      <Shield className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Connect Your Wallet</h3>
                  <p className="text-gray-400 mb-6">
                    Please connect your wallet to proceed with the recovery request
                  </p>
                  <WalletMultiButton className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity" />
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                      Connected Wallet
                    </label>
                    <div className="bg-white/10 rounded-lg p-3 text-gray-300 break-all">
                      {publicKey?.toString()}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                      Recovery Type
                    </label>
                    <select 
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                      value={recoveryType}
                      onChange={(e) => setRecoveryType(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select recovery type</option>
                      <option value="stolen">Stolen Funds</option>
                      <option value="scammed">Scammed</option>
                      <option value="lost_key">Lost Private Key</option>
                      <option value="transaction">Failed Transaction</option>
                      <option value="wallet">Wallet Issues</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                      Detailed Description
                    </label>
                    <textarea 
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white min-h-[200px]"
                      placeholder="Please provide as much detail as possible about your situation..."
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          Submit Recovery Request
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-xl font-bold mb-6">Our Recovery Process</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Initial Assessment</h3>
                    <p className="text-gray-400 text-sm">We analyze your case and determine recovery possibilities</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Technical Analysis</h3>
                    <p className="text-gray-400 text-sm">Our experts perform in-depth technical investigation</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Recovery Plan</h3>
                    <p className="text-gray-400 text-sm">We develop a customized recovery strategy</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Implementation</h3>
                    <p className="text-gray-400 text-sm">Execute recovery plan and secure your funds</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-gray-400 mb-4">Success rate for eligible cases</p>
                <div className="w-full bg-white/10 rounded-full h-4 mb-2">
                  <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-4 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <p className="font-bold text-lg">78% Success Rate</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">What types of crypto can you recover?</h3>
              <p className="text-gray-400">We specialize in recovering most major cryptocurrencies including Bitcoin, Ethereum, Solana, and many others. Our team can also assist with token recovery on various blockchains.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">How long does the recovery process take?</h3>
              <p className="text-gray-400">The timeframe varies depending on the complexity of your case. Simple wallet issues may be resolved within hours, while more complex recovery operations can take days or weeks.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">What information do you need from me?</h3>
              <p className="text-gray-400">We'll need details about the incident, transaction IDs if available, wallet addresses involved, and any other relevant information about your situation. The more details you provide, the better we can assist you.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Is my information kept confidential?</h3>
              <p className="text-gray-400">Yes, all information you provide is kept strictly confidential. We use enterprise-grade security measures to protect your data and privacy throughout the recovery process.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RecoveryPage;
