
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Shield, Key, Wallet, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

const SecurityPage = () => {
  const { connected, publicKey } = useWallet();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);
  
  const startSecurityScan = () => {
    if (!connected) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet to perform a security scan.",
        variant: "destructive",
      });
      return;
    }
    
    setIsScanning(true);
    setScanComplete(false);
    
    // Simulate a security scan
    setTimeout(() => {
      const score = Math.floor(Math.random() * 41) + 60; // Random score between 60-100
      setSecurityScore(score);
      setIsScanning(false);
      setScanComplete(true);
      
      toast({
        title: "Security Scan Complete",
        description: `Your wallet security score is ${score}/100.`,
      });
    }, 3000);
  };
  
  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            Wallet Security Solutions
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Protect your crypto assets with our comprehensive security services
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Wallet Security Scanner</h2>
              
              {!connected ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px] mx-auto mb-6">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      <Shield className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Connect Your Wallet</h3>
                  <p className="text-gray-400 mb-6">
                    Connect your wallet to perform a comprehensive security scan
                  </p>
                  <WalletMultiButton className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity" />
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-white font-medium">
                        Connected Wallet
                      </label>
                      {scanComplete && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-400 mr-2">Security Score:</span>
                          <span className={`text-sm font-bold ${
                            securityScore >= 80 ? 'text-green-400' : 
                            securityScore >= 60 ? 'text-yellow-400' : 
                            'text-red-400'
                          }`}>{securityScore}/100</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-gray-300 break-all">
                      {publicKey?.toString()}
                    </div>
                  </div>
                  
                  {scanComplete ? (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Security Assessment Results</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Transaction History</span>
                            <span className={`text-sm ${securityScore > 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {securityScore > 70 ? 'Safe' : 'Caution'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {securityScore > 70 
                              ? 'No suspicious transactions detected in your recent history.'
                              : 'Some unusual transaction patterns detected. Review recent activity.'}
                          </p>
                        </div>
                        
                        <div className="bg-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Connected dApps</span>
                            <span className={`text-sm ${securityScore > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {securityScore > 80 ? 'Low Risk' : 'Medium Risk'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {securityScore > 80 
                              ? 'Your wallet has connections only to well-known trusted dApps.'
                              : 'Your wallet is connected to some dApps that require review.'}
                          </p>
                        </div>
                        
                        <div className="bg-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Token Approvals</span>
                            <span className={`text-sm ${
                              securityScore > 90 ? 'text-green-400' : 
                              securityScore > 70 ? 'text-yellow-400' : 
                              'text-red-400'
                            }`}>
                              {securityScore > 90 ? 'Secure' : securityScore > 70 ? 'Review Needed' : 'High Risk'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {securityScore > 90 
                              ? 'No risky token approvals detected.'
                              : securityScore > 70 
                                ? 'Some token approvals should be reviewed for security.'
                                : 'High-risk unlimited token approvals detected. Immediate action recommended.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <button 
                          onClick={startSecurityScan}
                          className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-lg font-medium transition-colors border border-white/10"
                        >
                          Scan Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      {isScanning ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-6"></div>
                          <h3 className="text-xl font-bold mb-4">Scanning Your Wallet</h3>
                          <p className="text-gray-400">
                            Analyzing transaction history, connections, and security settings...
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Shield className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
                          <h3 className="text-xl font-bold mb-4">Ready to Scan</h3>
                          <p className="text-gray-400 mb-6">
                            Our security scanner will analyze your wallet for potential vulnerabilities
                          </p>
                          <button 
                            onClick={startSecurityScan}
                            className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity"
                          >
                            Start Security Scan
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-xl font-bold mb-6">Security Services</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Vulnerability Assessment</h3>
                    <p className="text-gray-400 text-sm">Comprehensive scanning for security vulnerabilities</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Key className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Private Key Security</h3>
                    <p className="text-gray-400 text-sm">Best practices for securing private keys</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Wallet Hardening</h3>
                    <p className="text-gray-400 text-sm">Advanced configuration for maximum security</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">2FA Implementation</h3>
                    <p className="text-gray-400 text-sm">Setup multi-factor authentication where possible</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                <button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity">
                  Request Security Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Security Best Practices</h2>
            </div>
            
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Use hardware wallets for storing significant amounts of crypto</p>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Enable two-factor authentication on all exchanges and services</p>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Store seed phrases offline in secure, multiple locations</p>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Use strong, unique passwords for all crypto-related accounts</p>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Regularly review connected applications and revoke unnecessary access</p>
              </li>
            </ul>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Common Security Threats</h2>
            </div>
            
            <ul className="space-y-4">
              <li className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Phishing attempts via fake websites and emails</p>
              </li>
              <li className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Malware designed to steal private keys and seed phrases</p>
              </li>
              <li className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Fake mobile apps impersonating legitimate wallets</p>
              </li>
              <li className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Social engineering attacks through social media and messaging</p>
              </li>
              <li className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">SIM swapping attacks to bypass 2FA on exchange accounts</p>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            Need Personalized Security Assistance?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Our security experts can help you implement a comprehensive security plan tailored to your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity">
              Schedule a Consultation
            </button>
            <button className="border border-white/20 bg-white/5 text-white px-6 py-3 rounded-xl text-lg font-medium hover:bg-white/10 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SecurityPage;
