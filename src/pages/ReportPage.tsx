
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from '@/components/ui/use-toast';

const ReportPage = () => {
  const { connected, publicKey } = useWallet();
  const [scamType, setScamType] = useState('');
  const [suspiciousAddress, setSuspiciousAddress] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet to submit a report.",
        variant: "destructive",
      });
      return;
    }
    
    if (!scamType) {
      toast({
        title: "Information Required",
        description: "Please select a scam type.",
        variant: "destructive",
      });
      return;
    }
    
    if (!details) {
      toast({
        title: "Information Required",
        description: "Please provide details about the incident.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      toast({
        title: "Report Submitted",
        description: "Thank you for helping protect the community. Our team will investigate this case.",
      });
      setIsSubmitting(false);
      setDetails('');
      setScamType('');
      setSuspiciousAddress('');
    }, 1500);
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            Report Crypto Fraud
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Help us combat scams and protect the crypto community by reporting suspicious activity
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Submit a Fraud Report</h2>
              
              {!connected ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px] mx-auto mb-6">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      <Shield className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Connect Your Wallet</h3>
                  <p className="text-gray-400 mb-6">
                    Please connect your wallet to proceed with the fraud report
                  </p>
                  <WalletMultiButton className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity" />
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                      Your Wallet (Reporter)
                    </label>
                    <div className="bg-white/10 rounded-lg p-3 text-gray-300 break-all">
                      {publicKey?.toString()}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                      Scam Type
                    </label>
                    <select 
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                      value={scamType}
                      onChange={(e) => setScamType(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select scam type</option>
                      <option value="phishing">Phishing Attempt</option>
                      <option value="fake_token">Fake Token/Airdrop</option>
                      <option value="ponzi">Ponzi Scheme</option>
                      <option value="fake_exchange">Fake Exchange/Website</option>
                      <option value="impersonation">Impersonation Scam</option>
                      <option value="giveaway">Fake Giveaway</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                      Suspicious Wallet Address (Optional)
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                      placeholder="Enter suspicious wallet address if applicable"
                      value={suspiciousAddress}
                      onChange={(e) => setSuspiciousAddress(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                      Detailed Description
                    </label>
                    <textarea 
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white min-h-[200px]"
                      placeholder="Please provide as much detail as possible about the scam..."
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
                          Submit Fraud Report
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold">Why Report Scams?</h2>
              </div>
              
              <p className="text-gray-300 mb-6">
                Your reports help us build a safer crypto ecosystem for everyone. We use this information to:
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 text-sm font-bold">1</span>
                  </div>
                  <p className="text-gray-300">Alert the community about emerging threats</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 text-sm font-bold">2</span>
                  </div>
                  <p className="text-gray-300">Work with exchanges to flag suspicious addresses</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 text-sm font-bold">3</span>
                  </div>
                  <p className="text-gray-300">Analyze scam patterns to improve protection systems</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 text-sm font-bold">4</span>
                  </div>
                  <p className="text-gray-300">Assist law enforcement in tracking crypto criminals</p>
                </li>
              </ul>
              
              <div className="border-t border-white/10 pt-6">
                <p className="text-gray-300 mb-4">Reporting is completely confidential and your personal details are never shared without consent.</p>
                <p className="text-cyan-400">Together we can make crypto safer!</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Common Scams to Watch For</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-5">
              <h3 className="font-bold text-lg mb-2">Phishing Websites</h3>
              <p className="text-gray-300 text-sm">
                Fake websites that mimic legitimate services to steal your login credentials or private keys.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-5">
              <h3 className="font-bold text-lg mb-2">Fake Airdrops</h3>
              <p className="text-gray-300 text-sm">
                Malicious tokens sent to your wallet that, when interacted with, can drain your funds.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-5">
              <h3 className="font-bold text-lg mb-2">Investment Scams</h3>
              <p className="text-gray-300 text-sm">
                Promises of unrealistic returns on crypto investments, often using pyramid or Ponzi structures.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-5">
              <h3 className="font-bold text-lg mb-2">Fake Support</h3>
              <p className="text-gray-300 text-sm">
                Scammers impersonating customer support staff who request your private keys or seed phrase.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-5">
              <h3 className="font-bold text-lg mb-2">Giveaway Scams</h3>
              <p className="text-gray-300 text-sm">
                Fake giveaways that ask you to send crypto to receive a larger amount in return.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-5">
              <h3 className="font-bold text-lg mb-2">Rug Pulls</h3>
              <p className="text-gray-300 text-sm">
                Projects that build hype, collect investment, then abandon the project and disappear with funds.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            Lost Funds to a Scam?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Our recovery specialists might be able to help you trace and recover your assets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/recovery" 
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity"
            >
              Explore Recovery Options
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportPage;
