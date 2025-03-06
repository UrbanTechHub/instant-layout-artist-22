
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Shield, Search, Key, AlertTriangle, Wallet, CheckCircle, Lock } from 'lucide-react';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';

const Index = () => {
  const { connected } = useWallet();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 gradient-text">
                Crypto Recovery & Security Solutions
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Professional assistance in recovering lost crypto funds, fixing wallet issues, and 
                enhancing your digital asset security.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!connected ? (
                  <WalletMultiButton className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity" />
                ) : (
                  <Link 
                    to="/recovery" 
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity text-center"
                  >
                    Start Recovery Process
                  </Link>
                )}
                <Link 
                  to="/contact" 
                  className="border border-white/20 bg-white/5 text-white px-6 py-3 rounded-xl text-lg font-medium hover:bg-white/10 transition-colors text-center"
                >
                  Contact Support
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px] mx-auto mb-6">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <Shield className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-6">Connect Your Wallet</h2>
                <p className="text-gray-400 text-center mb-8">
                  Connect your wallet to access our recovery services, security audit tools, and specialized support.
                </p>
                <div className="flex justify-center">
                  <WalletMultiButton className="glass-button text-cyan-400 py-4 px-8 rounded-xl text-xl font-semibold" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 bg-black/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              Our Services
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Comprehensive solutions for all your crypto security and recovery needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px] mb-6">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <service.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-400 mb-4">{service.description}</p>
                <Link 
                  to={service.link} 
                  className="text-cyan-400 flex items-center gap-2 hover:text-cyan-300 transition-colors"
                >
                  Learn more
                  <span className="text-xs">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our proven process to recover your crypto assets and secure your wallet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-cyan-500 to-transparent z-0"></div>
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 p-[2px] mb-6 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      <span className="text-2xl font-bold text-cyan-400">{index + 1}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-black/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              Success Stories
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              See how we've helped others recover their crypto assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.title}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.content}"</p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              Ready to Recover Your Crypto Assets?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Connect your wallet or contact our team to get started with your recovery process today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WalletMultiButton className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity" />
              <Link 
                to="/contact" 
                className="border border-white/20 bg-white/5 text-white px-6 py-3 rounded-xl text-lg font-medium hover:bg-white/10 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// Data
const services = [
  {
    title: "Crypto Fund Recovery",
    description: "We help recover lost or stolen cryptocurrency through advanced technical methods and legal channels.",
    icon: Search,
    link: "/recovery"
  },
  {
    title: "Wallet Security Audit",
    description: "Comprehensive audit of your wallet security practices with actionable recommendations.",
    icon: Shield,
    link: "/security"
  },
  {
    title: "Scam Reporting",
    description: "Report crypto scams and fraudulent activities to help protect the community.",
    icon: AlertTriangle,
    link: "/report"
  },
  {
    title: "Wallet Issue Resolution",
    description: "Technical support for wallet connectivity issues, transaction problems, and more.",
    icon: Wallet,
    link: "/wallet-support"
  },
  {
    title: "Private Key Recovery",
    description: "Specialized services to help recover lost or forgotten private keys and seed phrases.",
    icon: Key,
    link: "/key-recovery"
  },
  {
    title: "Security Consulting",
    description: "Expert advice on securing your digital assets and implementing best practices.",
    icon: Lock,
    link: "/consulting"
  }
];

const steps = [
  {
    title: "Connect Wallet",
    description: "Connect your wallet to start the recovery process securely or describe your issue in detail."
  },
  {
    title: "Security Assessment",
    description: "Our experts analyze your situation and provide a tailored recovery plan."
  },
  {
    title: "Recovery Process",
    description: "We implement advanced technical solutions to recover your assets or resolve wallet issues."
  }
];

const testimonials = [
  {
    name: "Alex T.",
    title: "Recovered 2.5 ETH",
    content: "After losing access to my wallet, I thought my crypto was gone forever. The team helped me recover everything within 48 hours!"
  },
  {
    name: "Sarah M.",
    title: "Recovered 15,000 USDT",
    content: "I was scammed but CryptoGuard helped track and recover most of my funds. Their expertise was invaluable."
  },
  {
    name: "Michael R.",
    title: "Fixed wallet connectivity",
    content: "I had persistent issues with my hardware wallet. Their technical team solved problems that no one else could fix."
  }
];

export default Index;
